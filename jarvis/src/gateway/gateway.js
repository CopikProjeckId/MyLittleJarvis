// JARVIS Gateway - REST API + WebSocket
// Phase 3: Gateway Enhancement

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class Gateway {
  constructor(options = {}) {
    this.port = options.port || 18789;
    this.host = options.host || '127.0.0.1';
    this.password = options.password || process.env.JARVIS_GATEWAY_PASSWORD;
    
    this.app = express();
    this.server = null;
    this.wss = null;
    this.clients = new Map();
    
    this.jarvis = null;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setJarvis(jarvisInstance) {
    this.jarvis = jarvisInstance;
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Auth middleware
    this.app.use((req, res, next) => {
      if (this.password && req.path !== '/health') {
        const auth = req.headers.authorization;
        if (auth !== this.password) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }
      next();
    });
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: Date.now(),
        uptime: process.uptime()
      });
    });

    // Status
    this.app.get('/api/status', (req, res) => {
      if (this.jarvis) {
        res.json(this.jarvis.getStatus());
      } else {
        res.json({ status: 'initializing' });
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
          const result = await this.jarvis.chat(message);
          res.json(result);
        } else {
          res.json({ response: 'JARVIS not ready', session });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Memory
    this.app.get('/api/memory/search', async (req, res) => {
      const { q, limit } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Query required' });
      }

      try {
        if (this.jarvis?.memory) {
          const results = await this.jarvis.memory.search(q, limit || 10);
          res.json({ results });
        } else {
          res.json({ results: [] });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/memory', async (req, res) => {
      const { content, metadata } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content required' });
      }

      try {
        if (this.jarvis?.memory) {
          const id = await this.jarvis.memory.store(content, metadata);
          res.json({ id, success: true });
        } else {
          res.status(500).json({ error: 'Memory not available' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Sessions
    this.app.get('/api/sessions', (req, res) => {
      if (this.jarvis?.sessions) {
        res.json({ sessions: this.jarvis.sessions.list() });
      } else {
        res.json({ sessions: [] });
      }
    });

    this.app.post('/api/sessions', (req, res) => {
      const { key, metadata } = req.body;
      
      if (!key) {
        return res.status(400).json({ error: 'Session key required' });
      }

      if (this.jarvis?.sessions) {
        const session = this.jarvis.sessions.create(key, { metadata });
        res.json({ session });
      } else {
        res.status(500).json({ error: 'Session manager not available' });
      }
    });

    // Tools
    this.app.get('/api/tools', (req, res) => {
      if (this.jarvis?.tools) {
        res.json({ tools: this.jarvis.tools.list() });
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

    // Config
    this.app.get('/api/config', (req, res) => {
      if (this.jarvis?.config) {
        res.json(this.jarvis.config.getAll());
      } else {
        res.json({});
      }
    });

    this.app.post('/api/config', (req, res) => {
      const { key, value } = req.body;
      
      if (this.jarvis?.config) {
        this.jarvis.config.set(key, value);
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Config not available' });
      }
    });

    // Static files (PWA)
    this.app.use(express.static(join(process.cwd(), 'pwa')));
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = createServer(this.app);
      
      // WebSocket server
      this.wss = new WebSocketServer({ server: this.server });
      
      this.wss.on('connection', (ws, req) => {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.clients.set(clientId, { ws, authenticated: false });
        
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleWebSocketMessage(clientId, message);
          } catch (e) {
            ws.send(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        
        ws.on('close', () => {
          this.clients.delete(clientId);
        });
        
        // Send welcome
        ws.send(JSON.stringify({ 
          type: 'connected', 
          clientId,
          message: 'JARVIS Gateway connected'
        }));
      });
      
      this.server.listen(this.port, this.host, () => {
        console.log(`🌐 Gateway started: http://${this.host}:${this.port}`);
        console.log(`📡 WebSocket: ws://${this.host}:${this.port}`);
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }

  async handleWebSocketMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { type, data } = message;
    
    switch (type) {
      case 'auth':
        if (data.password === this.password) {
          client.authenticated = true;
          client.ws.send(JSON.stringify({ type: 'auth', success: true }));
        } else {
          client.ws.send(JSON.stringify({ type: 'auth', success: false }));
        }
        break;
        
      case 'chat':
        if (this.jarvis && client.authenticated) {
          const result = await this.jarvis.chat(data.message);
          client.ws.send(JSON.stringify({ type: 'chat', response: result.response }));
        }
        break;
        
      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    for (const [id, client] of this.clients) {
      if (client.ws.readyState === 1) {
        client.ws.send(data);
      }
    }
  }

  async stop() {
    // Close WebSocket connections
    for (const [id, client] of this.clients) {
      client.ws.close();
    }
    this.clients.clear();
    
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
      websocket: this.wss !== null
    };
  }
}

export default Gateway;
