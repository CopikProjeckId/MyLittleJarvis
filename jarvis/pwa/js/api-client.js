// JARVIS API Client
// Handles REST API and WebSocket connections to the gateway

class JarvisAPIClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || window.location.origin;
    this.wsUrl = this.baseUrl.replace(/^http/, 'ws');
    this.token = localStorage.getItem('jarvis_token');
    this.ws = null;
    this.wsReconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventListeners = new Map();
    this.connected = false;
  }

  // ============================================================
  // Authentication
  // ============================================================

  async authenticate(password) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.token) {
        this.token = data.token;
        localStorage.setItem('jarvis_token', data.token);
        return { success: true, token: data.token };
      }

      return { success: false, error: data.error || 'Authentication failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('jarvis_token');
    this.disconnectWebSocket();
  }

  isAuthenticated() {
    return !!this.token;
  }

  // ============================================================
  // REST API Methods
  // ============================================================

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // Health check
  async health() {
    return await this.request('/health', { method: 'GET' });
  }

  // Get system status
  async getStatus() {
    return await this.request('/api/status', { method: 'GET' });
  }

  // Chat message
  async chat(message, options = {}) {
    return await this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, ...options })
    });
  }

  // Memory search
  async searchMemory(query, limit = 10) {
    return await this.request(`/api/memory/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET'
    });
  }

  // Store memory
  async storeMemory(content, metadata = {}) {
    return await this.request('/api/memory', {
      method: 'POST',
      body: JSON.stringify({ content, metadata })
    });
  }

  // List tools
  async getTools() {
    return await this.request('/api/tools', { method: 'GET' });
  }

  // Execute tool
  async executeTool(tool, params = {}) {
    return await this.request('/api/tools/execute', {
      method: 'POST',
      body: JSON.stringify({ tool, params })
    });
  }

  // Get config
  async getConfig() {
    return await this.request('/api/config', { method: 'GET' });
  }

  // Update config
  async setConfig(key, value) {
    return await this.request('/api/config', {
      method: 'POST',
      body: JSON.stringify({ key, value })
    });
  }

  // ============================================================
  // WebSocket Connection
  // ============================================================

  connectWebSocket(onMessage, onStatusChange) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      this.connected = true;
      this.wsReconnectAttempts = 0;

      // Authenticate if token exists
      if (this.token) {
        this.ws.send(JSON.stringify({
          type: 'auth',
          data: { token: this.token }
        }));
      }

      if (onStatusChange) onStatusChange('connected');
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle auth response
        if (data.type === 'auth') {
          if (data.success) {
            console.log('🔑 WebSocket authenticated');
            this.emit('authenticated');
          } else {
            console.warn('🔑 WebSocket auth failed');
            this.emit('auth_failed');
          }
          return;
        }

        // Handle chat response
        if (data.type === 'chat') {
          this.emit('chat', data.response);
        }

        // Handle pong
        if (data.type === 'pong') {
          this.emit('pong', data.timestamp);
        }

        // Call generic message handler
        if (onMessage) onMessage(data);
        this.emit('message', data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code);
      this.connected = false;

      if (onStatusChange) onStatusChange('disconnected');
      this.emit('disconnected');

      // Auto-reconnect
      if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
        this.wsReconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.wsReconnectAttempts - 1);
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.wsReconnectAttempts})`);

        setTimeout(() => {
          this.connectWebSocket(onMessage, onStatusChange);
        }, delay);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    return this.ws;
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  sendWebSocket(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
      return true;
    }
    return false;
  }

  // WebSocket chat
  wsChat(message) {
    return this.sendWebSocket('chat', { message });
  }

  // WebSocket ping
  wsPing() {
    return this.sendWebSocket('ping');
  }

  // ============================================================
  // Event Emitter
  // ============================================================

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // ============================================================
  // Utilities
  // ============================================================

  isConnected() {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create global instance
window.JarvisAPI = new JarvisAPIClient();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JarvisAPIClient;
}
