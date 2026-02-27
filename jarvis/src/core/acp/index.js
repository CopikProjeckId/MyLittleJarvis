// JARVIS Agent Control Protocol (ACP) System
// Core architecture for agent session management

export { AcpRuntimeError, ACP_ERROR_CODES, ACP_SESSION_MODES, ACP_PROMPT_MODES, ACP_SESSION_STATES } from './types.js';
export { createSessionStore, defaultSessionStore } from './session-store.js';
export { AcpRuntime, OllamaRuntime, AnthropicRuntime, registerRuntime, getRuntime, listRuntimes, requireRuntime } from './runtime.js';
export { AcpSessionManager, defaultSessionManager } from './session-manager.js';

import { defaultSessionManager } from './session-manager.js';
import { registerRuntime, OllamaRuntime, AnthropicRuntime } from './runtime.js';

/**
 * Initialize ACP system with configuration
 * @param {Object} options
 */
export function initializeAcp(options = {}) {
  // Register additional runtimes if provided
  if (options.runtimes) {
    for (const runtime of options.runtimes) {
      registerRuntime(runtime);
    }
  }

  // Configure default session manager
  if (options.maxConcurrentSessions) {
    defaultSessionManager.config.maxConcurrentSessions = options.maxConcurrentSessions;
  }
  if (options.idleTtlMs) {
    defaultSessionManager.config.idleTtlMs = options.idleTtlMs;
  }
  if (options.defaultBackend) {
    defaultSessionManager.config.defaultBackend = options.defaultBackend;
  }

  return defaultSessionManager;
}

/**
 * Quick start: run a single turn
 * @param {string} text - User input
 * @param {Object} [options]
 */
export async function quickTurn(text, options = {}) {
  const sessionKey = options.sessionKey || `quick-${Date.now()}`;

  try {
    const result = await defaultSessionManager.runTurn({
      sessionKey,
      text,
      mode: options.mode || 'prompt',
      signal: options.signal,
      onEvent: options.onEvent
    });

    // Close oneshot sessions
    if (options.oneshot !== false && !options.sessionKey) {
      await defaultSessionManager.closeSession({ sessionKey, reason: 'quickTurn-complete' });
    }

    return result;
  } catch (error) {
    throw error;
  }
}
