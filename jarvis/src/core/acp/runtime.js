// JARVIS ACP Runtime Interface
// Abstract interface for LLM backend communication
// Based on OpenClaw's AcpRuntime architecture

import { EventEmitter } from 'events';
import { AcpRuntimeError, ACP_ERROR_CODES } from './types.js';

/**
 * Abstract ACP Runtime Interface
 * Implementations: OllamaRuntime, AnthropicRuntime, OpenAIRuntime, etc.
 */
export class AcpRuntime extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = config.id || 'unknown';
    this.name = config.name || 'Unknown Runtime';
    this.config = config;
    this.isAvailable = false;
  }

  /**
   * Check backend availability
   * @returns {Promise<boolean>}
   */
  async checkAvailability() {
    throw new Error('Not implemented');
  }

  /**
   * Ensure a session exists, creating if needed
   * @param {Object} input
   * @param {string} input.sessionKey
   * @param {string} input.agent
   * @param {import('./types.js').AcpSessionMode} input.mode
   * @param {string} [input.cwd]
   * @returns {Promise<import('./types.js').AcpRuntimeHandle>}
   */
  async ensureSession(input) {
    throw new Error('Not implemented');
  }

  /**
   * Run a turn (conversation turn)
   * @param {Object} input
   * @param {import('./types.js').AcpRuntimeHandle} input.handle
   * @param {string} input.text
   * @param {import('./types.js').AcpPromptMode} input.mode
   * @param {string} input.requestId
   * @param {AbortSignal} [input.signal]
   * @returns {AsyncIterable<import('./types.js').AcpTurnEvent>}
   */
  async *runTurn(input) {
    throw new Error('Not implemented');
  }

  /**
   * Get runtime capabilities
   * @param {Object} input
   * @param {import('./types.js').AcpRuntimeHandle} [input.handle]
   * @returns {Promise<import('./types.js').AcpRuntimeCapabilities>}
   */
  async getCapabilities(input = {}) {
    return {
      controls: [],
      configOptionKeys: [],
      streaming: false,
      toolCalling: false,
      maxContextLength: 4096
    };
  }

  /**
   * Get runtime status
   * @param {Object} input
   * @param {import('./types.js').AcpRuntimeHandle} input.handle
   * @returns {Promise<import('./types.js').AcpRuntimeStatus>}
   */
  async getStatus(input) {
    return { summary: 'unknown' };
  }

  /**
   * Run health check / doctor
   * @returns {Promise<Object>}
   */
  async doctor() {
    return {
      ok: this.isAvailable,
      message: this.isAvailable ? 'Runtime available' : 'Runtime unavailable'
    };
  }

  /**
   * Cancel active run
   * @param {Object} input
   * @param {import('./types.js').AcpRuntimeHandle} input.handle
   * @param {string} [input.reason]
   */
  async cancel(input) {
    throw new Error('Not implemented');
  }

  /**
   * Close session
   * @param {Object} input
   * @param {import('./types.js').AcpRuntimeHandle} input.handle
   * @param {string} input.reason
   */
  async close(input) {
    throw new Error('Not implemented');
  }
}

// ============================================================
// Ollama Runtime Implementation
// ============================================================

export class OllamaRuntime extends AcpRuntime {
  constructor(config = {}) {
    super({
      id: 'ollama',
      name: 'Ollama',
      ...config
    });
    this.baseUrl = config.baseUrl || process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.apiKey = config.apiKey || process.env.OLLAMA_API_KEY;
    this.defaultModel = config.model || 'qwen2.5:7b';
    this.timeout = config.timeout || 120000;
    this.sessions = new Map();
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async checkAvailability() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000)
      });
      this.isAvailable = response.ok;
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.models?.map(m => m.name) || [];
    } catch {
      return [];
    }
  }

  async ensureSession(input) {
    const sessionData = {
      sessionKey: input.sessionKey,
      agent: input.agent,
      mode: input.mode,
      cwd: input.cwd,
      model: this.defaultModel,
      createdAt: Date.now()
    };

    this.sessions.set(input.sessionKey, sessionData);

    return {
      sessionKey: input.sessionKey,
      backend: 'ollama',
      runtimeSessionName: `ollama-${input.sessionKey}`,
      cwd: input.cwd,
      agentId: input.agent
    };
  }

  async *runTurn(input) {
    const { handle, text, mode, requestId, signal } = input;
    const session = this.sessions.get(handle.sessionKey);

    if (!session) {
      yield { type: 'error', message: 'Session not found', code: ACP_ERROR_CODES.SESSION_NOT_FOUND };
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Link external signal
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      yield { type: 'status', text: 'Connecting to Ollama...' };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: session.model,
          messages: [{ role: 'user', content: text }],
          stream: true,
          options: {
            temperature: 0.7,
            num_predict: 4096
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        yield {
          type: 'error',
          message: `Ollama API error: ${response.status}`,
          code: ACP_ERROR_CODES.BACKEND_UNAVAILABLE,
          retryable: response.status >= 500
        };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            if (data.message?.content) {
              yield {
                type: 'text_delta',
                text: data.message.content,
                stream: 'output'
              };
            }

            if (data.done) {
              yield {
                type: 'done',
                stopReason: data.done_reason || 'stop'
              };
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        yield {
          type: 'error',
          message: signal?.aborted ? 'Request cancelled' : 'Request timeout',
          code: signal?.aborted ? ACP_ERROR_CODES.CANCELLED : ACP_ERROR_CODES.TIMEOUT,
          retryable: !signal?.aborted
        };
      } else {
        yield {
          type: 'error',
          message: error.message,
          code: ACP_ERROR_CODES.TURN_FAILED,
          retryable: true
        };
      }
    }
  }

  async getCapabilities(input = {}) {
    return {
      controls: ['session/status'],
      configOptionKeys: ['model', 'temperature', 'num_predict'],
      streaming: true,
      toolCalling: false,
      maxContextLength: 4096
    };
  }

  async getStatus(input) {
    const session = this.sessions.get(input.handle.sessionKey);
    return {
      summary: session ? 'active' : 'inactive',
      backendSessionId: input.handle.sessionKey,
      lastActivityAt: session?.lastActivity || Date.now(),
      details: {
        model: session?.model || this.defaultModel,
        baseUrl: this.baseUrl
      }
    };
  }

  async doctor() {
    const available = await this.checkAvailability();
    const models = available ? await this.listModels() : [];

    return {
      ok: available && models.length > 0,
      code: available ? null : 'OLLAMA_UNAVAILABLE',
      message: available
        ? `Ollama running with ${models.length} models`
        : 'Ollama server not reachable',
      details: available ? [`Models: ${models.slice(0, 5).join(', ')}`] : [],
      installCommand: 'curl -fsSL https://ollama.com/install.sh | sh'
    };
  }

  async cancel(input) {
    // Ollama doesn't have a cancel API, abort is handled via signal
    const session = this.sessions.get(input.handle.sessionKey);
    if (session) {
      session.cancelled = true;
    }
  }

  async close(input) {
    this.sessions.delete(input.handle.sessionKey);
  }
}

