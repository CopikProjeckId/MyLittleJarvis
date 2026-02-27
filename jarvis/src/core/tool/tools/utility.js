// JARVIS Utility Tools
// General purpose utilities for common operations

import { execSync } from 'child_process';
import { platform, hostname, cpus, totalmem, freemem, uptime } from 'os';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================
// Calculator / Math
// ============================================================

export const utilityTools = {
  'calc': {
    name: 'calc',
    description: 'Evaluate mathematical expression safely',
    parameters: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Math expression (e.g., "2 + 2 * 3")' }
      },
      required: ['expression']
    },
    handler: async (params) => {
      const { expression } = params;
      if (!expression) return { error: 'Expression required' };

      // Sanitize - only allow safe math characters
      const sanitized = expression.replace(/[^0-9+\-*/().%\s^]/g, '');
      if (sanitized !== expression.replace(/\s/g, '').replace(/Math\.\w+/g, '')) {
        return { error: 'Invalid characters in expression' };
      }

      try {
        // Use Function for safe eval (no access to global scope)
        const result = new Function(`return (${sanitized})`)();
        return { success: true, expression, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ============================================================
  // Date/Time
  // ============================================================

  'datetime': {
    name: 'datetime',
    description: 'Get current date/time or format a timestamp',
    parameters: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['iso', 'unix', 'human', 'date', 'time'], default: 'iso' },
        timezone: { type: 'string', default: 'Asia/Seoul' },
        timestamp: { type: 'number', description: 'Unix timestamp to format (optional)' }
      }
    },
    handler: async (params) => {
      const { format = 'iso', timezone = 'Asia/Seoul', timestamp } = params;
      const date = timestamp ? new Date(timestamp * 1000) : new Date();

      const formats = {
        iso: date.toISOString(),
        unix: Math.floor(date.getTime() / 1000),
        human: date.toLocaleString('ko-KR', { timeZone: timezone }),
        date: date.toLocaleDateString('ko-KR', { timeZone: timezone }),
        time: date.toLocaleTimeString('ko-KR', { timeZone: timezone })
      };

      return {
        success: true,
        result: formats[format] || formats.iso,
        format,
        timezone
      };
    }
  },

  // ============================================================
  // JSON Operations
  // ============================================================

  'json-parse': {
    name: 'json-parse',
    description: 'Parse JSON string and optionally extract a path',
    parameters: {
      type: 'object',
      properties: {
        json: { type: 'string', description: 'JSON string to parse' },
        path: { type: 'string', description: 'Dot notation path (e.g., "data.users[0].name")' }
      },
      required: ['json']
    },
    handler: async (params) => {
      const { json, path } = params;

      try {
        const parsed = JSON.parse(json);

        if (path) {
          // Extract value at path
          const value = path.split('.').reduce((obj, key) => {
            const match = key.match(/^(\w+)\[(\d+)\]$/);
            if (match) {
              return obj?.[match[1]]?.[parseInt(match[2])];
            }
            return obj?.[key];
          }, parsed);

          return { success: true, value, path };
        }

        return { success: true, data: parsed };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  'json-format': {
    name: 'json-format',
    description: 'Format/prettify JSON',
    parameters: {
      type: 'object',
      properties: {
        json: { type: 'string', description: 'JSON string' },
        indent: { type: 'number', default: 2 }
      },
      required: ['json']
    },
    handler: async (params) => {
      const { json, indent = 2 } = params;

      try {
        const parsed = JSON.parse(json);
        const formatted = JSON.stringify(parsed, null, indent);
        return { success: true, formatted };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ============================================================
  // System Info
  // ============================================================

  'system-info': {
    name: 'system-info',
    description: 'Get system information',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return {
        success: true,
        platform: platform(),
        hostname: hostname(),
        cpus: cpus().length,
        totalMemory: `${(totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
        freeMemory: `${(freemem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
        uptime: `${(uptime() / 3600).toFixed(1)} hours`,
        nodeVersion: process.version
      };
    }
  },

  // ============================================================
  // UUID Generator
  // ============================================================

  'uuid': {
    name: 'uuid',
    description: 'Generate UUID',
    parameters: {
      type: 'object',
      properties: {
        count: { type: 'number', default: 1, description: 'Number of UUIDs to generate (max 10)' }
      }
    },
    handler: async (params) => {
      const count = Math.min(params.count || 1, 10);
      const uuids = [];

      for (let i = 0; i < count; i++) {
        uuids.push(crypto.randomUUID());
      }

      return {
        success: true,
        uuids: count === 1 ? uuids[0] : uuids
      };
    }
  },

  // ============================================================
  // Hash
  // ============================================================

  'hash': {
    name: 'hash',
    description: 'Generate hash of text',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to hash' },
        algorithm: { type: 'string', enum: ['md5', 'sha1', 'sha256', 'sha512'], default: 'sha256' }
      },
      required: ['text']
    },
    handler: async (params) => {
      const { text, algorithm = 'sha256' } = params;

      try {
        const crypto = await import('crypto');
        const hash = crypto.createHash(algorithm).update(text).digest('hex');
        return { success: true, hash, algorithm };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ============================================================
  // Base64
  // ============================================================

  'base64': {
    name: 'base64',
    description: 'Encode or decode base64',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to encode/decode' },
        action: { type: 'string', enum: ['encode', 'decode'], default: 'encode' }
      },
      required: ['text']
    },
    handler: async (params) => {
      const { text, action = 'encode' } = params;

      try {
        const result = action === 'encode'
          ? Buffer.from(text).toString('base64')
          : Buffer.from(text, 'base64').toString('utf-8');

        return { success: true, result, action };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ============================================================
  // URL Encode/Decode
  // ============================================================

  'url-encode': {
    name: 'url-encode',
    description: 'URL encode or decode text',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to encode/decode' },
        action: { type: 'string', enum: ['encode', 'decode'], default: 'encode' }
      },
      required: ['text']
    },
    handler: async (params) => {
      const { text, action = 'encode' } = params;

      const result = action === 'encode'
        ? encodeURIComponent(text)
        : decodeURIComponent(text);

      return { success: true, result, action };
    }
  },

  // ============================================================
  // String Operations
  // ============================================================

  'string-transform': {
    name: 'string-transform',
    description: 'Transform string (case, trim, etc.)',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Input text' },
        transform: {
          type: 'string',
          enum: ['uppercase', 'lowercase', 'capitalize', 'trim', 'reverse', 'camelCase', 'snakeCase', 'kebabCase'],
          default: 'trim'
        }
      },
      required: ['text']
    },
    handler: async (params) => {
      const { text, transform = 'trim' } = params;

      const transforms = {
        uppercase: text.toUpperCase(),
        lowercase: text.toLowerCase(),
        capitalize: text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
        trim: text.trim(),
        reverse: text.split('').reverse().join(''),
        camelCase: text.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^./, s => s.toLowerCase()),
        snakeCase: text.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[-\s]+/g, '_'),
        kebabCase: text.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/[_\s]+/g, '-')
      };

      return {
        success: true,
        result: transforms[transform] || text,
        transform
      };
    }
  },

  // ============================================================
  // Random
  // ============================================================

  'random': {
    name: 'random',
    description: 'Generate random number or string',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['number', 'string', 'hex'], default: 'number' },
        min: { type: 'number', default: 0 },
        max: { type: 'number', default: 100 },
        length: { type: 'number', default: 16, description: 'For string type' }
      }
    },
    handler: async (params) => {
      const { type = 'number', min = 0, max = 100, length = 16 } = params;

      if (type === 'number') {
        const result = Math.floor(Math.random() * (max - min + 1)) + min;
        return { success: true, result, type };
      }

      if (type === 'hex') {
        const result = [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        return { success: true, result, type };
      }

      // string
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const result = [...Array(Math.min(length, 64))].map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
      return { success: true, result, type };
    }
  },

  // ============================================================
  // HTTP Request (simple)
  // ============================================================

  'http': {
    name: 'http',
    description: 'Make HTTP request',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to request' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
        headers: { type: 'object', description: 'Request headers' },
        body: { type: 'string', description: 'Request body (for POST/PUT)' },
        timeout: { type: 'number', default: 30000 }
      },
      required: ['url']
    },
    handler: async (params) => {
      const { url, method = 'GET', headers = {}, body, timeout = 30000 } = params;

      // Validate URL
      if (!url.match(/^https?:\/\//i)) {
        return { success: false, error: 'URL must start with http:// or https://' };
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'User-Agent': 'JARVIS/1.0',
            ...headers
          },
          body: body && method !== 'GET' ? body : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const text = await response.text();
        let data = text;

        // Try to parse as JSON
        try {
          data = JSON.parse(text);
        } catch {
          // Keep as text
        }

        return {
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: typeof data === 'string' && data.length > 10000 ? data.substring(0, 10000) + '...' : data
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ============================================================
  // Environment Variables (safe read only)
  // ============================================================

  'env': {
    name: 'env',
    description: 'Get environment variable (safe, non-sensitive only)',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Environment variable name' }
      },
      required: ['name']
    },
    handler: async (params) => {
      const { name } = params;

      // Block sensitive env vars
      const blocked = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'CREDENTIAL', 'AUTH', 'PRIVATE'];
      const upperName = name.toUpperCase();

      if (blocked.some(b => upperName.includes(b))) {
        return { success: false, error: 'Cannot access sensitive environment variables' };
      }

      const value = process.env[name];
      return {
        success: true,
        name,
        value: value || null,
        exists: value !== undefined
      };
    }
  },

  // ============================================================
  // Sleep/Wait
  // ============================================================

  'sleep': {
    name: 'sleep',
    description: 'Wait for specified milliseconds',
    parameters: {
      type: 'object',
      properties: {
        ms: { type: 'number', description: 'Milliseconds to wait (max 60000)' }
      },
      required: ['ms']
    },
    handler: async (params) => {
      const ms = Math.min(Math.max(params.ms || 1000, 0), 60000);
      await new Promise(resolve => setTimeout(resolve, ms));
      return { success: true, waited: ms };
    }
  }
};

export default utilityTools;
