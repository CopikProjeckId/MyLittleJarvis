// JARVIS Command Logger Hook
// Logs all commands and tool calls for audit/debugging
// Based on OpenClaw's command-logger handler

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { HOOK_PRIORITY } from '../types.js';

const LOG_DIR = join(homedir(), '.jarvis', 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

function getLogPath() {
  const date = new Date().toISOString().split('T')[0];
  return join(LOG_DIR, `commands-${date}.log`);
}

function formatLogEntry(event, context, data) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    event,
    sessionKey: context.sessionKey,
    agentId: context.agentId,
    ...data
  };
  return JSON.stringify(entry) + '\n';
}

/**
 * Command Logger Hook
 * Logs all commands and tool calls
 */
export const commandLoggerHook = {
  id: 'command-logger',
  name: 'Command Logger',
  description: 'Logs all commands and tool calls for audit',
  events: ['pre-turn', 'post-turn', 'tool-call', 'tool-result', 'error'],
  priority: HOOK_PRIORITY.LOW, // Run after other hooks
  enabled: true,

  async handler({ event, context, data }) {
    try {
      const logPath = getLogPath();

      // Check log size and rotate if needed
      if (existsSync(logPath)) {
        const { statSync } = require('fs');
        const stats = statSync(logPath);
        if (stats.size > MAX_LOG_SIZE) {
          // Rotate log
          const { renameSync } = require('fs');
          const archivePath = logPath.replace('.log', `-${Date.now()}.log`);
          renameSync(logPath, archivePath);
        }
      }

      // Format and write log entry
      let logData = {};

      switch (event) {
        case 'pre-turn':
          logData = {
            type: 'turn-start',
            input: data.text?.substring(0, 500) // Truncate for privacy
          };
          break;

        case 'post-turn':
          logData = {
            type: 'turn-end',
            durationMs: data.durationMs,
            responseLength: data.responseText?.length || 0
          };
          break;

        case 'tool-call':
          logData = {
            type: 'tool-call',
            tool: data.toolName,
            params: sanitizeParams(data.params)
          };
          break;

        case 'tool-result':
          logData = {
            type: 'tool-result',
            tool: data.toolName,
            success: !data.error,
            durationMs: data.durationMs
          };
          break;

        case 'error':
          logData = {
            type: 'error',
            code: data.code,
            message: data.message
          };
          break;
      }

      const entry = formatLogEntry(event, context, logData);
      appendFileSync(logPath, entry);

    } catch (error) {
      // Silent failure for logging
      console.error(`Command logger error: ${error.message}`);
    }

    return { continue: true };
  }
};

/**
 * Sanitize parameters for logging (remove sensitive data)
 */
function sanitizeParams(params) {
  if (!params) return params;

  const sanitized = { ...params };
  const sensitiveKeys = ['password', 'secret', 'token', 'key', 'auth', 'credential'];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Get recent log entries
 * @param {number} [count] - Number of entries to return
 */
export function getRecentLogs(count = 100) {
  try {
    const logPath = getLogPath();
    if (!existsSync(logPath)) return [];

    const { readFileSync } = require('fs');
    const content = readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n').slice(-count);

    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });
  } catch {
    return [];
  }
}