// ============================================================
// Anthropic Runtime Implementation
// ============================================================

export class AnthropicRuntime extends AcpRuntime {
  constructor(config = {}) {
    super({
      id: 'anthropic',
      name: 'Anthropic Claude',
      ...config
    });
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.defaultModel = config.model || 'claude-sonnet-4-6';
    this.maxTokens = config.maxTokens || 4096;
    this.sessions = new Map();
  }

  async checkAvailability() {
    this.isAvailable = !!this.apiKey;
    return this.isAvailable;
  }

  async ensureSession(input) {
    const sessionData = {
      sessionKey: input.sessionKey,
      agent: input.agent,
      mode: input.mode,
      cwd: input.cwd,
      model: this.defaultModel,
      createdAt: Date.now()
    };

    this.sessions.set(input.sessionKey, sessionData);

    return {
      sessionKey: input.sessionKey,
      backend: 'anthropic',
      runtimeSessionName: `claude-${input.sessionKey}`,
      cwd: input.cwd,
      agentId: input.agent
    };
  }

  async *runTurn(input) {
    const { handle, text, mode, requestId, signal } = input;

    if (!this.apiKey) {
      yield {
        type: 'error',
        message: 'Anthropic API key not configured',
        code: ACP_ERROR_CODES.BACKEND_UNAVAILABLE,
        retryable: false
      };
      return;
    }

    yield { type: 'status', text: 'Connecting to Claude...' };

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [{ role: 'user', content: text }],
          max_tokens: this.maxTokens,
          stream: true
        }),
        signal
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        yield {
          type: 'error',
          message: error.error?.message || `API error: ${response.status}`,
          code: ACP_ERROR_CODES.TURN_FAILED,
          retryable: response.status >= 500
        };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            yield { type: 'done', stopReason: 'stop' };
            return;
          }

          try {
            const event = JSON.parse(data);

            if (event.type === 'content_block_delta' && event.delta?.text) {
              yield {
                type: 'text_delta',
                text: event.delta.text,
                stream: 'output'
              };
            }

            if (event.type === 'message_stop') {
              yield { type: 'done', stopReason: event.stop_reason || 'stop' };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        yield { type: 'error', message: 'Request cancelled', code: ACP_ERROR_CODES.CANCELLED };
      } else {
        yield { type: 'error', message: error.message, code: ACP_ERROR_CODES.TURN_FAILED, retryable: true };
      }
    }
  }

  async getCapabilities(input = {}) {
    return {
      controls: ['session/status'],
      configOptionKeys: ['model', 'max_tokens', 'temperature'],
      streaming: true,
      toolCalling: true,
      maxContextLength: 200000
    };
  }

  async doctor() {
    return {
      ok: !!this.apiKey,
      code: this.apiKey ? null : 'ANTHROPIC_API_KEY_MISSING',
      message: this.apiKey ? 'Anthropic API key configured' : 'Missing ANTHROPIC_API_KEY',
      details: this.apiKey ? [`Model: ${this.defaultModel}`] : []
    };
  }

  async cancel(input) {
    // HTTP requests are cancelled via signal
  }

  async close(input) {
    this.sessions.delete(input.handle.sessionKey);
  }
}

// ============================================================
// Runtime Registry
// ============================================================

const runtimeRegistry = new Map();

export function registerRuntime(runtime) {
  runtimeRegistry.set(runtime.id, runtime);
}

export function getRuntime(id) {
  return runtimeRegistry.get(id);
}

export function listRuntimes() {
  return Array.from(runtimeRegistry.values());
}

export function requireRuntime(id) {
  const runtime = runtimeRegistry.get(id);
  if (!runtime) {
    throw new AcpRuntimeError(
      ACP_ERROR_CODES.BACKEND_MISSING,
      `Runtime '${id}' not found. Available: ${Array.from(runtimeRegistry.keys()).join(', ')}`
    );
  }
  return runtime;
}

// Register default runtimes
registerRuntime(new OllamaRuntime());
registerRuntime(new AnthropicRuntime());
