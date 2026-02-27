// JARVIS Config Loader
// OpenClaw-style config file management with hot reload

import { readFileSync, writeFileSync, existsSync, mkdirSync, watch } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { EventEmitter } from 'events';
import crypto from 'crypto';

// Default config path: ~/.jarvis/jarvis.json
const CONFIG_DIR = join(homedir(), '.jarvis');
const CONFIG_FILE = join(CONFIG_DIR, 'jarvis.json');

// Default configuration
const DEFAULT_CONFIG = {
  gateway: {
    port: 18789,
    bind: '127.0.0.1',
    auth: {
      token: null,           // Bearer token (null = generate on first run)
      allowLocal: true,      // Skip auth for localhost
      allowTailscale: false  // Future: Tailscale identity headers
    }
  },
  ollama: {
    host: 'http://localhost:11434',
    timeout: 60000
  },
  models: {
    orchestrator: 'qwen3:1.7b',
    assistant: 'qwen3.5:cloud',
    fallback: ['qwen3:1.7b', 'phi3:mini']
  },
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100
  },
  logging: {
    level: 'info',
    redactSensitive: true
  },
  channels: {
    telegram: { enabled: false },
    discord: { enabled: false },
    cli: { enabled: true }
  },
  nmt: {
    enabled: false,
    path: '../nmt-system',  // Relative to JARVIS root or absolute path
    dataDir: './data'
  }
};

export class ConfigLoader extends EventEmitter {
  constructor(options = {}) {
    super();
    this.configPath = options.configPath || CONFIG_FILE;
    this.configDir = options.configDir || CONFIG_DIR;
    this.config = null;
    this.watcher = null;
    this.reloadDebounce = null;
  }

  /**
   * Initialize config - load or create default
   */
  async init() {
    // Ensure config directory exists
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
      console.log(`📁 Created config directory: ${this.configDir}`);
    }

    // Load or create config
    if (existsSync(this.configPath)) {
      this.load();
    } else {
      this.config = this.createDefault();
      this.save();
      console.log(`📝 Created default config: ${this.configPath}`);
    }

    return this.config;
  }

  /**
   * Load config from file
   */
  load() {
    try {
      const content = readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);

      // Merge with defaults (ensures new fields are added)
      this.config = this.deepMerge(DEFAULT_CONFIG, parsed);

      console.log(`⚙️ Config loaded: ${this.configPath}`);
      this.emit('loaded', this.config);

      return this.config;
    } catch (error) {
      console.error(`❌ Config load error: ${error.message}`);
      console.log('Using default config...');
      this.config = { ...DEFAULT_CONFIG };
      return this.config;
    }
  }

  /**
   * Save config to file
   */
  save() {
    try {
      const content = JSON.stringify(this.config, null, 2);
      writeFileSync(this.configPath, content, { mode: 0o600 });
      console.log(`💾 Config saved: ${this.configPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Config save error: ${error.message}`);
      return false;
    }
  }

  /**
   * Create default config with generated token
   */
  createDefault() {
    const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    // Generate random token
    config.gateway.auth.token = crypto.randomBytes(32).toString('hex');

    return config;
  }

  /**
   * Get a config value by path (e.g., 'gateway.port')
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value === undefined || value === null) {
        return defaultValue;
      }
      value = value[key];
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set a config value by path
   */
  set(path, value) {
    const keys = path.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in obj)) {
        obj[key] = {};
      }
      obj = obj[key];
    }

    obj[keys[keys.length - 1]] = value;
    this.emit('changed', { path, value });
  }

  /**
   * Start watching config file for changes (hot reload)
   */
  startWatching() {
    if (this.watcher) return;

    try {
      this.watcher = watch(this.configPath, (eventType) => {
        if (eventType === 'change') {
          // Debounce rapid changes
          if (this.reloadDebounce) {
            clearTimeout(this.reloadDebounce);
          }

          this.reloadDebounce = setTimeout(() => {
            console.log('🔄 Config file changed, reloading...');
            const oldConfig = { ...this.config };
            this.load();
            this.emit('reloaded', { oldConfig, newConfig: this.config });
          }, 100);
        }
      });

      console.log('👁️ Watching config for changes');
    } catch (error) {
      console.warn(`⚠️ Could not watch config: ${error.message}`);
    }
  }

  /**
   * Stop watching config file
   */
  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Get full config object
   */
  getAll() {
    return this.config;
  }

  /**
   * Validate config
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.config.gateway?.port) {
      errors.push('gateway.port is required');
    }

    // Port range
    const port = this.config.gateway?.port;
    if (port && (port < 1 || port > 65535)) {
      errors.push('gateway.port must be between 1 and 65535');
    }

    // Token format (if set)
    const token = this.config.gateway?.auth?.token;
    if (token && token.length < 16) {
      errors.push('gateway.auth.token must be at least 16 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopWatching();
    this.removeAllListeners();
  }
}

// Singleton instance
let configInstance = null;

export async function getConfig() {
  if (!configInstance) {
    configInstance = new ConfigLoader();
    await configInstance.init();
  }
  return configInstance;
}

export default ConfigLoader;
