// JARVIS File Tools
// Enhanced file operations: read, write, edit, glob, grep

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname, basename, resolve, relative } from 'path';
import { homedir } from 'os';

// ============================================================
// Edit History (for undo/redo support)
// ============================================================

class EditHistoryManager {
  constructor() {
    this.stack = [];
    this.redoStack = [];
    this.maxHistory = 50;
    this.historyDir = join(homedir(), '.jarvis', 'edit-history');
    this.ensureDir();
  }

  ensureDir() {
    if (!existsSync(this.historyDir)) {
      mkdirSync(this.historyDir, { recursive: true });
    }
  }

  record(filePath, original, modified, operation) {
    const entry = {
      id: `edit_${Date.now()}`,
      filePath: resolve(filePath),
      original,
      modified,
      operation,
      timestamp: Date.now()
    };

    this.stack.push(entry);
    this.redoStack = []; // Clear redo on new action

    // Trim old history
    if (this.stack.length > this.maxHistory) {
      this.stack.shift();
    }

    // Save to disk for persistence
    this.saveToDisk(entry);
    return entry.id;
  }

  saveToDisk(entry) {
    try {
      const path = join(this.historyDir, `${entry.id}.json`);
      writeFileSync(path, JSON.stringify(entry, null, 2));
    } catch (e) {
      // Ignore save errors
    }
  }

  undo() {
    const entry = this.stack.pop();
    if (!entry) return { error: 'Nothing to undo' };

    this.redoStack.push(entry);
    writeFileSync(entry.filePath, entry.original);

    return {
      success: true,
      undone: entry.operation,
      file: entry.filePath
    };
  }

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return { error: 'Nothing to redo' };

    this.stack.push(entry);
    writeFileSync(entry.filePath, entry.modified);

    return {
      success: true,
      redone: entry.operation,
      file: entry.filePath
    };
  }

  getHistory(limit = 10) {
    return this.stack.slice(-limit).reverse().map(e => ({
      id: e.id,
      file: e.filePath,
      operation: e.operation,
      timestamp: new Date(e.timestamp).toISOString()
    }));
  }
}

export const editHistory = new EditHistoryManager();

// ============================================================
// Security: Path validation
// ============================================================

const BLOCKED_PATHS = [
  '/etc', '/root', '/var/log', '/sys', '/proc',
  'C:\\Windows', 'C:\\Program Files',
  '.ssh', '.gnupg', '.aws', '.env'
];

function isPathAllowed(filePath) {
  const resolved = resolve(filePath);
  const normalized = resolved.toLowerCase();

  // Block path traversal
  if (filePath.includes('..')) {
    return { allowed: false, reason: 'Path traversal not allowed' };
  }

  // Block sensitive paths
  for (const blocked of BLOCKED_PATHS) {
    if (normalized.includes(blocked.toLowerCase())) {
      return { allowed: false, reason: `Access to ${blocked} not allowed` };
    }
  }

  return { allowed: true };
}

// ============================================================
// file-read: Read file with line numbers, offset, limit
// ============================================================

export async function fileRead(params) {
  const { path: filePath, offset = 1, limit } = params;

  if (!filePath) {
    return { error: 'Path is required' };
  }

  const pathCheck = isPathAllowed(filePath);
  if (!pathCheck.allowed) {
    return { error: pathCheck.reason, blocked: true };
  }

  if (!existsSync(filePath)) {
    return { error: 'File not found', path: filePath };
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const totalLines = lines.length;

    // Apply offset and limit
    const startLine = Math.max(1, offset) - 1; // Convert to 0-indexed
    const endLine = limit ? Math.min(startLine + limit, totalLines) : totalLines;
    const selectedLines = lines.slice(startLine, endLine);

    // Format with line numbers
    const numberedContent = selectedLines.map((line, i) => {
      const lineNum = startLine + i + 1;
      return `${String(lineNum).padStart(6)}| ${line}`;
    }).join('\n');

    return {
      path: filePath,
      content: numberedContent,
      lines: selectedLines.length,
      totalLines,
      offset: startLine + 1,
      truncated: endLine < totalLines
    };
  } catch (error) {
    return { error: error.message, path: filePath };
  }
}

// ============================================================
// file-write: Create or overwrite file
// ============================================================

export async function fileWrite(params) {
  const { path: filePath, content } = params;

  if (!filePath) {
    return { error: 'Path is required' };
  }

  if (content === undefined || content === null) {
    return { error: 'Content is required' };
  }

  const pathCheck = isPathAllowed(filePath);
  if (!pathCheck.allowed) {
    return { error: pathCheck.reason, blocked: true };
  }

  try {
    // Record original content for undo (if file exists)
    let original = '';
    if (existsSync(filePath)) {
      original = readFileSync(filePath, 'utf-8');
    }

    // Ensure directory exists
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, content, 'utf-8');

    // Record for undo
    const historyId = editHistory.record(filePath, original, content, 'write');

    return {
      success: true,
      path: filePath,
      written: content.length,
      lines: content.split('\n').length,
      historyId
    };
  } catch (error) {
    return { error: error.message, path: filePath };
  }
}

