// JARVIS Search Tools
// Codebase search, web search, and semantic search

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, relative, extname, basename, resolve } from 'path';

// ============================================================
// Constants
// ============================================================

const MAX_RESULTS = 100;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv', '.venv']);
const SKIP_EXTS = new Set(['.exe', '.dll', '.so', '.dylib', '.bin', '.lock', '.map']);

// ============================================================
// Codebase Search Tools
// ============================================================

export const searchTools = {
  // Find files by name pattern
  'search-files': {
    name: 'search-files',
    description: 'Search for files by name pattern in codebase',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'File name pattern (supports * and ?)' },
        path: { type: 'string', description: 'Base directory', default: '.' },
        type: { type: 'string', description: 'File extension filter (e.g., js, ts, py)' },
        maxDepth: { type: 'number', default: 10 },
        maxResults: { type: 'number', default: 50 }
      },
      required: ['pattern']
    },
    handler: async (params) => {
      const { pattern, path: basePath = '.', type, maxDepth = 10, maxResults = 50 } = params;

      const results = [];
      const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');

      function walk(dir, depth = 0) {
        if (depth > maxDepth || results.length >= maxResults) return;

        try {
          const entries = readdirSync(dir);

          for (const entry of entries) {
            if (results.length >= maxResults) break;
            if (entry.startsWith('.') || SKIP_DIRS.has(entry)) continue;

            const fullPath = join(dir, entry);

            try {
              const stat = statSync(fullPath);

              if (stat.isDirectory()) {
                walk(fullPath, depth + 1);
              } else {
                // Check extension filter
                if (type && !entry.endsWith(`.${type}`)) continue;
                if (SKIP_EXTS.has(extname(entry))) continue;

                // Check pattern match
                if (regex.test(entry)) {
                  results.push({
                    path: fullPath,
                    name: entry,
                    size: stat.size,
                    modified: stat.mtime.toISOString()
                  });
                }
              }
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }

      walk(resolve(basePath));

      return {
        success: true,
        pattern,
        count: results.length,
        results: results.slice(0, maxResults),
        truncated: results.length >= maxResults
      };
    }
  },

  // Search code content
  'search-code': {
    name: 'search-code',
    description: 'Search for pattern in code files',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search pattern (regex supported)' },
        path: { type: 'string', description: 'Base directory', default: '.' },
        type: { type: 'string', description: 'File extension filter' },
        caseSensitive: { type: 'boolean', default: false },
        wholeWord: { type: 'boolean', default: false },
        context: { type: 'number', default: 2, description: 'Lines of context' },
        maxResults: { type: 'number', default: 50 }
      },
      required: ['query']
    },
    handler: async (params) => {
      const {
        query,
        path: basePath = '.',
        type,
        caseSensitive = false,
        wholeWord = false,
        context = 2,
        maxResults = 50
      } = params;

      const results = [];
      let pattern = query;

      if (wholeWord) {
        pattern = `\\b${query}\\b`;
      }

      const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');

      function searchFile(filePath) {
        try {
          const stat = statSync(filePath);
          if (stat.size > MAX_FILE_SIZE) return;

          const content = readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            if (results.length >= maxResults) return true;

            if (regex.test(lines[i])) {
              const match = {
                file: filePath,
                line: i + 1,
                content: lines[i].trim().substring(0, 200)
              };

              if (context > 0) {
                match.before = lines.slice(Math.max(0, i - context), i).map(l => l.trim());
                match.after = lines.slice(i + 1, i + 1 + context).map(l => l.trim());
              }

              results.push(match);
              regex.lastIndex = 0;
            }
          }
        } catch { /* skip */ }
        return false;
      }

      function walk(dir, depth = 0) {
        if (depth > 10 || results.length >= maxResults) return;

        try {
          const entries = readdirSync(dir);

          for (const entry of entries) {
            if (results.length >= maxResults) break;
            if (entry.startsWith('.') || SKIP_DIRS.has(entry)) continue;

            const fullPath = join(dir, entry);

            try {
              const stat = statSync(fullPath);

              if (stat.isDirectory()) {
                walk(fullPath, depth + 1);
              } else {
                if (type && !entry.endsWith(`.${type}`)) continue;
                if (SKIP_EXTS.has(extname(entry))) continue;
                if (searchFile(fullPath)) break;
              }
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }

      walk(resolve(basePath));

      return {
        success: true,
        query,
        count: results.length,
        results,
        truncated: results.length >= maxResults
      };
    }
  },

  // Find definition (class, function, variable)
  'search-definition': {
    name: 'search-definition',
    description: 'Find definition of a symbol (class, function, variable)',
    parameters: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Symbol name to find' },
        path: { type: 'string', default: '.' },
        type: { type: 'string', description: 'File extension filter' }
      },
      required: ['symbol']
    },
    handler: async (params) => {
      const { symbol, path: basePath = '.', type } = params;

      // Common definition patterns
      const patterns = [
        // JS/TS
        new RegExp(`(?:function|const|let|var|class)\\s+${symbol}\\b`),
        new RegExp(`${symbol}\\s*[:=]\\s*(?:function|async|\\(|\\{)`),
        new RegExp(`export\\s+(?:default\\s+)?(?:function|class|const|let|var)\\s+${symbol}\\b`),
        // Python
        new RegExp(`(?:def|class|async def)\\s+${symbol}\\b`),
        new RegExp(`${symbol}\\s*=`),
        // Go
        new RegExp(`func\\s+(?:\\([^)]+\\)\\s+)?${symbol}\\b`),
        new RegExp(`type\\s+${symbol}\\s+(?:struct|interface)`),
        // Rust
        new RegExp(`(?:fn|struct|enum|trait|impl)\\s+${symbol}\\b`),
      ];

      const results = [];

      function searchFile(filePath) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            for (const pattern of patterns) {
              if (pattern.test(lines[i])) {
                results.push({
                  file: filePath,
                  line: i + 1,
                  content: lines[i].trim().substring(0, 200),
                  context: lines.slice(i, Math.min(i + 5, lines.length)).join('\n')
                });
                return;
              }
            }
          }
        } catch { /* skip */ }
      }

      function walk(dir, depth = 0) {
        if (depth > 10 || results.length >= 20) return;

        try {
          const entries = readdirSync(dir);

          for (const entry of entries) {
            if (entry.startsWith('.') || SKIP_DIRS.has(entry)) continue;

            const fullPath = join(dir, entry);

            try {
              const stat = statSync(fullPath);

              if (stat.isDirectory()) {
                walk(fullPath, depth + 1);
              } else {
                if (type && !entry.endsWith(`.${type}`)) continue;
                if (SKIP_EXTS.has(extname(entry))) continue;
                searchFile(fullPath);
              }
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }

      walk(resolve(basePath));

      return {
        success: true,
        symbol,
        found: results.length > 0,
        definitions: results
      };
    }
  },

  // Find references/usages
  'search-references': {
    name: 'search-references',
    description: 'Find all references/usages of a symbol',
    parameters: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Symbol name to find references for' },
        path: { type: 'string', default: '.' },
        type: { type: 'string', description: 'File extension filter' },
        maxResults: { type: 'number', default: 50 }
      },
      required: ['symbol']
    },
    handler: async (params) => {
      const { symbol, path: basePath = '.', type, maxResults = 50 } = params;

      // Word boundary search
      const regex = new RegExp(`\\b${symbol}\\b`, 'g');
      const results = [];

      function searchFile(filePath) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            if (results.length >= maxResults) return true;

            if (regex.test(lines[i])) {
              results.push({
                file: filePath,
                line: i + 1,
                content: lines[i].trim().substring(0, 200)
              });
              regex.lastIndex = 0;
            }
          }
        } catch { /* skip */ }
        return false;
      }

      function walk(dir, depth = 0) {
        if (depth > 10 || results.length >= maxResults) return;

        try {
          const entries = readdirSync(dir);

          for (const entry of entries) {
            if (results.length >= maxResults) break;
            if (entry.startsWith('.') || SKIP_DIRS.has(entry)) continue;

            const fullPath = join(dir, entry);

            try {
              const stat = statSync(fullPath);

              if (stat.isDirectory()) {
                walk(fullPath, depth + 1);
              } else {
                if (type && !entry.endsWith(`.${type}`)) continue;
                if (SKIP_EXTS.has(extname(entry))) continue;
                if (searchFile(fullPath)) break;
              }
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }

      walk(resolve(basePath));

      return {
        success: true,
        symbol,
        count: results.length,
        references: results,
        truncated: results.length >= maxResults
      };
    }
  },

  // Project structure overview
  'search-structure': {
    name: 'search-structure',
    description: 'Get project structure overview',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', default: '.' },
        maxDepth: { type: 'number', default: 3 },
        showFiles: { type: 'boolean', default: true }
      }
    },
    handler: async (params) => {
      const { path: basePath = '.', maxDepth = 3, showFiles = true } = params;

      const tree = [];
      const stats = { dirs: 0, files: 0, totalSize: 0 };

      function walk(dir, depth = 0, prefix = '') {
        if (depth > maxDepth) return;

        try {
          const entries = readdirSync(dir).sort();
          const filteredEntries = entries.filter(e => !e.startsWith('.') && !SKIP_DIRS.has(e));

          for (let i = 0; i < filteredEntries.length; i++) {
            const entry = filteredEntries[i];
            const isLast = i === filteredEntries.length - 1;
            const fullPath = join(dir, entry);

            try {
              const stat = statSync(fullPath);
              const connector = isLast ? '└── ' : '├── ';
              const newPrefix = prefix + (isLast ? '    ' : '│   ');

              if (stat.isDirectory()) {
                stats.dirs++;
                tree.push(`${prefix}${connector}${entry}/`);
                walk(fullPath, depth + 1, newPrefix);
              } else if (showFiles) {
                stats.files++;
                stats.totalSize += stat.size;
                tree.push(`${prefix}${connector}${entry}`);
              }
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }

      tree.push(basename(resolve(basePath)) + '/');
      walk(resolve(basePath));

      return {
        success: true,
        tree: tree.join('\n'),
        stats: {
          directories: stats.dirs,
          files: stats.files,
          totalSize: `${(stats.totalSize / 1024).toFixed(1)} KB`
        }
      };
    }
  }
};

export default searchTools;
