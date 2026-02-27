// JARVIS Session Memory Hook
// Persists session context to disk for recovery
// Based on OpenClaw's session-memory handler

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { HOOK_PRIORITY } from '../types.js';

const MEMORY_DIR = join(homedir(), '.jarvis', 'sessions');

// Ensure directory exists
if (!existsSync(MEMORY_DIR)) {
  mkdirSync(MEMORY_DIR, { recursive: true });
}

function getSessionPath(sessionKey) {
  // Sanitize session key for filename
  const safe = sessionKey.replace(/[^a-zA-Z0-9-_]/g, '_');
  return join(MEMORY_DIR, `${safe}.json`);
}

/**
 * Session Memory Hook
 * Automatically saves and loads session context
 */
export const sessionMemoryHook = {
  id: 'session-memory',
  name: 'Session Memory',
  description: 'Persists session context to disk for recovery',
  events: ['session-start', 'post-turn', 'session-end'],
  priority: HOOK_PRIORITY.HIGH,
  enabled: true,

  async handler({ event, context, data }) {
    const { sessionKey } = context;
    if (!sessionKey) return { continue: true };

    const sessionPath = getSessionPath(sessionKey);

    switch (event) {
      case 'session-start':
        // Load existing session context if available
        if (existsSync(sessionPath)) {
          try {
            const saved = JSON.parse(readFileSync(sessionPath, 'utf-8'));
            return {
              continue: true,
              data: {
                ...data,
                recoveredContext: saved.context || [],
                recoveredAt: Date.now(),
                originalSavedAt: saved.savedAt
              },
              message: `Recovered ${saved.context?.length || 0} messages from previous session`
            };
          } catch {
            // Ignore load errors
          }
        }
        break;

      case 'post-turn':
        // Save session context after each turn
        try {
          const sessionData = {
            sessionKey,
            context: data.context || [],
            savedAt: Date.now(),
            metadata: {
              agentId: context.agentId,
              backend: context.backend,
              turnCount: data.context?.length || 0
            }
          };
          writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
        } catch (error) {
          console.error(`Session memory save failed: ${error.message}`);
        }
        break;

      case 'session-end':
        // Optionally clean up or archive
        // For now, we keep the session file for recovery
        break;
    }

    return { continue: true };
  }
};

/**
 * Load session from disk
 * @param {string} sessionKey
 */
export function loadSession(sessionKey) {
  const sessionPath = getSessionPath(sessionKey);
  if (existsSync(sessionPath)) {
    try {
      return JSON.parse(readFileSync(sessionPath, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Delete session from disk
 * @param {string} sessionKey
 */
export function deleteSession(sessionKey) {
  const sessionPath = getSessionPath(sessionKey);
  if (existsSync(sessionPath)) {
    try {
      const { unlinkSync } = require('fs');
      unlinkSync(sessionPath);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * List all saved sessions
 */
export function listSavedSessions() {
  try {
    const { readdirSync } = require('fs');
    const files = readdirSync(MEMORY_DIR).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const sessionPath = join(MEMORY_DIR, f);
      try {
        const data = JSON.parse(readFileSync(sessionPath, 'utf-8'));
        return {
          sessionKey: data.sessionKey,
          savedAt: data.savedAt,
          turnCount: data.metadata?.turnCount || 0,
          file: f
        };
      } catch {
        return { file: f, error: true };
      }
    });
  } catch {
    return [];
  }
}
