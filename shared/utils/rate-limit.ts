// Rate limiting utility using in-memory storage
// For production, consider using Redis or similar persistent storage

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export function createRateLimit(config: RateLimitConfig) {
  return {
    check: (
      identifier: string
    ): { success: true } | { success: false; retryAfter: number } => {
      const now = Date.now();
      const key = `rate_limit:${identifier}`;

      let entry = rateLimitStore.get(key);

      if (!entry || now > entry.resetTime) {
        // Create new entry or reset expired entry
        entry = {
          count: 1,
          resetTime: now + config.windowMs,
        };
        rateLimitStore.set(key, entry);
        return { success: true };
      }

      if (entry.count >= config.maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return { success: false, retryAfter };
      }

      // Increment counter
      entry.count++;
      rateLimitStore.set(key, entry);
      return { success: true };
    },

    checkAndThrow: function (identifier: string): void {
      const result = this.check(identifier);
      if (!result.success) {
        throw new RateLimitError(
          config.message || "Too many requests",
          result.retryAfter
        );
      }
    },
  };
}

// Predefined rate limiters for different endpoints
export const rateLimiters = {
  // Authentication - stricter limits
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    message: "Too many authentication attempts. Please try again later.",
  }),

  // Registration - moderate limits
  registration: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registration attempts per hour
    message: "Too many registration attempts. Please try again later.",
  }),

  // Payment - strict limits to prevent abuse
  payment: createRateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 5, // 5 payment attempts per 10 minutes
    message: "Too many payment attempts. Please wait before trying again.",
  }),

  // General API - lenient limits
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: "Too many requests. Please slow down.",
  }),

  // File upload - strict limits due to resource usage
  upload: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 uploads per hour
    message: "Too many file uploads. Please try again later.",
  }),
};

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfIP = request.headers.get("cf-connecting-ip"); // Cloudflare

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfIP) {
    return cfIP;
  }

  // Fallback to a default identifier
  return "unknown";
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit<T extends unknown[]>(
  rateLimiter: ReturnType<typeof createRateLimit>,
  handler: (request: Request, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      const clientIP = getClientIP(request);
      const result = rateLimiter.check(clientIP);

      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: "Rate limit exceeded",
              retryAfter: result.retryAfter,
            },
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": result.retryAfter.toString(),
            },
          }
        );
      }

      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: error.message,
              retryAfter: error.retryAfter,
            },
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": error.retryAfter.toString(),
            },
          }
        );
      }

      // Re-throw other errors
      throw error;
    }
  };
}