// ============================================================
// file-edit: Replace specific text in file
// ============================================================

export async function fileEdit(params) {
  const { path: filePath, old_string, new_string, replace_all = false } = params;

  if (!filePath) {
    return { error: 'Path is required' };
  }

  if (!old_string) {
    return { error: 'old_string is required' };
  }

  if (new_string === undefined) {
    return { error: 'new_string is required' };
  }

  const pathCheck = isPathAllowed(filePath);
  if (!pathCheck.allowed) {
    return { error: pathCheck.reason, blocked: true };
  }

  if (!existsSync(filePath)) {
    return { error: 'File not found', path: filePath };
  }

  try {
    const original = readFileSync(filePath, 'utf-8');

    // Check if old_string exists
    if (!original.includes(old_string)) {
      return {
        error: 'old_string not found in file',
        path: filePath,
        hint: 'Ensure the old_string matches exactly, including whitespace'
      };
    }

    // Check for uniqueness (unless replace_all)
    if (!replace_all) {
      const count = (original.match(new RegExp(escapeRegex(old_string), 'g')) || []).length;
      if (count > 1) {
        return {
          error: `old_string found ${count} times. Use replace_all: true or provide more context`,
          path: filePath,
          occurrences: count
        };
      }
    }

    // Perform replacement
    const modified = replace_all
      ? original.split(old_string).join(new_string)
      : original.replace(old_string, new_string);

    writeFileSync(filePath, modified, 'utf-8');

    // Record for undo
    const historyId = editHistory.record(filePath, original, modified, 'edit');

    // Generate simple diff
    const diff = generateSimpleDiff(original, modified);

    return {
      success: true,
      path: filePath,
      diff,
      historyId,
      replacements: replace_all ? original.split(old_string).length - 1 : 1
    };
  } catch (error) {
    return { error: error.message, path: filePath };
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateSimpleDiff(original, modified) {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const diff = [];

  const maxLen = Math.max(origLines.length, modLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (origLines[i] !== modLines[i]) {
      if (origLines[i] !== undefined) {
        diff.push(`-${i + 1}: ${origLines[i]}`);
      }
      if (modLines[i] !== undefined) {
        diff.push(`+${i + 1}: ${modLines[i]}`);
      }
    }
  }

  return diff.slice(0, 20).join('\n') + (diff.length > 20 ? '\n... (truncated)' : '');
}

// ============================================================
// file-glob: Pattern matching for files
// ============================================================

export async function fileGlob(params) {
  const { pattern, path: basePath = '.', maxResults = 100 } = params;

  if (!pattern) {
    return { error: 'Pattern is required' };
  }

  const pathCheck = isPathAllowed(basePath);
  if (!pathCheck.allowed) {
    return { error: pathCheck.reason, blocked: true };
  }

  try {
    const results = [];
    const regex = globToRegex(pattern);

    function walkDir(dir, depth = 0) {
      if (depth > 10 || results.length >= maxResults) return;

      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          if (results.length >= maxResults) break;

          // Skip hidden and node_modules
          if (entry.startsWith('.') || entry === 'node_modules') continue;

          const fullPath = join(dir, entry);
          const relativePath = relative(basePath, fullPath);

          try {
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
              // Check if pattern wants directories
              if (pattern.includes('**')) {
                walkDir(fullPath, depth + 1);
              }
            } else if (regex.test(relativePath) || regex.test(entry)) {
              results.push({
                path: fullPath,
                name: entry,
                size: stat.size,
                modified: stat.mtime.toISOString()
              });
            }
          } catch {
            // Skip inaccessible files
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    }

    walkDir(resolve(basePath));

    // Sort by modification time (newest first)
    results.sort((a, b) => new Date(b.modified) - new Date(a.modified));

    return {
      pattern,
      basePath: resolve(basePath),
      results: results.slice(0, maxResults),
      count: results.length,
      truncated: results.length >= maxResults
    };
  } catch (error) {
    return { error: error.message, pattern };
  }
}

function globToRegex(glob) {
  let regex = glob
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '<<GLOBSTAR>>')
    .replace(/\*/g, '[^/\\\\]*')
    .replace(/<<GLOBSTAR>>/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(regex, 'i');
}

// ============================================================
// file-grep: Search file contents with regex
// ============================================================

export async function fileGrep(params) {
  const {
    pattern,
    path: basePath = '.',
    type,
    glob: fileGlob,
    context = 0,
    maxResults = 50,
    ignoreCase = true
  } = params;

  if (!pattern) {
    return { error: 'Pattern is required' };
  }

  const pathCheck = isPathAllowed(basePath);
  if (!pathCheck.allowed) {
    return { error: pathCheck.reason, blocked: true };
  }

  try {
    const results = [];
    const searchRegex = new RegExp(pattern, ignoreCase ? 'gi' : 'g');
    const typeExtensions = getTypeExtensions(type);

    function searchFile(filePath) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (searchRegex.test(lines[i])) {
            const match = {
              file: filePath,
              line: i + 1,
              content: lines[i].trim().substring(0, 200)
            };

            // Add context lines
            if (context > 0) {
              match.before = lines.slice(Math.max(0, i - context), i).map(l => l.trim());
              match.after = lines.slice(i + 1, i + 1 + context).map(l => l.trim());
            }

            results.push(match);

            if (results.length >= maxResults) return true;
          }
          searchRegex.lastIndex = 0; // Reset regex state
        }
      } catch {
        // Skip unreadable files
      }
      return false;
    }

    function walkDir(dir, depth = 0) {
      if (depth > 10 || results.length >= maxResults) return;

      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          if (results.length >= maxResults) break;

          // Skip hidden and node_modules
          if (entry.startsWith('.') || entry === 'node_modules') continue;

          const fullPath = join(dir, entry);

          try {
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
              walkDir(fullPath, depth + 1);
            } else {
              // Check file type filter
              if (typeExtensions && !typeExtensions.some(ext => entry.endsWith(ext))) {
                continue;
              }

              // Check glob filter
              if (fileGlob && !globToRegex(fileGlob).test(entry)) {
                continue;
              }

              // Skip large files (> 1MB)
              if (stat.size > 1024 * 1024) continue;

              if (searchFile(fullPath)) break;
            }
          } catch {
            // Skip inaccessible files
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    }

    // If basePath is a file, search just that file
    const baseStat = statSync(resolve(basePath));
    if (baseStat.isFile()) {
      searchFile(resolve(basePath));
    } else {
      walkDir(resolve(basePath));
    }

    return {
      pattern,
      basePath: resolve(basePath),
      results,
      count: results.length,
      truncated: results.length >= maxResults
    };
  } catch (error) {
    return { error: error.message, pattern };
  }
}

