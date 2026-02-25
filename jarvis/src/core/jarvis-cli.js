// JARVIS CLI - OpenClaw-Level Architecture
// Upgraded from basic to Full Features

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Import Core Engines (Phase 4)
import { LLMTaskEngine } from './llm/llm-engine.js';
import { MemoryEngine } from './memory/memory-engine.js';
import { ToolExecutor } from './tool/tool-executor.js';

// ============================================================
// Core: Agent Runner (OpenClaw-style)
// ============================================================

export class AgentRunner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.model = options.model || 'qwen3.5';
    this.maxTokens = options.maxTokens || 4096;
    this.context = [];
    this.maxContextSize = 20;
    this.tools = new Map();
    this.isRunning = false;
  }

  // Register tool
  registerTool(name, handler) {
    this.tools.set(name, handler);
    console.log(`🔧 Tool registered: ${name}`);
  }

  // Execute agent turn
  async *turn(input, options = {}) {
    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Add user message
      this.context.push({ role: 'user', content: input });

      // Build messages
      const messages = this.buildMessages();

      // Call model
      const stream = this.callModel(messages, options);

      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        yield chunk;
      }

      // Add assistant response
      this.context.push({ role: 'assistant', content: fullResponse });

      // Evict old context
      if (this.context.length > this.maxContextSize * 2) {
        this.context = this.context.slice(-this.maxContextSize);
      }

      const duration = Date.now() - startTime;
      this.emit('turn-complete', { input, output: fullResponse, duration });

      return { response: fullResponse, duration };
    } finally {
      this.isRunning = false;
    }
  }

  // Build messages with system prompt
  buildMessages() {
    const systemPrompt = `You are JARVIS, an advanced AI assistant.

Capabilities:
- You have access to tools for web search, file operations, messaging, and more
- You can execute commands and interact with various services
- Always be helpful, concise, and accurate

Available tools: ${Array.from(this.tools.keys()).join(', ')}`;

    return [
      { role: 'system', content: systemPrompt },
      ...this.context.slice(-this.maxContextSize)
    ];
  }

  // Call model (placeholder - connect to Ollama/Claude)
  async *callModel(messages, options) {
    // This would connect to Ollama Cloud, Claude, or local model
    // For now, yield a placeholder response
    yield `[Mock] Processing: ${messages[messages.length - 1].content.substring(0, 50)}...`;
  }

  // Clear context
  clearContext() {
    this.context = [];
    console.log('🗑️ Context cleared');
  }

  // Get status
  getStatus() {
    return {
      isRunning: this.isRunning,
      contextSize: this.context.length,
      toolsCount: this.tools.size,
      model: this.model
    };
  }
}

