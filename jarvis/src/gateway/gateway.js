// JARVIS Gateway - REST API + WebSocket
// OpenClaw-style: Simple Bearer Token auth, config file based

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SimpleAuth } from '../core/security/simple-auth.js';
import { RateLimiter } from '../core/security/rate-limiter.js';
import { ConfigLoader } from '../core/config/config-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = join(__dirname, '..', '..');  // jarvis/ package root

export class Gateway {
  constructor(options = {}) {
    // Config can be passed directly or loaded from file
    this.configLoader = options.configLoader || null;
    this.config = options.config || {};

    this.port = options.port || this.config.gateway?.port || 18789;
    this.host = options.host || this.config.gateway?.bind || '127.0.0.1';

    // Simple auth (Bearer Token)
    const authConfig = this.config.gateway?.auth || {};
    this.auth = new SimpleAuth({
      token: authConfig.token || options.token,
      allowLocal: authConfig.allowLocal !== false,
      allowTailscale: authConfig.allowTailscale || false
    });

    // Rate limiter
    const rateLimitConfig = this.config.rateLimit || {};
    this.rateLimiter = new RateLimiter({
      windowMs: rateLimitConfig.windowMs || 60000,
      maxRequests: rateLimitConfig.maxRequests || 100
    });

    this.app = express();
    this.server = null;
    this.wss = null;
    this.clients = new Map();
    this.jarvis = null;

    this.setupMiddleware();
    this.setupRoutes();

    // Hot reload config
    if (this.configLoader) {
      this.configLoader.on('reloaded', ({ newConfig }) => {
        this.handleConfigReload(newConfig);
      });
    }
  }

  /**
   * Create gateway with config file
   */
  static async create(options = {}) {
    const configLoader = new ConfigLoader();
    const config = await configLoader.init();
    configLoader.startWatching();

    return new Gateway({
      ...options,
      configLoader,
      config
    });
  }

  setJarvis(jarvisInstance) {
    this.jarvis = jarvisInstance;
  }

  handleConfigReload(newConfig) {
    console.log('🔄 Applying config changes...');

    // Update auth settings
    if (newConfig.gateway?.auth) {
      this.auth.updateSettings(newConfig.gateway.auth);
    }

    // Update rate limiter
    if (newConfig.rateLimit) {
      // Rate limiter doesn't support hot reload, log warning
      console.log('⚠️ Rate limit changes require restart');
    }

    this.config = newConfig;
  }

