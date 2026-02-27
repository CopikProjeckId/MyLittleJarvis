// JARVIS Rate Limiter
// Sliding window rate limiting with IP-based tracking

export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // 1 minute
    this.maxRequests = options.maxRequests || 100;
    this.message = options.message || 'Too many requests, please try again later';
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;

    // Store request counts
    this.requests = new Map();

    // Cleanup old entries periodically
    this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs);
  }

  /**
   * Default key generator - use IP address
   */
  defaultKeyGenerator(req) {
    return req.ip ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           'unknown';
  }

  /**
   * Check if request should be allowed
   */
  check(key) {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record) {
      // First request from this key
      this.requests.set(key, {
        count: 1,
        windowStart: now,
        timestamps: [now]
      });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
    }

    // Remove timestamps outside the window
    record.timestamps = record.timestamps.filter(ts => ts > now - this.windowMs);
    record.count = record.timestamps.length;

    if (record.count >= this.maxRequests) {
      // Rate limited
      const oldestTimestamp = Math.min(...record.timestamps);
      const resetAt = oldestTimestamp + this.windowMs;
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt - now) / 1000)
      };
    }

    // Allow request
    record.timestamps.push(now);
    record.count++;

    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetAt: record.timestamps[0] + this.windowMs
    };
  }

  /**
   * Express middleware
   */
  middleware() {
    return (req, res, next) => {
      const key = this.keyGenerator(req);
      const result = this.check(key);

      // Set rate limit headers
      res.set('X-RateLimit-Limit', this.maxRequests);
      res.set('X-RateLimit-Remaining', result.remaining);
      res.set('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

      if (!result.allowed) {
        res.set('Retry-After', result.retryAfter);
        return res.status(429).json({
          error: this.message,
          retryAfter: result.retryAfter
        });
      }

      next();
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    for (const [key, record] of this.requests) {
      record.timestamps = record.timestamps.filter(ts => ts > cutoff);
      if (record.timestamps.length === 0) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Reset limits for a key
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      trackedKeys: this.requests.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests
    };
  }

  /**
   * Stop cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export default RateLimiter;
