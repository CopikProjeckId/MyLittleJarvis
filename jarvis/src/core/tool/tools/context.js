// JARVIS Context/Memory Tools
// Conversation context management and short-term memory

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ============================================================
// Memory Store (In-Memory + Persistent)
// ============================================================

const MEMORY_DIR = join(homedir(), '.jarvis', 'memory');
const MAX_CONTEXT_SIZE = 100;
const MAX_MEMORY_ITEMS = 1000;

// Ensure memory directory exists
if (!existsSync(MEMORY_DIR)) {
  mkdirSync(MEMORY_DIR, { recursive: true });
}

// In-memory stores
const contextStore = new Map();  // Session context
const memoryStore = new Map();   // Persistent memory
const taskStore = new Map();     // Task tracking

// Load persistent memory on startup
try {
  const memoryFile = join(MEMORY_DIR, 'memory.json');
  if (existsSync(memoryFile)) {
    const data = JSON.parse(readFileSync(memoryFile, 'utf-8'));
    for (const [key, value] of Object.entries(data)) {
      memoryStore.set(key, value);
    }
  }
} catch { /* ignore */ }

// Save memory to disk
function saveMemory() {
  try {
    const data = Object.fromEntries(memoryStore.entries());
    writeFileSync(join(MEMORY_DIR, 'memory.json'), JSON.stringify(data, null, 2));
  } catch { /* ignore */ }
}

// ============================================================
// Context Tools
// ============================================================

