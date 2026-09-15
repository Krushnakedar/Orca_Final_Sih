/**
 * High-performance in-memory sliding window rate limiter
 * Protects against brute-force, DoS, and costly LLM/DAG credit depletion.
 */

class MemoryRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000;
    this.max = options.max || 100;
    this.message = options.message || 'Too many requests from this IP, please try again later.';
    this.hits = new Map();

    // Periodically prune expired entries every 3 minutes
    setInterval(() => this.prune(), 3 * 60 * 1000).unref();
  }

  prune() {
    const now = Date.now();
    for (const [key, record] of this.hits.entries()) {
      if (now - record.resetTime > this.windowMs) {
        this.hits.delete(key);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      // Disable or bypass during automated test runs
      if (process.env.NODE_ENV === 'test') {
        return next();
      }

      const clientIp =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const now = Date.now();
      let record = this.hits.get(clientIp);

      if (!record || now - record.resetTime > this.windowMs) {
        record = { count: 1, resetTime: now };
        this.hits.set(clientIp, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.max - record.count);
      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', remaining);

      if (record.count > this.max) {
        const retryAfterSec = Math.ceil((record.resetTime + this.windowMs - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: this.message,
          retryAfter: retryAfterSec
        });
      }

      next();
    };
  }
}

// 1. General API rate limiter (300 requests / minute)
const apiLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'API rate limit exceeded. Please throttle your requests.'
}).middleware();

// 2. High-cost Agent & AI Chat limiter (60 requests / minute)
const aiLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'AI agent request quota reached for this minute. Please wait before asking more queries.'
}).middleware();

// 3. Sensitive Auth Limiter (50 requests / 15 minutes)
const authLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts. For security reasons, please try again in 15 minutes.'
}).middleware();

module.exports = {
  apiLimiter,
  aiLimiter,
  authLimiter,
  MemoryRateLimiter
};
