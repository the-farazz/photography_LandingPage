class RateLimiter {
  constructor() {
    this.hits = new Map(); // key -> Array of timestamps

    // Periodically clean up expired entries every 5 minutes to keep memory usage light
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.hits.entries()) {
      const valid = timestamps.filter((t) => now - t < 15 * 60 * 1000);
      if (valid.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, valid);
      }
    }
  }

  check(identifier, limit, windowMs) {
    const now = Date.now();
    const timestamps = this.hits.get(identifier) || [];

    // Filter timestamps within window
    const windowStart = now - windowMs;
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    const count = validTimestamps.length;
    const isAllowed = count < limit;

    if (isAllowed) {
      validTimestamps.push(now);
      this.hits.set(identifier, validTimestamps);
    } else {
      this.hits.set(identifier, validTimestamps);
    }

    const resetMs =
      validTimestamps.length > 0 ? validTimestamps[0] + windowMs - now : windowMs;

    return {
      success: isAllowed,
      limit,
      remaining: Math.max(0, limit - validTimestamps.length),
      resetMs: Math.max(0, resetMs),
    };
  }
}

// Global instance to survive Next.js module reloads in development
const globalForRateLimit = globalThis;
if (!globalForRateLimit.rateLimiter) {
  globalForRateLimit.rateLimiter = new RateLimiter();
}

export const rateLimiter = globalForRateLimit.rateLimiter;

/**
 * Extracts client IP address from standard headers (Cloudflare, Vercel, Proxies)
 * @param {Request} req 
 * @returns {string}
 */
export function getClientIp(req) {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  return "127.0.0.1";
}

/**
 * Helper to rate limit API requests
 * @param {Request} req - Next.js Request object
 * @param {string} routeName - e.g. "contact", "track", "login"
 * @param {number} limit - Maximum allowed requests in window
 * @param {number} windowMs - Window duration in milliseconds (e.g. 60000 for 1 min)
 * @returns {{ success: boolean, limit: number, remaining: number, resetMs: number, headers: Object }}
 */
export function applyRateLimit(req, routeName = "default", limit = 10, windowMs = 60 * 1000) {
  const ip = getClientIp(req);
  const identifier = `${routeName}:${ip}`;
  const result = rateLimiter.check(identifier, limit, windowMs);

  return {
    ...result,
    headers: {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(result.resetMs / 1000).toString(),
      "Retry-After": Math.ceil(result.resetMs / 1000).toString(),
    },
  };
}
