// JARVIS Hooks System Types
// Extensible hook architecture for lifecycle events
// Based on OpenClaw's hooks system

/**
 * @typedef {'boot' | 'pre-turn' | 'post-turn' | 'tool-call' | 'tool-result' | 'session-start' | 'session-end' | 'error'} HookEvent
 */

/**
 * @typedef {Object} HookContext
 * @property {string} sessionKey - Session identifier
 * @property {string} [agentId] - Agent identifier
 * @property {string} [backend] - Backend provider
 * @property {string} [cwd] - Working directory
 * @property {Object} [config] - Configuration
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} HookResult
 * @property {boolean} [continue] - Continue processing (default true)
 * @property {Object} [data] - Modified/additional data
 * @property {string} [message] - Status message
 * @property {Error} [error] - Error if hook failed
 */

/**
 * @typedef {Object} HookDefinition
 * @property {string} id - Unique hook ID
 * @property {string} name - Human-readable name
 * @property {string} [description] - Hook description
 * @property {HookEvent[]} events - Events this hook handles
 * @property {number} [priority] - Execution priority (lower = earlier)
 * @property {boolean} [enabled] - Whether hook is enabled
 * @property {Function} handler - Hook handler function
 */

export const HOOK_EVENTS = [
  'boot',
  'pre-turn',
  'post-turn',
  'tool-call',
  'tool-result',
  'session-start',
  'session-end',
  'error'
];

export const HOOK_PRIORITY = {
  CRITICAL: 0,
  HIGH: 10,
  NORMAL: 50,
  LOW: 90,
  DEFERRED: 100
};
