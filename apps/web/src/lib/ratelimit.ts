import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export class InMemoryRateLimiter {
  private store: Map<string, { count: number; expiresAt: number }> = new Map();

  /**
   * Basic sliding window rate limit.
   * @param limit Max requests per window
   * @param windowMs Time window in milliseconds
   */
  constructor(private limit: number, private windowMs: number) {}

  public async check(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record) {
      this.store.set(identifier, { count: 1, expiresAt: now + this.windowMs });
      return { success: true, limit: this.limit, remaining: this.limit - 1, reset: now + this.windowMs };
    }

    if (now > record.expiresAt) {
      // Window expired, reset
      this.store.set(identifier, { count: 1, expiresAt: now + this.windowMs });
      return { success: true, limit: this.limit, remaining: this.limit - 1, reset: now + this.windowMs };
    }

    if (record.count >= this.limit) {
      return { success: false, limit: this.limit, remaining: 0, reset: record.expiresAt };
    }

    record.count += 1;
    return { success: true, limit: this.limit, remaining: this.limit - record.count, reset: record.expiresAt };
  }
}

// Check if Upstash is configured
const isUpstashConfigured = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = isUpstashConfigured ? Redis.fromEnv() : null;

export const authRateLimiter = isUpstashConfigured 
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(5, "5 m"), // 5 requests per 5 minutes
      analytics: false,
    })
  : { limit: async (id: string) => new InMemoryRateLimiter(5, 5 * 60 * 1000).check(id) }; // fallback

export const publicRateLimiter = isUpstashConfigured 
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests per minute
      analytics: false,
    })
  : { limit: async (id: string) => new InMemoryRateLimiter(20, 60 * 1000).check(id) };

export const userRateLimiter = isUpstashConfigured 
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
      analytics: false,
    })
  : { limit: async (id: string) => new InMemoryRateLimiter(60, 60 * 1000).check(id) };

export const aiRateLimiter = isUpstashConfigured 
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute for heavy AI endpoints
      analytics: false,
    })
  : { limit: async (id: string) => new InMemoryRateLimiter(10, 60 * 1000).check(id) };
