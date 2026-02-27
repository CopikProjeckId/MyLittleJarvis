// JARVIS ACP Session Manager
// Core orchestrator for agent sessions with full lifecycle management
// Based on OpenClaw's AcpSessionManager architecture

import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { createSessionStore } from './session-store.js';
import { requireRuntime, listRuntimes } from './runtime.js';
import { AcpRuntimeError, ACP_ERROR_CODES } from './types.js';

/**
 * Actor Queue - ensures sequential execution per session
 * Prevents race conditions in concurrent session operations
 */
class ActorQueue {
  constructor() {
    this.queues = new Map();
  }

  async run(actorKey, operation) {
    if (!this.queues.has(actorKey)) {
      this.queues.set(actorKey, Promise.resolve());
    }

    const previous = this.queues.get(actorKey);
    const current = previous.then(async () => {
      try {
        return await operation();
      } catch (error) {
        throw error;
      }
    }).catch(error => {
      throw error;
    });

    // Don't let the queue grow unbounded with rejected promises
    this.queues.set(actorKey, current.catch(() => {}));

    return current;
  }

  getPendingCount(actorKey) {
    return this.queues.has(actorKey) ? 1 : 0;
  }

  getTotalPendingCount() {
    return this.queues.size;
  }
}

/**
 * Runtime Cache - caches active runtime handles with TTL eviction
 */
class RuntimeCache {
  constructor() {
    this.cache = new Map();
    this.touchTimes = new Map();
  }

  set(key, state) {
    this.cache.set(key, state);
    this.touchTimes.set(key, Date.now());
  }

  get(key) {
    if (this.cache.has(key)) {
      this.touchTimes.set(key, Date.now());
      return this.cache.get(key);
    }
    return null;
  }

  has(key) {
    return this.cache.has(key);
  }

  clear(key) {
    this.cache.delete(key);
    this.touchTimes.delete(key);
  }

  size() {
    return this.cache.size;
  }

  getLastTouchedAt(key) {
    return this.touchTimes.get(key);
  }

  collectIdleCandidates(maxIdleMs, now = Date.now()) {
    const candidates = [];
    for (const [key, state] of this.cache.entries()) {
      const lastTouched = this.touchTimes.get(key) || 0;
      if (now - lastTouched > maxIdleMs) {
        candidates.push({ key, state, lastTouched });
      }
    }
    return candidates;
  }
}

/**
 * ACP Session Manager
 * Main orchestrator for agent session lifecycle
 */