  setupMiddleware() {
    // JSON parsing
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        const level = this.config.logging?.level || 'info';
        if (level === 'debug' || res.statusCode >= 400) {
          console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
        }
      });
      next();
    });

    // CORS (allow all for local, restrict for remote)
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');

      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
      next();
    });

    // Rate limiting (except health check)
    this.app.use((req, res, next) => {
      if (req.path === '/health') return next();
      return this.rateLimiter.middleware()(req, res, next);
    });

    // Simple Auth (Bearer Token)
    this.app.use(this.auth.middleware({
      exclude: ['/health', '/api/auth', '/manifest.json', '/sw.js', '/js/', '/css/', '/images/']
    }));
  }

  setupRoutes() {
    // Health check (public)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime(),
        version: '2.0.0'
      });
    });

    // Auth status (get token info)
    this.app.get('/api/auth', (req, res) => {
      res.json({
        authenticated: true,
        method: req.authMethod || 'unknown',
        ...this.auth.getStatus()
      });
    });

    // Token verification (for clients to check if token is valid)
    this.app.post('/api/auth', (req, res) => {
      const { token } = req.body;

      // If no token configured, always succeed
      if (!this.auth.token) {
        return res.json({ success: true, message: 'No auth required' });
      }

      // Verify provided token
      if (token && this.auth.verifyTokenDirect(token)) {
        return res.json({ success: true });
      }

      res.status(401).json({ error: 'Invalid token' });
    });

    // Status
    this.app.get('/api/status', (req, res) => {
      if (this.jarvis) {
        const status = this.jarvis.getStatus ? this.jarvis.getStatus() : {};
        res.json({
          ...status,
          gateway: this.getStatus()
        });
      } else {
        res.json({ status: 'initializing', gateway: this.getStatus() });
      }
    });

    // Clear context
    this.app.post('/api/clear', (req, res) => {
      if (this.jarvis?.clearContext) {
        this.jarvis.clearContext();
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Not available' });
      }
    });

    // Chat
    this.app.post('/api/chat', async (req, res) => {
      const { message, session } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message required' });
      }

      try {
        if (this.jarvis) {
          const result = this.jarvis.process
            ? await this.jarvis.process(message)
            : await this.jarvis.chat(message);
          res.json(result);
        } else {
          res.json({ response: 'JARVIS not ready', session });
        }
      } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Memory search
    this.app.get('/api/memory/search', async (req, res) => {
      const { q, limit = 10 } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Query required' });
      }

      try {
        if (this.jarvis?.memory) {
          const results = await this.jarvis.memory.search(q, { limit: parseInt(limit) });
          res.json({ results });
        } else {
          res.json({ results: [] });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Memory store
    this.app.post('/api/memory', async (req, res) => {
      const { content, metadata } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content required' });
      }

      try {
        if (this.jarvis?.memory) {
          const id = await this.jarvis.memory.storeDocument(content, metadata);
          res.json({ id, success: true });
        } else {
          res.status(500).json({ error: 'Memory not available' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Tools
    this.app.get('/api/tools', (req, res) => {
      if (this.jarvis?.tools) {
        res.json({ tools: this.jarvis.tools.listTools ? this.jarvis.tools.listTools() : [] });
      } else {
        res.json({ tools: [] });
      }
    });

    this.app.post('/api/tools/execute', async (req, res) => {
      const { tool, params } = req.body;

      if (!tool) {
        return res.status(400).json({ error: 'Tool name required' });
      }

      try {
        if (this.jarvis?.tools) {
          const result = await this.jarvis.tools.execute(tool, params || {});
          res.json({ result });
        } else {
          res.status(500).json({ error: 'Tools not available' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Config (read-only, no sensitive data)
    this.app.get('/api/config', (req, res) => {
      const safeConfig = { ...this.config };

      // Remove sensitive fields
      if (safeConfig.gateway?.auth) {
        safeConfig.gateway.auth = {
          ...safeConfig.gateway.auth,
          token: safeConfig.gateway.auth.token ? '[configured]' : null
        };
      }

      res.json(safeConfig);
    });

    // ============================================================
    // IDE Integration Endpoints
    // ============================================================

    // IDE: Code completion
    this.app.post('/api/ide/completion', async (req, res) => {
      const { uri, position, prefix, context } = req.body;

      try {
        if (this.jarvis) {
          const prompt = `Complete this code. Return ONLY the completion, no explanation.
Context: ${context?.slice(-500) || ''}
Prefix: ${prefix}`;

          const result = await this.jarvis.process(prompt);
          const completions = [{
            label: result.response?.trim().split('\n')[0] || '',
            insertText: result.response?.trim() || '',
            kind: 'snippet'
          }];

          res.json({ completions });
        } else {
          res.json({ completions: [] });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // IDE: Explain code
    this.app.post('/api/ide/explain', async (req, res) => {
      const { code, language, selection } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      try {
        if (this.jarvis) {
          const prompt = `Explain this ${language || ''} code concisely:
\`\`\`${language || ''}
${code.substring(0, 2000)}
\`\`\``;

          const result = await this.jarvis.process(prompt);
          res.json({
            explanation: result.response,
            language,
            codeLength: code.length
          });
        } else {
          res.json({ explanation: 'JARVIS not ready' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // IDE: Fix errors
    this.app.post('/api/ide/fix', async (req, res) => {
      const { code, diagnostics, language } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      try {
        if (this.jarvis) {
          const errorsText = diagnostics?.map(d => `Line ${d.line}: ${d.message}`).join('\n') || 'Fix any issues';

          const prompt = `Fix these errors in the ${language || ''} code:
Errors:
${errorsText}

Code:
\`\`\`${language || ''}
${code.substring(0, 3000)}
\`\`\`

Return ONLY the fixed code, no explanation.`;

          const result = await this.jarvis.process(prompt);

          // Extract code from response
          let fixedCode = result.response;
          const codeMatch = fixedCode.match(/```[\w]*\n([\s\S]*?)```/);
          if (codeMatch) {
            fixedCode = codeMatch[1];
          }

          res.json({
            fixedCode: fixedCode.trim(),
            original: code,
            changes: diagnostics?.length || 0
          });
        } else {
          res.json({ fixedCode: code, message: 'JARVIS not ready' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // IDE: Refactor code
    this.app.post('/api/ide/refactor', async (req, res) => {
      const { code, type, target, language } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const refactorTypes = {
        'rename': 'Rename the variable/function',
        'extract-function': 'Extract the selection into a new function',
        'inline': 'Inline this variable/function',
        'simplify': 'Simplify this code'
      };

      const instruction = refactorTypes[type] || type || 'Improve this code';

      try {
        if (this.jarvis) {
          const prompt = `${instruction}${target ? ` (target: ${target})` : ''}:

\`\`\`${language || ''}
${code.substring(0, 3000)}
\`\`\`

Return ONLY the refactored code.`;

          const result = await this.jarvis.process(prompt);

          let refactoredCode = result.response;
          const codeMatch = refactoredCode.match(/```[\w]*\n([\s\S]*?)```/);
          if (codeMatch) {
            refactoredCode = codeMatch[1];
          }

          res.json({
            refactoredCode: refactoredCode.trim(),
            original: code,
            type
          });
        } else {
          res.json({ refactoredCode: code, message: 'JARVIS not ready' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // IDE: Hover info (quick documentation)
    this.app.post('/api/ide/hover', async (req, res) => {
      const { word, context, language } = req.body;

      if (!word) {
        return res.status(400).json({ error: 'Word is required' });
      }

      try {
        if (this.jarvis) {
          const prompt = `Briefly explain "${word}" in ${language || 'code'} context. Max 2 sentences.${context ? `\nContext: ${context.substring(0, 200)}` : ''}`;

          const result = await this.jarvis.process(prompt);
          res.json({
            markdown: result.response,
            word
          });
        } else {
          res.json({ markdown: '', word });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Static files (PWA) - use package root, not process.cwd()
    const pwaDir = join(PKG_ROOT, 'pwa');
    this.app.use(express.static(pwaDir));

    // Fallback for SPA
    this.app.get('*', (req, res) => {
      if (req.accepts('html')) {
        res.sendFile(join(pwaDir, 'index.html'));
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = createServer(this.app);

      // WebSocket server
      this.wss = new WebSocketServer({ server: this.server });

      this.wss.on('connection', (ws, req) => {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

        const clientInfo = {
          ws,
          authenticated: false,
          ip: clientIp,
          connectedAt: Date.now()
        };

        // Auto-auth for local connections
        if (this.auth.allowLocal && this.auth.isLocalClient(clientInfo)) {
          clientInfo.authenticated = true;
          clientInfo.authMethod = 'local';
        }

        // Auto-auth if no token configured
        if (!this.auth.token) {
          clientInfo.authenticated = true;
          clientInfo.authMethod = 'none';
        }

        this.clients.set(clientId, clientInfo);
        console.log(`🔌 WebSocket connected: ${clientId} (${clientIp})`);

        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString());
            await this.handleWebSocketMessage(clientId, message);
          } catch (e) {
            ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
          }
        });

        ws.on('close', () => {
          this.clients.delete(clientId);
          console.log(`🔌 WebSocket disconnected: ${clientId}`);
        });

        ws.on('error', (error) => {
          console.error(`WebSocket error for ${clientId}:`, error.message);
        });

        // Send welcome
        ws.send(JSON.stringify({
          type: 'connected',
          clientId,
          authenticated: clientInfo.authenticated,
          authRequired: !!this.auth.token && !clientInfo.authenticated
        }));
      });

      this.server.listen(this.port, this.host, () => {
        const authStatus = this.auth.getStatus();
        console.log(`🌐 Gateway: http://${this.host}:${this.port}`);
        console.log(`📡 WebSocket: ws://${this.host}:${this.port}`);
        console.log(`🔒 Auth: ${authStatus.tokenConfigured ? 'token' : 'none'} (local: ${authStatus.allowLocal})`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  async handleWebSocketMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { type, data = {} } = message;

    switch (type) {
      case 'auth':
        const authResult = this.auth.authenticateWebSocket(data, client);
        client.authenticated = authResult.success;
        client.authMethod = authResult.method;
        client.ws.send(JSON.stringify({
          type: 'auth',
          success: authResult.success,
          method: authResult.method,
          error: authResult.error
        }));
        break;

      case 'chat':
        if (!client.authenticated) {
          client.ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated' }));
          return;
        }

        if (this.jarvis && data.message) {
          try {
            const result = this.jarvis.process
              ? await this.jarvis.process(data.message)
              : await this.jarvis.chat(data.message);
            client.ws.send(JSON.stringify({
              type: 'chat',
              response: result.response || result,
              agent: result.agent,
              duration: result.duration
            }));
          } catch (error) {
            client.ws.send(JSON.stringify({ type: 'error', error: error.message }));
          }
        }
        break;

      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      case 'status':
        if (this.jarvis) {
          const status = this.jarvis.getStatus ? this.jarvis.getStatus() : {};
          client.ws.send(JSON.stringify({ type: 'status', data: status }));
        }
        break;

      default:
        client.ws.send(JSON.stringify({ type: 'error', error: `Unknown message type: ${type}` }));
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    for (const [id, client] of this.clients) {
      if (client.ws.readyState === 1 && client.authenticated) {
        client.ws.send(data);
      }
    }
  }

  async stop() {
    // Close WebSocket connections
    for (const [id, client] of this.clients) {
      client.ws.close(1000, 'Server shutting down');
    }
    this.clients.clear();

    // Cleanup
    this.rateLimiter.destroy();
    if (this.configLoader) {
      this.configLoader.destroy();
    }

    // Close HTTP server
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('🌐 Gateway stopped');
          resolve();
        });
      });
    }
  }

  getStatus() {
    return {
      port: this.port,
      host: this.host,
      running: this.server !== null,
      clients: this.clients.size,
      authenticated: Array.from(this.clients.values()).filter(c => c.authenticated).length,
      auth: this.auth.getStatus(),
      rateLimiter: this.rateLimiter.getStats()
    };
  }
}

export default Gateway;
