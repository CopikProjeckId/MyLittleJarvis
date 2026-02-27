// JARVIS Agent Control Protocol (ACP) Types
// Based on OpenClaw's ACP architecture

/**
 * @typedef {'prompt' | 'steer'} AcpPromptMode
 * Prompt mode for agent interaction
 * - prompt: Standard user prompt
 * - steer: System steering/guidance
 */

/**
 * @typedef {'persistent' | 'oneshot'} AcpSessionMode
 * Session lifecycle mode
 * - persistent: Long-running session with context
 * - oneshot: Single turn, no context retention
 */

/**
 * @typedef {'idle' | 'running' | 'error'} AcpSessionState
 * Current state of an ACP session
 */

/**
 * @typedef {Object} AcpRuntimeHandle
 * @property {string} sessionKey - Unique session identifier
 * @property {string} backend - Backend provider (ollama, anthropic, etc.)
 * @property {string} runtimeSessionName - Human-readable session name
 * @property {string} [cwd] - Working directory
 * @property {string} [agentId] - Agent identifier
 * @property {string} [backendSessionId] - Backend-specific session ID
 */

/**
 * @typedef {Object} AcpRuntimeCapabilities
 * @property {string[]} controls - Supported control operations
 * @property {string[]} [configOptionKeys] - Configurable options
 * @property {boolean} streaming - Supports streaming responses
 * @property {boolean} toolCalling - Supports tool/function calling
 * @property {number} maxContextLength - Maximum context window
 */

/**
 * @typedef {Object} AcpRuntimeStatus
 * @property {string} [summary] - Human-readable status
 * @property {string} [backendSessionId] - Backend session ID
 * @property {string} [agentSessionId] - Agent session ID
 * @property {number} [lastActivityAt] - Last activity timestamp
 * @property {Object} [details] - Additional status details
 */

/**
 * @typedef {Object} AcpTurnEvent
 * @property {'text_delta' | 'status' | 'tool_call' | 'tool_result' | 'done' | 'error'} type
 * @property {string} [text] - Text content
 * @property {string} [stream] - Stream type (output, thought)
 * @property {string} [toolName] - Tool name for tool_call
 * @property {Object} [toolParams] - Tool parameters
 * @property {Object} [toolResult] - Tool result
 * @property {string} [stopReason] - Stop reason for done
 * @property {string} [message] - Error message
 * @property {string} [code] - Error code
 * @property {boolean} [retryable] - Whether error is retryable
 */

/**
 * @typedef {Object} AcpSession
 * @property {string} sessionId - UUID
 * @property {string} sessionKey - User-facing key
 * @property {string} agentId - Agent identifier
 * @property {AcpSessionMode} mode - Session mode
 * @property {AcpSessionState} state - Current state
 * @property {string} [cwd] - Working directory
 * @property {string} backend - Backend provider
 * @property {Array} context - Conversation context
 * @property {number} createdAt - Creation timestamp
 * @property {number} lastTouchedAt - Last activity timestamp
 * @property {AbortController} [abortController] - Active turn abort
 * @property {string} [activeRunId] - Current run ID
 * @property {Object} [lastError] - Last error details
 * @property {Object} [runtimeOptions] - Runtime configuration
 */

/**
 * @typedef {Object} AcpSessionMeta
 * @property {string} backend - Backend provider
 * @property {string} agent - Agent identifier
 * @property {string} runtimeSessionName - Session name
 * @property {AcpSessionMode} mode - Session mode
 * @property {AcpSessionState} state - Session state
 * @property {Object} [identity] - Session identity info
 * @property {Object} [runtimeOptions] - Runtime options
 * @property {string} [cwd] - Working directory
 * @property {number} lastActivityAt - Last activity time
 * @property {string} [lastError] - Last error message
 */

export const ACP_SESSION_MODES = ['persistent', 'oneshot'];
export const ACP_PROMPT_MODES = ['prompt', 'steer'];
export const ACP_SESSION_STATES = ['idle', 'running', 'error'];

export const ACP_ERROR_CODES = {
  SESSION_INIT_FAILED: 'ACP_SESSION_INIT_FAILED',
  TURN_FAILED: 'ACP_TURN_FAILED',
  BACKEND_UNAVAILABLE: 'ACP_BACKEND_UNAVAILABLE',
  BACKEND_MISSING: 'ACP_BACKEND_MISSING',
  SESSION_NOT_FOUND: 'ACP_SESSION_NOT_FOUND',
  SESSION_LIMIT_REACHED: 'ACP_SESSION_LIMIT_REACHED',
  UNSUPPORTED_CONTROL: 'ACP_UNSUPPORTED_CONTROL',
  CANCELLED: 'ACP_CANCELLED',
  TIMEOUT: 'ACP_TIMEOUT'
};

export class AcpRuntimeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AcpRuntimeError';
    this.code = code;
  }
}