export class AcpSessionManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      maxConcurrentSessions: options.maxConcurrentSessions || 100,
      idleTtlMs: options.idleTtlMs || 30 * 60 * 1000, // 30 minutes
      defaultBackend: options.defaultBackend || 'ollama',
      maxContextSize: options.maxContextSize || 50
    };

    this.sessionStore = createSessionStore({
      maxSessions: this.config.maxConcurrentSessions,
      idleTtlMs: this.config.idleTtlMs
    });

    this.actorQueue = new ActorQueue();
    this.runtimeCache = new RuntimeCache();
    this.activeTurns = new Map(); // sessionKey -> { abortController, startedAt, runtime, handle }

    // Statistics
    this.stats = {
      turnsCompleted: 0,
      turnsFailed: 0,
      totalLatencyMs: 0,
      maxLatencyMs: 0,
      errorsByCode: new Map()
    };

    // Start idle eviction timer
    this.evictionInterval = setInterval(() => {
      this.evictIdleRuntimes().catch(console.error);
    }, 60000); // Check every minute
  }

  /**
   * Resolve session state
   * @param {string} sessionKey
   * @returns {'none' | 'ready' | 'stale'}
   */
  resolveSessionState(sessionKey) {
    const session = this.sessionStore.getSessionByKey(sessionKey);
    if (!session) return 'none';
    if (session.state === 'error' && session.lastError) return 'stale';
    return 'ready';
  }

  /**
   * Initialize a new session
   * @param {Object} input
   * @param {string} input.sessionKey
   * @param {string} [input.agentId]
   * @param {string} [input.backend]
   * @param {import('./types.js').AcpSessionMode} [input.mode]
   * @param {string} [input.cwd]
   */
  async initializeSession(input) {
    const sessionKey = input.sessionKey?.trim();
    if (!sessionKey) {
      throw new AcpRuntimeError(ACP_ERROR_CODES.SESSION_INIT_FAILED, 'Session key is required');
    }

    const agentId = input.agentId || 'default';
    const backend = input.backend || this.config.defaultBackend;
    const mode = input.mode || 'persistent';

    await this.evictIdleRuntimes();

    return await this.actorQueue.run(sessionKey, async () => {
      // Get or create session
      const session = this.sessionStore.createSession({
        sessionKey,
        agentId,
        backend,
        mode,
        cwd: input.cwd
      });

      // Get runtime and ensure backend session
      const runtime = requireRuntime(backend);
      const handle = await runtime.ensureSession({
        sessionKey,
        agent: agentId,
        mode,
        cwd: input.cwd
      });

      // Cache runtime state
      this.runtimeCache.set(sessionKey, {
        runtime,
        handle,
        backend,
        agentId,
        mode
      });

      this.emit('session:initialized', { sessionKey, session, handle });

      return { session, runtime, handle };
    });
  }

  /**
   * Get session status
   * @param {string} sessionKey
   */
  async getSessionStatus(sessionKey) {
    const session = this.sessionStore.getSessionByKey(sessionKey);
    if (!session) {
      throw new AcpRuntimeError(ACP_ERROR_CODES.SESSION_NOT_FOUND, `Session not found: ${sessionKey}`);
    }

    const cached = this.runtimeCache.get(sessionKey);
    let runtimeStatus = null;

    if (cached) {
      try {
        runtimeStatus = await cached.runtime.getStatus({ handle: cached.handle });
      } catch {
        // Ignore status errors
      }
    }

    return {
      sessionKey,
      sessionId: session.sessionId,
      agentId: session.agentId,
      backend: session.backend,
      mode: session.mode,
      state: session.state,
      contextSize: session.context.length,
      createdAt: session.createdAt,
      lastActivityAt: session.lastTouchedAt,
      runtimeStatus,
      lastError: session.lastError
    };
  }

  /**
   * Run a conversation turn
   * @param {Object} input
   * @param {string} input.sessionKey
   * @param {string} input.text
   * @param {import('./types.js').AcpPromptMode} [input.mode]
   * @param {AbortSignal} [input.signal]
   * @param {Function} [input.onEvent]
   */
  async runTurn(input) {
    const sessionKey = input.sessionKey?.trim();
    if (!sessionKey) {
      throw new AcpRuntimeError(ACP_ERROR_CODES.SESSION_INIT_FAILED, 'Session key is required');
    }

    await this.evictIdleRuntimes();

    return await this.actorQueue.run(sessionKey, async () => {
      // Get or initialize session
      let session = this.sessionStore.getSessionByKey(sessionKey);
      let cached = this.runtimeCache.get(sessionKey);

      if (!session || !cached) {
        const init = await this.initializeSession({
          sessionKey,
          agentId: 'default',
          backend: this.config.defaultBackend,
          mode: 'persistent'
        });
        session = init.session;
        cached = this.runtimeCache.get(sessionKey);
      }

      const { runtime, handle } = cached;
      const requestId = randomUUID();
      const turnStartedAt = Date.now();

      // Set up abort handling
      const abortController = new AbortController();
      if (input.signal?.aborted) {
        abortController.abort();
      } else if (input.signal) {
        input.signal.addEventListener('abort', () => abortController.abort(), { once: true });
      }

      // Track active turn
      this.activeTurns.set(sessionKey, {
        abortController,
        startedAt: turnStartedAt,
        runtime,
        handle,
        requestId
      });

      this.sessionStore.setActiveRun(session.sessionId, requestId, abortController);

      let responseText = '';
      let turnError = null;

      try {
        // Add user message to context
        this.sessionStore.addToContext(session.sessionId, {
          role: 'user',
          content: input.text,
          timestamp: Date.now()
        }, this.config.maxContextSize);

        // Run turn
        for await (const event of runtime.runTurn({
          handle,
          text: input.text,
          mode: input.mode || 'prompt',
          requestId,
          signal: abortController.signal
        })) {
          // Emit event
          this.emit('turn:event', { sessionKey, event });

          // Call event handler if provided
          if (input.onEvent) {
            await input.onEvent(event);
          }

          // Collect response text
          if (event.type === 'text_delta' && event.text) {
            responseText += event.text;
          }

          // Handle errors
          if (event.type === 'error') {
            turnError = new AcpRuntimeError(
              event.code || ACP_ERROR_CODES.TURN_FAILED,
              event.message || 'Turn failed'
            );
            if (!event.retryable) {
              throw turnError;
            }
          }
        }

        // Add assistant response to context
        if (responseText) {
          this.sessionStore.addToContext(session.sessionId, {
            role: 'assistant',
            content: responseText,
            timestamp: Date.now()
          }, this.config.maxContextSize);
        }

        // Record success
        this.recordTurnCompletion(turnStartedAt);
        this.sessionStore.updateSessionState(session.sessionId, 'idle', { lastError: null });

        this.emit('turn:complete', {
          sessionKey,
          requestId,
          responseText,
          durationMs: Date.now() - turnStartedAt
        });

        return {
          sessionKey,
          requestId,
          responseText,
          durationMs: Date.now() - turnStartedAt
        };

      } catch (error) {
        const acpError = error instanceof AcpRuntimeError ? error : new AcpRuntimeError(
          ACP_ERROR_CODES.TURN_FAILED,
          error.message
        );

        this.recordTurnCompletion(turnStartedAt, acpError.code);
        this.sessionStore.updateSessionState(session.sessionId, 'error', {
          lastError: { code: acpError.code, message: acpError.message, at: Date.now() }
        });

        this.emit('turn:error', { sessionKey, error: acpError });
        throw acpError;

      } finally {
        // Clean up
        if (input.signal) {
          input.signal.removeEventListener('abort', () => abortController.abort());
        }
        this.activeTurns.delete(sessionKey);
        this.sessionStore.clearActiveRun(session.sessionId);

        // Close oneshot sessions
        if (session.mode === 'oneshot') {
          await this.closeSession({ sessionKey, reason: 'oneshot-complete' }).catch(() => {});
        }
      }
    });
  }

  /**
   * Cancel active turn
   * @param {string} sessionKey
   * @param {string} [reason]
   */
  async cancelTurn(sessionKey, reason) {
    const activeTurn = this.activeTurns.get(sessionKey);
    if (!activeTurn) {
      return false;
    }

    activeTurn.abortController.abort();

    try {
      await activeTurn.runtime.cancel({
        handle: activeTurn.handle,
        reason: reason || 'user-cancelled'
      });
    } catch {
      // Ignore cancel errors
    }

    this.emit('turn:cancelled', { sessionKey, reason });
    return true;
  }

  /**
   * Close session
   * @param {Object} input
   * @param {string} input.sessionKey
   * @param {string} [input.reason]
   */
  async closeSession(input) {
    const sessionKey = input.sessionKey?.trim();
    if (!sessionKey) return { closed: false };

    return await this.actorQueue.run(sessionKey, async () => {
      const session = this.sessionStore.getSessionByKey(sessionKey);
      const cached = this.runtimeCache.get(sessionKey);

      let runtimeClosed = false;

      if (cached) {
        try {
          await cached.runtime.close({
            handle: cached.handle,
            reason: input.reason || 'close-requested'
          });
          runtimeClosed = true;
        } catch {
          // Ignore close errors
        }
        this.runtimeCache.clear(sessionKey);
      }

      if (session) {
        this.sessionStore.closeSession(session.sessionId);
      }

      this.emit('session:closed', { sessionKey, reason: input.reason });

      return { closed: true, runtimeClosed };
    });
  }

  /**
   * Clear session context
   * @param {string} sessionKey
   */
  clearContext(sessionKey) {
    const session = this.sessionStore.getSessionByKey(sessionKey);
    if (session) {
      this.sessionStore.clearContext(session.sessionId);
      this.emit('context:cleared', { sessionKey });
      return true;
    }
    return false;
  }

  /**
   * Get session context
   * @param {string} sessionKey
   */
  getContext(sessionKey) {
    const session = this.sessionStore.getSessionByKey(sessionKey);
    return session?.context || [];
  }

  /**
   * Evict idle runtimes
   */
  async evictIdleRuntimes() {
    const candidates = this.runtimeCache.collectIdleCandidates(this.config.idleTtlMs);

    for (const { key, state } of candidates) {
      // Don't evict active turns
      if (this.activeTurns.has(key)) continue;

      await this.actorQueue.run(key, async () => {
        try {
          await state.runtime.close({
            handle: state.handle,
            reason: 'idle-evicted'
          });
        } catch {
          // Ignore eviction errors
        }
        this.runtimeCache.clear(key);
      });
    }

    return candidates.length;
  }

  /**
   * Record turn completion for statistics
   */
  recordTurnCompletion(startedAt, errorCode = null) {
    const durationMs = Date.now() - startedAt;
    this.stats.totalLatencyMs += durationMs;
    this.stats.maxLatencyMs = Math.max(this.stats.maxLatencyMs, durationMs);

    if (errorCode) {
      this.stats.turnsFailed++;
      const count = this.stats.errorsByCode.get(errorCode) || 0;
      this.stats.errorsByCode.set(errorCode, count + 1);
    } else {
      this.stats.turnsCompleted++;
    }
  }

  /**
   * Get manager statistics
   */
  getStats() {
    const completedTurns = this.stats.turnsCompleted + this.stats.turnsFailed;
    const averageLatencyMs = completedTurns > 0
      ? Math.round(this.stats.totalLatencyMs / completedTurns)
      : 0;

    return {
      sessions: this.sessionStore.getStats(),
      runtimeCache: {
        size: this.runtimeCache.size(),
        idleTtlMs: this.config.idleTtlMs
      },
      turns: {
        active: this.activeTurns.size,
        completed: this.stats.turnsCompleted,
        failed: this.stats.turnsFailed,
        averageLatencyMs,
        maxLatencyMs: this.stats.maxLatencyMs
      },
      errorsByCode: Object.fromEntries(this.stats.errorsByCode)
    };
  }

  /**
   * Run health check on all backends
   */
  async healthCheck() {
    const runtimes = listRuntimes();
    const results = {};

    for (const runtime of runtimes) {
      try {
        results[runtime.id] = await runtime.doctor();
      } catch (error) {
        results[runtime.id] = {
          ok: false,
          code: 'DOCTOR_FAILED',
          message: error.message
        };
      }
    }

    return {
      healthy: Object.values(results).some(r => r.ok),
      runtimes: results,
      stats: this.getStats()
    };
  }

  /**
   * Shutdown manager
   */
  async shutdown() {
    clearInterval(this.evictionInterval);

    // Cancel all active turns
    for (const [sessionKey, turn] of this.activeTurns) {
      turn.abortController.abort();
    }

    // Close all sessions
    for (const session of this.sessionStore.listSessions()) {
      await this.closeSession({
        sessionKey: session.sessionKey,
        reason: 'shutdown'
      }).catch(() => {});
    }

    this.sessionStore.clearAll();
    this.emit('shutdown');
  }
}

// Default manager instance
export const defaultSessionManager = new AcpSessionManager();
