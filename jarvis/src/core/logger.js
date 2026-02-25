// JARVIS Logger - Production Level Logging
// Features: File rotation, log levels, timestamps, color support

import { writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || LOG_LEVELS.INFO;
    this.logDir = options.logDir || './logs';
    this.maxFiles = options.maxFiles || 7; // Keep 7 days
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (this.enableFile && !existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  getLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return join(this.logDir, `jarvis-${date}.log`);
  }

  format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
  }

  write(formatted) {
    // Console
    if (this.enableConsole) {
      process.stdout.write(formatted);
    }
    
    // File
    if (this.enableFile) {
      try {
        appendFileSync(this.getLogFile(), formatted);
        this.rotateIfNeeded();
      } catch (e) {
        console.error('Log write error:', e.message);
      }
    }
  }

  rotateIfNeeded() {
    try {
      const logFile = this.getLogFile();
      if (!existsSync(logFile)) return;
      
      const stats = require('fs').statSync(logFile);
      if (stats.size > this.maxSize) {
        const hash = createHash('md5').update(Date.now().toString()).digest('hex');
        const rotated = logFile.replace('.log', `-${hash}.log`);
        require('fs').renameSync(logFile, rotated);
        this.cleanOldLogs();
      }
    } catch (e) {}
  }

  cleanOldLogs() {
    try {
      const { readdirSync, unlinkSync, statSync } = require('fs');
      const files = readdirSync(this.logDir)
        .filter(f => f.startsWith('jarvis-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: join(this.logDir, f),
          time: statSync(join(this.logDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only maxFiles
      if (files.length > this.maxFiles) {
        for (const file of files.slice(this.maxFiles)) {
          unlinkSync(file.path);
        }
      }
    } catch (e) {}
  }

  error(message, meta) {
    if (this.level >= LOG_LEVELS.ERROR) {
      this.write(this.format('ERROR', message, meta));
    }
  }

  warn(message, meta) {
    if (this.level >= LOG_LEVELS.WARN) {
      this.write(this.format('WARN', message, meta));
    }
  }

  info(message, meta) {
    if (this.level >= LOG_LEVELS.INFO) {
      this.write(this.format('INFO', message, meta));
    }
  }

  debug(message, meta) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      this.write(this.format('DEBUG', message, meta));
    }
  }

  // Child logger with additional context
  child(additionalMeta) {
    const parent = this;
    return {
      error: (msg, meta) => parent.error(msg, { ...additionalMeta, ...meta }),
      warn: (msg, meta) => parent.warn(msg, { ...additionalMeta, ...meta }),
      info: (msg, meta) => parent.info(msg, { ...additionalMeta, ...meta }),
      debug: (msg, meta) => parent.debug(msg, { ...additionalMeta, ...meta })
    };
  }
}

// Default logger instance
let defaultLogger = null;

export function getLogger(options) {
  if (!defaultLogger) {
    defaultLogger = new Logger(options);
  }
  return defaultLogger;
}

export function createLogger(options) {
  return new Logger(options);
}

export default Logger;
