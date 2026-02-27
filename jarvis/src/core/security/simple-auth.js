// JARVIS Simple Auth
// OpenClaw-style Bearer Token authentication for single-operator use

import crypto from 'crypto';

export class SimpleAuth {
  constructor(options = {}) {
    this.token = options.token || null;
    this.allowLocal = options.allowLocal !== false;  // Default: true
    this.allowTailscale = options.allowTailscale || false;
  }

  /**
   * Generate a new random token
   */
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Check if request is from localhost
   */
  isLocalRequest(req) {
    const ip = this.getClientIP(req);
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
  }

  /**
   * Get client IP from request
   */
  getClientIP(req) {
    // Check forwarded headers (for reverse proxy)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    // Direct connection
    return req.socket?.remoteAddress || req.ip || 'unknown';
  }

  /**
   * Verify Bearer token from Authorization header
   */
  verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);

    // No token configured = no auth required
    if (!this.token) {
      return true;
    }

    // Timing-safe comparison
    if (token.length !== this.token.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(this.token)
    );
  }

  /**
   * Check Tailscale identity headers (future feature)
   */
  verifyTailscale(req) {
    if (!this.allowTailscale) return false;

    // Tailscale Serve sets these headers
    const tailscaleUser = req.headers['tailscale-user-login'];
    const tailscaleNode = req.headers['tailscale-user-name'];

    return !!(tailscaleUser || tailscaleNode);
  }

  /**
   * Express middleware for authentication
   */
  middleware(options = {}) {
    const { exclude = ['/health'] } = options;

    return (req, res, next) => {
      // Skip excluded paths
      if (exclude.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Allow local requests if configured
      if (this.allowLocal && this.isLocalRequest(req)) {
        req.authMethod = 'local';
        return next();
      }

      // Check Tailscale (if enabled)
      if (this.verifyTailscale(req)) {
        req.authMethod = 'tailscale';
        req.tailscaleUser = req.headers['tailscale-user-login'];
        return next();
      }

      // Check Bearer token
      const authHeader = req.headers.authorization;
      if (this.verifyToken(authHeader)) {
        req.authMethod = 'token';
        return next();
      }

      // Auth required but not provided
      if (!this.token && !this.allowLocal) {
        // No auth configured and local not allowed - deny
        return res.status(500).json({
          error: 'Authentication not configured',
          hint: 'Set gateway.auth.token in ~/.jarvis/jarvis.json'
        });
      }

      return res.status(401).json({
        error: 'Authentication required',
        methods: this.getAvailableMethods()
      });
    };
  }

  /**
   * Get available auth methods
   */
  getAvailableMethods() {
    const methods = [];
    if (this.token) methods.push('bearer');
    if (this.allowLocal) methods.push('local');
    if (this.allowTailscale) methods.push('tailscale');
    return methods;
  }

  /**
   * WebSocket authentication
   */
  authenticateWebSocket(data, clientInfo) {
    // Local connection
    if (this.allowLocal && this.isLocalClient(clientInfo)) {
      return { success: true, method: 'local' };
    }

    // Token authentication
    if (data.token && this.verifyTokenDirect(data.token)) {
      return { success: true, method: 'token' };
    }

    // No token required
    if (!this.token) {
      return { success: true, method: 'none' };
    }

    return { success: false, error: 'Invalid token' };
  }

  /**
   * Check if WebSocket client is local
   */
  isLocalClient(clientInfo) {
    const ip = clientInfo.ip || '';
    return ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1');
  }

  /**
   * Direct token verification (for WebSocket)
   */
  verifyTokenDirect(token) {
    if (!this.token) return true;
    if (!token || token.length !== this.token.length) return false;

    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(this.token)
    );
  }

  /**
   * Get auth status
   */
  getStatus() {
    return {
      tokenConfigured: !!this.token,
      allowLocal: this.allowLocal,
      allowTailscale: this.allowTailscale,
      methods: this.getAvailableMethods()
    };
  }

  /**
   * Update token
   */
  setToken(newToken) {
    this.token = newToken;
  }

  /**
   * Update settings
   */
  updateSettings(settings) {
    if (settings.token !== undefined) this.token = settings.token;
    if (settings.allowLocal !== undefined) this.allowLocal = settings.allowLocal;
    if (settings.allowTailscale !== undefined) this.allowTailscale = settings.allowTailscale;
  }
}

export default SimpleAuth;