// ============================================================
// Tools: Tool Framework (OpenClaw-style)
// ============================================================

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.initializeDefaultTools();
  }

  initializeDefaultTools() {
    // Web Search
    this.register('web-search', {
      name: 'web_search',
      description: 'Search the web for information',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      },
      execute: async (params) => {
        // Would call Brave Search API
        return { results: [], query: params.query };
      }
    });

    // Web Fetch
    this.register('web-fetch', {
      name: 'web_fetch',
      description: 'Fetch and extract content from URL',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to fetch' }
        },
        required: ['url']
      },
      execute: async (params) => {
        // Would fetch URL
        return { content: '', url: params.url };
      }
    });

    // Memory
    this.register('memory', {
      name: 'memory',
      description: 'Search or store memories',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['search', 'store', 'clear'] },
          query: { type: 'string' },
          content: { type: 'string' }
        }
      },
      execute: async (params) => {
        // Would interact with memory system
        return { success: true };
      }
    });

    // Exec
    this.register('exec', {
      name: 'exec',
      description: 'Execute shell commands',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string' },
          cwd: { type: 'string' }
        },
        required: ['command']
      },
      execute: async (params) => {
        return new Promise((resolve) => {
          const child = spawn(params.command, [], {
            shell: true,
            cwd: params.cwd || process.cwd()
          });
          
          let stdout = '';
          let stderr = '';
          
          child.stdout.on('data', (data) => stdout += data);
          child.stderr.on('data', (data) => stderr += data);
          
          child.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code });
          });
        });
      }
    });

    // Message
    this.register('message', {
      name: 'message',
      description: 'Send messages via channels',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string' },
          target: { type: 'string' },
          message: { type: 'string' }
        },
        required: ['channel', 'message']
      },
      execute: async (params) => {
        // Would send message via channel
        return { success: true, channel: params.channel };
      }
    });

    // Sessions
    this.register('sessions', {
      name: 'sessions',
      description: 'Manage agent sessions',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'create', 'switch'] },
          sessionKey: { type: 'string' }
        }
      },
      execute: async (params) => {
        return { sessions: [] };
      }
    });

    // Image
    this.register('image', {
      name: 'image',
      description: 'Analyze images',
      parameters: {
        type: 'object',
        properties: {
          image: { type: 'string' },
          prompt: { type: 'string' }
        },
        required: ['image']
      },
      execute: async (params) => {
        return { description: '' };
      }
    });

    // TTS
    this.register('tts', {
      name: 'tts',
      description: 'Text to speech',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          voice: { type: 'string' }
        },
        required: ['text']
      },
      execute: async (params) => {
        return { success: true };
      }
    });

    // ====== ADDITIONAL TOOLS (12 more) ======

    // Weather
    this.register('weather', {
      name: 'weather',
      description: 'Get weather information',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' }
        },
        required: ['location']
      },
      execute: async (params) => {
        // Would call weather API
        return { location: params.location, temp: 20, condition: 'Sunny' };
      }
    });

    // GitHub
    this.register('github', {
      name: 'github',
      description: 'GitHub operations (issues, PRs, repos)',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['issues', 'prs', 'search'] },
          repo: { type: 'string' },
          query: { type: 'string' }
        }
      },
      execute: async (params) => {
        return { action: params.action, results: [] };
      }
    });

    // Notion
    this.register('notion', {
      name: 'notion',
      description: 'Notion database/page operations',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['create', 'read', 'update', 'delete'] },
          databaseId: { type: 'string' },
          content: { type: 'string' }
        }
      },
      execute: async (params) => {
        return { success: true };
      }
    });

    // Summarize
    this.register('summarize', {
      name: 'summarize',
      description: 'Summarize text or URL content',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          url: { type: 'string' },
          maxLength: { type: 'number' }
        }
      },
      execute: async (params) => {
        return { summary: 'Summary of content...' };
      }
    });

    // File Operations
    this.register('file', {
      name: 'file',
      description: 'Read, write, list files',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['read', 'write', 'list', 'delete'] },
          path: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['action', 'path']
      },
      execute: async (params) => {
        return { success: true, path: params.path };
      }
    });

    // Cron/Schedule
    this.register('cron', {
      name: 'cron',
      description: 'Schedule tasks',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['add', 'list', 'remove'] },
          schedule: { type: 'string', description: 'Cron expression' },
          command: { type: 'string' }
        }
      },
      execute: async (params) => {
        return { scheduled: true };
      }
    });

    // Voice Input
    this.register('voice', {
      name: 'voice',
      description: 'Speech to text',
      parameters: {
        type: 'object',
        properties: {
          audio: { type: 'string', description: 'Audio data or file path' }
        }
      },
      execute: async (params) => {
        return { text: 'Transcribed text...' };
      }
    });

    // Code Execution
    this.register('code', {
      name: 'code',
      description: 'Execute code in sandbox',
      parameters: {
        type: 'object',
        properties: {
          language: { type: 'string' },
          code: { type: 'string' }
        },
        required: ['language', 'code']
      },
      execute: async (params) => {
        return { output: '', error: null };
      }
    });

    // Database Query
    this.register('database', {
      name: 'database',
      description: 'Execute database queries',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          connection: { type: 'string' }
        },
        required: ['query']
      },
      execute: async (params) => {
        return { rows: [], columns: [] };
      }
    });

    // API Request
    this.register('api', {
      name: 'api',
      description: 'Make HTTP API requests',
      parameters: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
          url: { type: 'string' },
          headers: { type: 'object' },
          body: { type: 'object' }
        },
        required: ['method', 'url']
      },
      execute: async (params) => {
        return { status: 200, data: {} };
      }
    });

    // Calendar
    this.register('calendar', {
      name: 'calendar',
      description: 'Calendar operations',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'create', 'delete'] },
          title: { type: 'string' },
          date: { type: 'string' },
          time: { type: 'string' }
        }
      },
      execute: async (params) => {
        return { events: [] };
      }
    });

    // URL Shortener
    this.register('shorten', {
      name: 'shorten',
      description: 'Shorten URLs',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string' }
        },
        required: ['url']
      },
      execute: async (params) => {
        return { shortUrl: 'https://jarvis.sh/xxx' };
      }
    });
  }

  register(name, tool) {
    this.tools.set(name, tool);
  }

  get(name) {
    return this.tools.get(name);
  }

  list() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description
    }));
  }

  async execute(name, params) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return await tool.execute(params);
  }
}

