// JARVIS Engine
// Main orchestrator integrating ACP, Hooks, Auth, and Tool systems
// Based on OpenClaw's architecture

import { EventEmitter } from 'events';
import { AcpSessionManager } from './acp/session-manager.js';
import { registerRuntime, OllamaRuntime, AnthropicRuntime, listRuntimes } from './acp/runtime.js';
import { HooksManager, initializeHooks } from './hooks/index.js';
import { AuthProfileManager } from './auth/auth-profiles.js';
import { smartToolCall } from './tool/tool-implementations.js';

/**
 * JARVIS Engine
 * Main orchestrator for the AI assistant system
 */
export class JarvisEngine extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      mode: options.mode || 'full', // 'simple' | 'full' | 'acp'
      defaultBackend: options.defaultBackend || 'ollama',
      maxConcurrentSessions: options.maxConcurrentSessions || 100,
      idleTtlMs: options.idleTtlMs || 30 * 60 * 1000,
      maxContextSize: options.maxContextSize || 50,
      enableHooks: options.enableHooks !== false,
      enableAuth: options.enableAuth !== false,
      enableTools: options.enableTools !== false
    };

    // Initialize subsystems
    this.sessionManager = new AcpSessionManager({
      maxConcurrentSessions: this.config.maxConcurrentSessions,
      idleTtlMs: this.config.idleTtlMs,
      defaultBackend: this.config.defaultBackend,
      maxContextSize: this.config.maxContextSize
    });

    this.hooksManager = new HooksManager();
    this.authManager = new AuthProfileManager();

    // Register default runtimes
    this.registerDefaultRuntimes();

    // Initialize hooks if enabled
    if (this.config.enableHooks) {
      initializeHooks({ bundledHooks: true });
    }

    // Wire up event forwarding
    this.setupEventForwarding();

    // Statistics
    this.stats = {
      startedAt: Date.now(),
      totalRequests: 0,
      toolCalls: 0,
      errors: 0
    };
  }

  /**
   * Register default LLM runtimes
   */
  registerDefaultRuntimes() {
    // Ollama (local)
    registerRuntime(new OllamaRuntime({
      baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'qwen2.5:7b'
    }));

    // Anthropic (Claude)
    if (process.env.ANTHROPIC_API_KEY) {
      registerRuntime(new AnthropicRuntime({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
      }));
    }
  }

  /**
   * Set up event forwarding from subsystems
   */
  setupEventForwarding() {
    // Forward session manager events
    this.sessionManager.on('session:initialized', (data) => this.emit('session:initialized', data));
    this.sessionManager.on('session:closed', (data) => this.emit('session:closed', data));
    this.sessionManager.on('turn:event', (data) => this.emit('turn:event', data));
    this.sessionManager.on('turn:complete', (data) => this.emit('turn:complete', data));
    this.sessionManager.on('turn:error', (data) => this.emit('turn:error', data));

    // Forward hooks events
    this.hooksManager.on('hook:executed', (data) => this.emit('hook:executed', data));
    this.hooksManager.on('hook:error', (data) => this.emit('hook:error', data));

    // Forward auth events
    this.authManager.on('profile:success', (data) => this.emit('auth:success', data));
    this.authManager.on('profile:failure', (data) => this.emit('auth:failure', data));
    this.authManager.on('profile:cooldown', (data) => this.emit('auth:cooldown', data));
  }

  /**
   * Process user input
   * Main entry point for handling requests
   * @param {string} input - User input
   * @param {Object} [options]
   */
  async process(input, options = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const sessionKey = options.sessionKey || `session-${Date.now()}`;
    const context = {
      sessionKey,
      agentId: options.agentId || 'default',
      backend: options.backend || this.config.defaultBackend,
      cwd: options.cwd || process.cwd()
    };

    try {
      // Execute boot hooks
      if (this.config.enableHooks) {
        const bootResult = await this.hooksManager.execute('boot', context, { input });
        if (bootResult.data?.systemPrompt) {
          context.systemPrompt = bootResult.data.systemPrompt;
        }
      }

      // Check for tool calls first
      if (this.config.enableTools) {
        const toolResult = await this.handleToolCall(input, context);
        if (toolResult) {
          return {
            ...toolResult,
            duration: Date.now() - startTime
          };
        }
      }

      // Execute pre-turn hooks
      if (this.config.enableHooks) {
        const preTurnResult = await this.hooksManager.execute('pre-turn', context, { text: input });
        if (!preTurnResult.continue) {
          return {
            response: preTurnResult.data?.response || 'Request blocked by hook',
            blocked: true,
            duration: Date.now() - startTime
          };
        }
      }

      // Run the turn
      const result = await this.sessionManager.runTurn({
        sessionKey,
        text: input,
        mode: options.mode || 'prompt',
        signal: options.signal,
        onEvent: async (event) => {
          // Forward events
          this.emit('event', { sessionKey, event });

          // Call user callback if provided
          if (options.onEvent) {
            await options.onEvent(event);
          }
        }
      });

      // Execute post-turn hooks
      if (this.config.enableHooks) {
        const sessionContext = this.sessionManager.getContext(sessionKey);
        await this.hooksManager.execute('post-turn', context, {
          text: input,
          responseText: result.responseText,
          context: sessionContext,
          durationMs: result.durationMs
        });
      }

      // Mark auth profile as good if we got here
      if (this.config.enableAuth) {
        const credential = this.authManager.getCredential(context.backend);
        if (credential) {
          this.authManager.markProfileGood(credential.profileId);
        }
      }

      return {
        sessionKey,
        response: result.responseText,
        duration: Date.now() - startTime,
        requestId: result.requestId
      };

    } catch (error) {
      this.stats.errors++;

      // Execute error hooks
      if (this.config.enableHooks) {
        await this.hooksManager.execute('error', context, {
          error,
          input
        });
      }

      // Mark auth profile failure
      if (this.config.enableAuth) {
        const credential = this.authManager.getCredential(context.backend);
        if (credential) {
          this.authManager.markProfileFailure(credential.profileId, error.message);
        }
      }

      throw error;
    }
  }

  /**
   * Handle potential tool calls
   * @private
   */
  async handleToolCall(input, context) {
    try {
      const toolResult = await smartToolCall(input);
      if (!toolResult) return null;

      this.stats.toolCalls++;

      // Execute tool hooks
      if (this.config.enableHooks) {
        await this.hooksManager.execute('tool-call', context, {
          toolName: toolResult.tool,
          params: toolResult.params
        });

        await this.hooksManager.execute('tool-result', context, {
          toolName: toolResult.tool,
          result: toolResult.result
        });
      }

      return {
        type: 'tool',
        tool: toolResult.tool,
        result: toolResult.result,
        response: this.formatToolResponse(toolResult)
      };
    } catch {
      return null;
    }
  }

  /**
   * Format tool result as user-friendly response
   * @private
   */
  formatToolResponse(toolResult) {
    const r = toolResult.result;

    if (toolResult.response) {
      return toolResult.response;
    }

    if (r.error) {
      return `오류: ${r.error}`;
    }

    switch (toolResult.tool) {
      case 'weather':
        if (r.temperature) {
          return `🌡️ ${r.location} 날씨:\n` +
            `  온도: ${r.temperature.c}°C (체감 ${r.feelsLike?.c || r.temperature.c}°C)\n` +
            `  상태: ${r.condition}\n` +
            `  습도: ${r.humidity}\n` +
            `  바람: ${r.wind?.speed || 'N/A'} ${r.wind?.direction || ''}`;
        }
        break;

      case 'web-search':
        if (r.results) {
          return `🔍 검색 결과 (${r.source}):\n` +
            r.results.slice(0, 3).map((item, i) =>
              `${i + 1}. ${item.title}\n   ${item.snippet?.substring(0, 100)}...`
            ).join('\n\n');
        }
        break;

      case 'shorten':
        if (r.shortened) {
          return `🔗 단축 URL: ${r.shortened}`;
        }
        break;
    }

    return JSON.stringify(r, null, 2);
  }

  /**
   * Stream process (yields events)
   * @param {string} input
   * @param {Object} [options]
   */
  async *streamProcess(input, options = {}) {
    const sessionKey = options.sessionKey || `stream-${Date.now()}`;

    const eventQueue = [];
    let resolveNext = null;
    let done = false;

    const onEvent = (event) => {
      eventQueue.push(event);
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    };

    // Start processing in background
    const processPromise = this.process(input, {
      ...options,
      sessionKey,
      onEvent
    }).then(result => {
      done = true;
      eventQueue.push({ type: 'complete', result });
      if (resolveNext) resolveNext();
    }).catch(error => {
      done = true;
      eventQueue.push({ type: 'error', error });
      if (resolveNext) resolveNext();
    });

    // Yield events as they come
    while (!done || eventQueue.length > 0) {
      if (eventQueue.length > 0) {
        yield eventQueue.shift();
      } else {
        await new Promise(resolve => { resolveNext = resolve; });
      }
    }

    await processPromise;
  }

  /**
   * Get session context
   * @param {string} sessionKey
   */
  getContext(sessionKey) {
    return this.sessionManager.getContext(sessionKey);
  }

  /**
   * Clear session context
   * @param {string} sessionKey
   */
  clearContext(sessionKey) {
    return this.sessionManager.clearContext(sessionKey);
  }

  /**
   * Close session
   * @param {string} sessionKey
   * @param {string} [reason]
   */
  async closeSession(sessionKey, reason) {
    return this.sessionManager.closeSession({ sessionKey, reason });
  }

  /**
   * Health check
   */
  async healthCheck() {
    const [sessionHealth, authHealth] = await Promise.all([
      this.sessionManager.healthCheck(),
      this.authManager.healthCheck()
    ]);

    return {
      healthy: sessionHealth.healthy,
      uptime: Date.now() - this.stats.startedAt,
      stats: this.stats,
      sessions: sessionHealth,
      auth: authHealth,
      hooks: this.hooksManager.getStats(),
      runtimes: listRuntimes().map(r => ({
        id: r.id,
        name: r.name,
        available: r.isAvailable
      }))
    };
  }

  /**
   * Get status summary
   */
  getStatus() {
    return {
      mode: this.config.mode,
      uptime: Date.now() - this.stats.startedAt,
      stats: this.stats,
      sessions: this.sessionManager.getStats(),
      hooks: {
        registered: this.hooksManager.listHooks().length,
        enabled: this.config.enableHooks
      },
      auth: {
        profiles: this.authManager.profiles.size,
        enabled: this.config.enableAuth
      }
    };
  }

  /**
   * Shutdown engine
   */
  async shutdown() {
    await this.sessionManager.shutdown();
    this.hooksManager.clear();
    this.emit('shutdown');
  }
}

// Default instance
export const defaultEngine = new JarvisEngine();

// Convenience exports
export const process = (input, options) => defaultEngine.process(input, options);
export const streamProcess = (input, options) => defaultEngine.streamProcess(input, options);
export const getContext = (sessionKey) => defaultEngine.getContext(sessionKey);
export const clearContext = (sessionKey) => defaultEngine.clearContext(sessionKey);
export const closeSession = (sessionKey, reason) => defaultEngine.closeSession(sessionKey, reason);
export const healthCheck = () => defaultEngine.healthCheck();
export const getStatus = () => defaultEngine.getStatus();