function getTypeExtensions(type) {
  const types = {
    js: ['.js', '.mjs', '.cjs'],
    ts: ['.ts', '.tsx'],
    py: ['.py'],
    java: ['.java'],
    go: ['.go'],
    rust: ['.rs'],
    c: ['.c', '.h'],
    cpp: ['.cpp', '.hpp', '.cc', '.hh'],
    json: ['.json'],
    yaml: ['.yaml', '.yml'],
    md: ['.md', '.markdown'],
    html: ['.html', '.htm'],
    css: ['.css', '.scss', '.sass', '.less'],
    sql: ['.sql']
  };

  return type ? types[type.toLowerCase()] : null;
}

// ============================================================
// file-undo / file-redo
// ============================================================

export async function fileUndo() {
  return editHistory.undo();
}

export async function fileRedo() {
  return editHistory.redo();
}

export async function fileHistory(params) {
  const { limit = 10 } = params || {};
  return { history: editHistory.getHistory(limit) };
}

// ============================================================
// Export all file tools
// ============================================================

export const fileTools = {
  'file-read': {
    name: 'file-read',
    description: 'Read file contents with optional line range. Returns numbered lines.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute file path' },
        offset: { type: 'number', description: 'Starting line (1-based)', default: 1 },
        limit: { type: 'number', description: 'Max lines to read' }
      },
      required: ['path']
    },
    handler: fileRead
  },

  'file-write': {
    name: 'file-write',
    description: 'Create or overwrite a file with new content.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute file path' },
        content: { type: 'string', description: 'File content to write' }
      },
      required: ['path', 'content']
    },
    handler: fileWrite
  },

  'file-edit': {
    name: 'file-edit',
    description: 'Replace specific text in a file. Supports undo.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute file path' },
        old_string: { type: 'string', description: 'Text to find and replace' },
        new_string: { type: 'string', description: 'Replacement text' },
        replace_all: { type: 'boolean', description: 'Replace all occurrences', default: false }
      },
      required: ['path', 'old_string', 'new_string']
    },
    handler: fileEdit
  },

  'file-glob': {
    name: 'file-glob',
    description: 'Find files matching a glob pattern (e.g., **/*.js)',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern (e.g., *.js, **/*.ts)' },
        path: { type: 'string', description: 'Base directory to search', default: '.' },
        maxResults: { type: 'number', description: 'Max files to return', default: 100 }
      },
      required: ['pattern']
    },
    handler: fileGlob
  },

  'file-grep': {
    name: 'file-grep',
    description: 'Search file contents with regex pattern',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regex pattern to search' },
        path: { type: 'string', description: 'File or directory to search', default: '.' },
        type: { type: 'string', description: 'File type filter (js, ts, py, etc.)' },
        glob: { type: 'string', description: 'Glob pattern for files' },
        context: { type: 'number', description: 'Lines of context around matches', default: 0 },
        maxResults: { type: 'number', description: 'Max matches to return', default: 50 }
      },
      required: ['pattern']
    },
    handler: fileGrep
  },

  'file-undo': {
    name: 'file-undo',
    description: 'Undo the last file edit operation',
    parameters: { type: 'object', properties: {} },
    handler: fileUndo
  },

  'file-redo': {
    name: 'file-redo',
    description: 'Redo a previously undone file edit',
    parameters: { type: 'object', properties: {} },
    handler: fileRedo
  },

  'file-history': {
    name: 'file-history',
    description: 'Get recent file edit history',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of entries to return', default: 10 }
      }
    },
    handler: fileHistory
  }
};

export default fileTools;