// ============================================================
// Memory: NMT (Neural Memory Token) System
// ============================================================

import { NMTMemorySystem } from './nmt-memory.js';

export { NeuralMemoryToken } from './nmt-memory.js';

// ============================================================
// Sessions: Session Manager (OpenClaw-style)
// ============================================================

export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.currentSession = null;
  }

  create(key, options = {}) {
    const session = {
      key,
      createdAt: Date.now(),
      lastActive: Date.now(),
      context: [],
      metadata: options.metadata || {},
      agent: options.agent || 'default'
    };
    
    this.sessions.set(key, session);
    this.currentSession = key;
    
    return session;
  }

  get(key) {
    return this.sessions.get(key);
  }

  switch(key) {
    if (this.sessions.has(key)) {
      this.currentSession = key;
      return true;
    }
    return false;
  }

  list() {
    return Array.from(this.sessions.values()).map(s => ({
      key: s.key,
      createdAt: s.createdAt,
      lastActive: s.lastActive,
      messageCount: s.context.length
    }));
  }

  delete(key) {
    this.sessions.delete(key);
  }

  getCurrent() {
    return this.currentSession ? this.sessions.get(this.currentSession) : null;
  }
}

// ============================================================
// Config: Configuration Manager (OpenClaw-style)
// ============================================================

export class ConfigManager {
  constructor(options = {}) {
    this.configDir = options.configDir || './config';
    this.config = {};
    this.load();
  }

  load() {
    // Load main config
    const configFile = join(this.configDir, 'jarvis.json');
    if (existsSync(configFile)) {
      try {
        this.config = JSON.parse(readFileSync(configFile, 'utf-8'));
      } catch (e) {
        this.config = {};
      }
    }
  }

  save() {
    const configFile = join(this.configDir, 'jarvis.json');
    writeFileSync(configFile, JSON.stringify(this.config, null, 2));
  }

  get(key, defaultValue = null) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.config) ?? defaultValue;
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    
    obj[keys[keys.length - 1]] = value;
    this.save();
  }

  getAll() {
    return { ...this.config };
  }
}

// ============================================================
// Gateway: WebSocket Server (OpenClaw-style)
// ============================================================

export class Gateway {
  constructor(options = {}) {
    this.port = options.port || 18789;
    this.clients = new Map();
    this.server = null;
  }

  async start() {
    // This would start a WebSocket server
    // For now, placeholder
    console.log(`🌐 Gateway starting on port ${this.port}...`);
    // Would use 'ws' library for actual implementation
    return true;
  }

  async stop() {
    console.log('🌐 Gateway stopping...');
  }

  broadcast(message) {
    for (const [id, client] of this.clients) {
      // Would send to all clients
    }
  }

  getClientCount() {
    return this.clients.size;
  }

  getStatus() {
    return {
      port: this.port,
      clients: this.clients.size,
      running: this.server !== null
    };
  }
}

// ============================================================
// JARVIS Main: OpenClaw-Level CLI
// ============================================================

