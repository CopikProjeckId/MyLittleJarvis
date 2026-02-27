// JARVIS Hooks System
// Extensible hook architecture for lifecycle events

export { HooksManager, defaultHooksManager } from './hooks-manager.js';
export { HOOK_EVENTS, HOOK_PRIORITY } from './types.js';

// Bundled hooks
export { sessionMemoryHook, loadSession, deleteSession, listSavedSessions } from './bundled/session-memory.js';
export { commandLoggerHook, getRecentLogs } from './bundled/command-logger.js';
export { bootMdHook, findBootFile, loadBootMarkdown, generateSystemPrompt } from './bundled/boot-md.js';

import { defaultHooksManager } from './hooks-manager.js';
import { sessionMemoryHook } from './bundled/session-memory.js';
import { commandLoggerHook } from './bundled/command-logger.js';
import { bootMdHook } from './bundled/boot-md.js';

/**
 * Register all bundled hooks
 */
export function registerBundledHooks(manager = defaultHooksManager) {
  manager.register(bootMdHook);
  manager.register(sessionMemoryHook);
  manager.register(commandLoggerHook);
  return manager;
}

/**
 * Initialize hooks system with default configuration
 */
export function initializeHooks(options = {}) {
  const manager = defaultHooksManager;

  // Set configuration
  if (options.errorBehavior) {
    manager.config.errorBehavior = options.errorBehavior;
  }
  if (options.maxExecutionTimeMs) {
    manager.config.maxExecutionTimeMs = options.maxExecutionTimeMs;
  }

  // Register bundled hooks unless disabled
  if (options.bundledHooks !== false) {
    registerBundledHooks(manager);
  }

  // Register custom hooks
  if (options.hooks) {
    for (const hook of options.hooks) {
      manager.register(hook);
    }
  }

  return manager;
}