export const contextTools = {
  // Store context
  'context-set': {
    name: 'context-set',
    description: 'Store value in session context',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Context key' },
        value: { description: 'Value to store (any type)' },
        ttl: { type: 'number', description: 'Time to live in seconds (optional)' }
      },
      required: ['key', 'value']
    },
    handler: async (params) => {
      const { key, value, ttl } = params;

      if (contextStore.size >= MAX_CONTEXT_SIZE) {
        // Remove oldest entry
        const oldestKey = contextStore.keys().next().value;
        contextStore.delete(oldestKey);
      }

      const entry = {
        value,
        createdAt: Date.now(),
        expiresAt: ttl ? Date.now() + ttl * 1000 : null
      };

      contextStore.set(key, entry);

      return { success: true, key, stored: true };
    }
  },

  // Get context
  'context-get': {
    name: 'context-get',
    description: 'Get value from session context',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Context key' }
      },
      required: ['key']
    },
    handler: async (params) => {
      const { key } = params;
      const entry = contextStore.get(key);

      if (!entry) {
        return { success: false, error: 'Key not found' };
      }

      // Check expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        contextStore.delete(key);
        return { success: false, error: 'Key expired' };
      }

      return { success: true, key, value: entry.value };
    }
  },

  // List context
  'context-list': {
    name: 'context-list',
    description: 'List all keys in session context',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const keys = [];

      for (const [key, entry] of contextStore.entries()) {
        // Skip expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          contextStore.delete(key);
          continue;
        }

        keys.push({
          key,
          type: typeof entry.value,
          createdAt: new Date(entry.createdAt).toISOString(),
          expiresAt: entry.expiresAt ? new Date(entry.expiresAt).toISOString() : null
        });
      }

      return { success: true, count: keys.length, keys };
    }
  },

  // Clear context
  'context-clear': {
    name: 'context-clear',
    description: 'Clear session context',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Key pattern to clear (optional, clears all if not provided)' }
      }
    },
    handler: async (params) => {
      const { pattern } = params;

      if (pattern) {
        const regex = new RegExp(pattern);
        let cleared = 0;

        for (const key of contextStore.keys()) {
          if (regex.test(key)) {
            contextStore.delete(key);
            cleared++;
          }
        }

        return { success: true, cleared };
      }

      const count = contextStore.size;
      contextStore.clear();
      return { success: true, cleared: count };
    }
  },

  // ============================================================
  // Persistent Memory Tools
  // ============================================================

  'memory-store': {
    name: 'memory-store',
    description: 'Store value in persistent memory (survives restarts)',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key' },
        value: { description: 'Value to store' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' }
      },
      required: ['key', 'value']
    },
    handler: async (params) => {
      const { key, value, tags = [] } = params;

      if (memoryStore.size >= MAX_MEMORY_ITEMS) {
        return { success: false, error: 'Memory limit reached. Delete some items first.' };
      }

      const entry = {
        value,
        tags,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      memoryStore.set(key, entry);
      saveMemory();

      return { success: true, key, stored: true };
    }
  },

  'memory-get': {
    name: 'memory-get',
    description: 'Get value from persistent memory',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key' }
      },
      required: ['key']
    },
    handler: async (params) => {
      const { key } = params;
      const entry = memoryStore.get(key);

      if (!entry) {
        return { success: false, error: 'Key not found' };
      }

      return {
        success: true,
        key,
        value: entry.value,
        tags: entry.tags,
        createdAt: new Date(entry.createdAt).toISOString()
      };
    }
  },

  'memory-search': {
    name: 'memory-search',
    description: 'Search persistent memory by key pattern or tag',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Key pattern to search' },
        tag: { type: 'string', description: 'Tag to filter by' },
        limit: { type: 'number', default: 20 }
      }
    },
    handler: async (params) => {
      const { query, tag, limit = 20 } = params;
      const results = [];

      for (const [key, entry] of memoryStore.entries()) {
        if (results.length >= limit) break;

        let matches = true;

        if (query && !key.toLowerCase().includes(query.toLowerCase())) {
          matches = false;
        }

        if (tag && !entry.tags.includes(tag)) {
          matches = false;
        }

        if (matches) {
          results.push({
            key,
            value: entry.value,
            tags: entry.tags,
            createdAt: new Date(entry.createdAt).toISOString()
          });
        }
      }

      return { success: true, count: results.length, results };
    }
  },

  'memory-delete': {
    name: 'memory-delete',
    description: 'Delete from persistent memory',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key to delete' }
      },
      required: ['key']
    },
    handler: async (params) => {
      const { key } = params;

      if (!memoryStore.has(key)) {
        return { success: false, error: 'Key not found' };
      }

      memoryStore.delete(key);
      saveMemory();

      return { success: true, key, deleted: true };
    }
  },

  // ============================================================
  // Task Tracking Tools
  // ============================================================

  'task-create': {
    name: 'task-create',
    description: 'Create a task for tracking',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['title']
    },
    handler: async (params) => {
      const { title, description = '', priority = 'medium', tags = [] } = params;

      const id = `task_${Date.now()}`;
      const task = {
        id,
        title,
        description,
        priority,
        tags,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      taskStore.set(id, task);

      return { success: true, task };
    }
  },

  'task-update': {
    name: 'task-update',
    description: 'Update task status',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
        notes: { type: 'string', description: 'Additional notes' }
      },
      required: ['id', 'status']
    },
    handler: async (params) => {
      const { id, status, notes } = params;
      const task = taskStore.get(id);

      if (!task) {
        return { success: false, error: 'Task not found' };
      }

      task.status = status;
      task.updatedAt = Date.now();
      if (notes) task.notes = notes;

      taskStore.set(id, task);

      return { success: true, task };
    }
  },

  'task-list': {
    name: 'task-list',
    description: 'List all tasks',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled', 'all'], default: 'all' }
      }
    },
    handler: async (params) => {
      const { status = 'all' } = params;
      const tasks = [];

      for (const task of taskStore.values()) {
        if (status === 'all' || task.status === status) {
          tasks.push(task);
        }
      }

      // Sort by priority and creation time
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      tasks.sort((a, b) => {
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return pDiff !== 0 ? pDiff : b.createdAt - a.createdAt;
      });

      return { success: true, count: tasks.length, tasks };
    }
  },

  // ============================================================
  // Conversation Summary
  // ============================================================

  'conversation-summary': {
    name: 'conversation-summary',
    description: 'Get summary of current session',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      // Get tasks summary
      let pending = 0, inProgress = 0, completed = 0;
      for (const task of taskStore.values()) {
        if (task.status === 'pending') pending++;
        else if (task.status === 'in_progress') inProgress++;
        else if (task.status === 'completed') completed++;
      }

      return {
        success: true,
        summary: {
          contextItems: contextStore.size,
          memoryItems: memoryStore.size,
          tasks: {
            pending,
            inProgress,
            completed,
            total: taskStore.size
          },
          sessionStart: new Date(process.uptime() * 1000).toISOString()
        }
      };
    }
  }
};

export default contextTools;