export class JarvisCLI extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Core systems - Using Phase 4 upgraded engines
    this.agent = new AgentRunner(options.agent);
    this.llm = new LLMTaskEngine(options.llm);  // NEW: LLM Engine
    this.tools = new ToolExecutor(options.tools);  // NEW: Tool Executor
    this.memory = new MemoryEngine(options.memory);  // NEW: Memory Engine
    this.sessions = new SessionManager();
    this.config = new ConfigManager(options.config);
    this.gateway = new Gateway(options.gateway);
    
    // State
    this.isRunning = false;
    this.startTime = null;
    
    // Initialize
    this.initialize();
  }

  initialize() {
    // Register default session
    this.sessions.create('main', { metadata: { type: 'interactive' } });
    
    // Register default tools with ToolExecutor
    this.registerDefaultTools();
    
    // Register tools with agent
    const toolList = this.tools.listTools();
    for (const tool of toolList) {
      this.agent.registerTool(tool.name, (params) => this.tools.execute(tool.name, params));
    }
    
    console.log('🤖 JARVIS initialized (Phase 5)');
    console.log('   - LLM Engine:', this.llm.getProviders().join(', '));
    console.log('   - Memory Engine: Ready');
    console.log('   - Tools:', this.tools.getStats().availableTools);
  }

  registerDefaultTools() {
    // Web Search
    this.tools.register({
      name: 'web-search',
      description: 'Search the web',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      handler: async (params) => ({ query: params.query, results: [] })
    });

    // Memory Store
    this.tools.register({
      name: 'memory-store',
      description: 'Store to memory',
      parameters: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] },
      handler: async (params) => {
        const id = await this.memory.storeDocument(params.content, { source: 'tool' });
        return { stored: id };
      }
    });

    // Memory Search
    this.tools.register({
      name: 'memory-search',
      description: 'Search memory',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      handler: async (params) => {
        const results = await this.memory.search(params.query);
        return { results };
      }
    });

    // Exec
    this.tools.register({
      name: 'exec',
      description: 'Execute shell command',
      parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] },
      handler: async (params) => {
        const { execSync } = await import('child_process');
        try {
          const output = execSync(params.command, { encoding: 'utf-8', timeout: 10000 });
          return { output };
        } catch (e) {
          return { error: e.message };
        }
      }
    });

    // Weather
    this.tools.register({
      name: 'weather',
      description: 'Get weather',
      parameters: { type: 'object', properties: { location: { type: 'string' } }, required: ['location'] },
      handler: async (params) => ({ location: params.location, temp: 20, condition: 'Sunny' })
    });
  }

  async start() {
    console.log('🚀 Starting JARVIS...');
    
    // Start gateway
    await this.gateway.start();
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    console.log('✅ JARVIS ready!');
    return this;
  }

  async stop() {
    console.log('🛑 Stopping JARVIS...');
    
    await this.gateway.stop();
    
    this.isRunning = false;
    console.log('✅ JARVIS stopped');
  }

  // Interactive chat
  async chat(input) {
    const session = this.sessions.getCurrent();
    if (session) {
      session.context.push({ role: 'user', content: input });
    }
    
    const result = await this.agent.turn(input);
    
    if (session) {
      session.context.push({ role: 'assistant', content: result.response });
      session.lastActive = Date.now();
    }
    
    return result;
  }

  // Execute command
  async execute(command) {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1).join(' ');
    
    switch (cmd) {
      case 'status':
        return this.getStatus();
      
      case 'clear':
        this.agent.clearContext();
        return { message: 'Context cleared' };
      
      case 'memory':
        if (args.startsWith('search ')) {
          return await this.memory.search(args.replace('search ', ''));
        }
        return this.memory.getStats();
      
      case 'sessions':
        return this.sessions.list();
      
      case 'tools':
        return this.tools.list();
      
      case 'config':
        if (args.startsWith('get ')) {
          return this.config.get(args.replace('get ', ''));
        }
        return this.config.getAll();
      
      case 'exit':
      case 'quit':
        await this.stop();
        process.exit(0);
      
      default:
        return { error: `Unknown command: ${cmd}` };
    }
  }

  // Get full status
  getStatus() {
    return {
      running: this.isRunning,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      agent: this.agent.getStatus(),
      memory: this.memory.getStats(),
      sessions: this.sessions.list(),
      tools: this.tools.listTools().length,
      gateway: this.gateway.getStatus()
    };
  }
}

export default JarvisCLI;
