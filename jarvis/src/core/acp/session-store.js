// JARVIS ACP Session Store
// In-memory session management with TTL eviction
// Based on OpenClaw's session.ts architecture

import { randomUUID } from 'crypto';
import { AcpRuntimeError, ACP_ERROR_CODES } from './types.js';

const DEFAULT_MAX_SESSIONS = 1000;
const DEFAULT_IDLE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates an in-memory session store with LRU-like eviction
 * @param {Object} options - Store options
 * @param {number} [options.maxSessions] - Maximum concurrent sessions
 * @param {number} [options.idleTtlMs] - Idle session TTL in ms
 * @param {Function} [options.now] - Time function for testing
 */
export function createSessionStore(options = {}) {
  const maxSessions = Math.max(1, options.maxSessions ?? DEFAULT_MAX_SESSIONS);
  const idleTtlMs = Math.max(1000, options.idleTtlMs ?? DEFAULT_IDLE_TTL_MS);
  const now = options.now ?? Date.now;

  /** @type {Map<string, import('./types.js').AcpSession>} */
  const sessions = new Map();

  /** @type {Map<string, string>} runId -> sessionId */
  const runIdToSessionId = new Map();

  // Statistics
  const stats = {
    totalCreated: 0,
    totalEvicted: 0,
    totalCancelled: 0,
    peakConcurrent: 0
  };

  const touchSession = (session, nowMs) => {
    session.lastTouchedAt = nowMs;
  };

  const removeSession = (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return false;

    if (session.activeRunId) {
      runIdToSessionId.delete(session.activeRunId);
    }
    session.abortController?.abort();
    sessions.delete(sessionId);
    return true;
  };

  const reapIdleSessions = (nowMs) => {
    const idleBefore = nowMs - idleTtlMs;
    const toRemove = [];

    for (const [sessionId, session] of sessions.entries()) {
      // Don't evict active sessions
      if (session.activeRunId || session.abortController) continue;
      if (session.lastTouchedAt > idleBefore) continue;
      toRemove.push(sessionId);
    }

    for (const sessionId of toRemove) {
      removeSession(sessionId);
      stats.totalEvicted++;
    }

    return toRemove.length;
  };

  const evictOldestIdleSession = () => {
    let oldestSessionId = null;
    let oldestLastTouchedAt = Infinity;

    for (const [sessionId, session] of sessions.entries()) {
      if (session.activeRunId || session.abortController) continue;
      if (session.lastTouchedAt >= oldestLastTouchedAt) continue;
      oldestLastTouchedAt = session.lastTouchedAt;
      oldestSessionId = sessionId;
    }

    if (!oldestSessionId) return false;
    stats.totalEvicted++;
    return removeSession(oldestSessionId);
  };

  return {
    /**
     * Create or get existing session
     * @param {Object} params
     * @param {string} params.sessionKey - User-facing session key
     * @param {string} params.agentId - Agent identifier
     * @param {string} params.backend - Backend provider
     * @param {import('./types.js').AcpSessionMode} params.mode - Session mode
     * @param {string} [params.cwd] - Working directory
     * @param {string} [params.sessionId] - Specific session ID
     * @returns {import('./types.js').AcpSession}
     */
    createSession(params) {
      const nowMs = now();
      const sessionId = params.sessionId ?? randomUUID();

      // Return existing session if found
      const existing = sessions.get(sessionId);
      if (existing) {
        existing.sessionKey = params.sessionKey;
        existing.agentId = params.agentId;
        existing.backend = params.backend;
        existing.mode = params.mode;
        if (params.cwd) existing.cwd = params.cwd;
        touchSession(existing, nowMs);
        return existing;
      }

      // Reap idle sessions first
      reapIdleSessions(nowMs);

      // Check limit and evict if needed
      if (sessions.size >= maxSessions) {
        if (!evictOldestIdleSession()) {
          throw new AcpRuntimeError(
            ACP_ERROR_CODES.SESSION_LIMIT_REACHED,
            `ACP session limit reached (${sessions.size}/${maxSessions}). Close idle sessions and retry.`
          );
        }
      }

      /** @type {import('./types.js').AcpSession} */
      const session = {
        sessionId,
        sessionKey: params.sessionKey,
        agentId: params.agentId,
        mode: params.mode,
        state: 'idle',
        backend: params.backend,
        cwd: params.cwd,
        context: [],
        createdAt: nowMs,
        lastTouchedAt: nowMs,
        abortController: null,
        activeRunId: null,
        lastError: null,
        runtimeOptions: {}
      };

      sessions.set(sessionId, session);
      stats.totalCreated++;
      stats.peakConcurrent = Math.max(stats.peakConcurrent, sessions.size);

      return session;
    },

    /**
     * Check if session exists
     * @param {string} sessionId
     */
    hasSession(sessionId) {
      return sessions.has(sessionId);
    },

    /**
     * Get session by ID
     * @param {string} sessionId
     */
    getSession(sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        touchSession(session, now());
      }
      return session;
    },

    /**
     * Get session by key (searches all sessions)
     * @param {string} sessionKey
     */
    getSessionByKey(sessionKey) {
      for (const session of sessions.values()) {
        if (session.sessionKey === sessionKey) {
          touchSession(session, now());
          return session;
        }
      }
      return null;
    },

    /**
     * Get session by active run ID
     * @param {string} runId
     */
    getSessionByRunId(runId) {
      const sessionId = runIdToSessionId.get(runId);
      if (!sessionId) return null;
      return this.getSession(sessionId);
    },

    /**
     * Set active run for session
     * @param {string} sessionId
     * @param {string} runId
     * @param {AbortController} abortController
     */
    setActiveRun(sessionId, runId, abortController) {
      const session = sessions.get(sessionId);
      if (!session) return false;

      session.activeRunId = runId;
      session.abortController = abortController;
      session.state = 'running';
      runIdToSessionId.set(runId, sessionId);
      touchSession(session, now());
      return true;
    },

    /**
     * Clear active run for session
     * @param {string} sessionId
     */
    clearActiveRun(sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return;

      if (session.activeRunId) {
        runIdToSessionId.delete(session.activeRunId);
      }
      session.activeRunId = null;
      session.abortController = null;
      session.state = 'idle';
      touchSession(session, now());
    },

    /**
     * Cancel active run for session
     * @param {string} sessionId
     */
    cancelActiveRun(sessionId) {
      const session = sessions.get(sessionId);
      if (!session?.abortController) return false;

      session.abortController.abort();
      if (session.activeRunId) {
        runIdToSessionId.delete(session.activeRunId);
      }
      session.abortController = null;
      session.activeRunId = null;
      session.state = 'idle';
      stats.totalCancelled++;
      touchSession(session, now());
      return true;
    },

    /**
     * Update session state
     * @param {string} sessionId
     * @param {import('./types.js').AcpSessionState} state
     * @param {Object} [updates]
     */
    updateSessionState(sessionId, state, updates = {}) {
      const session = sessions.get(sessionId);
      if (!session) return null;

      session.state = state;
      if (updates.lastError !== undefined) {
        session.lastError = updates.lastError;
      }
      if (updates.runtimeOptions) {
        session.runtimeOptions = { ...session.runtimeOptions, ...updates.runtimeOptions };
      }
      touchSession(session, now());
      return session;
    },

    /**
     * Add message to session context
     * @param {string} sessionId
     * @param {Object} message
     * @param {number} [maxContextSize]
     */
    addToContext(sessionId, message, maxContextSize = 50) {
      const session = sessions.get(sessionId);
      if (!session) return false;

      session.context.push(message);

      // Evict old context
      if (session.context.length > maxContextSize) {
        session.context = session.context.slice(-maxContextSize);
      }

      touchSession(session, now());
      return true;
    },

    /**
     * Clear session context
     * @param {string} sessionId
     */
    clearContext(sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return false;

      session.context = [];
      touchSession(session, now());
      return true;
    },

    /**
     * Close and remove session
     * @param {string} sessionId
     */
    closeSession(sessionId) {
      return removeSession(sessionId);
    },

    /**
     * List all sessions with optional filters
     * @param {Object} [filters]
     * @param {string} [filters.agentId]
     * @param {string} [filters.backend]
     * @param {import('./types.js').AcpSessionState} [filters.state]
     */
    listSessions(filters = {}) {
      const result = [];
      for (const session of sessions.values()) {
        if (filters.agentId && session.agentId !== filters.agentId) continue;
        if (filters.backend && session.backend !== filters.backend) continue;
        if (filters.state && session.state !== filters.state) continue;
        result.push(session);
      }
      return result;
    },

    /**
     * Get store statistics
     */
    getStats() {
      let activeRuns = 0;
      let idleSessions = 0;

      for (const session of sessions.values()) {
        if (session.activeRunId) activeRuns++;
        else idleSessions++;
      }

      return {
        ...stats,
        currentSessions: sessions.size,
        maxSessions,
        activeRuns,
        idleSessions,
        idleTtlMs
      };
    },

    /**
     * Force eviction check (for testing/maintenance)
     */
    evictIdleSessions() {
      return reapIdleSessions(now());
    },

    /**
     * Clear all sessions (for testing)
     */
    clearAll() {
      for (const session of sessions.values()) {
        session.abortController?.abort();
      }
      sessions.clear();
      runIdToSessionId.clear();
    },

    /**
     * Get session count
     */
    size() {
      return sessions.size;
    }
  };
}

// Default global session store
export const defaultSessionStore = createSessionStore();
