export class InMemoryRateLimiter {
  private store: Map<string, { count: number; expiresAt: number }> = new Map();

  /**
   * Basic sliding window rate limit.
   * @param limit Max requests per window
   * @param windowMs Time window in milliseconds
   */
  constructor(private limit: number, private windowMs: number) {}

  public check(identifier: string): { success: boolean; limit: number; remaining: number } {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record) {
      this.store.set(identifier, { count: 1, expiresAt: now + this.windowMs });
      return { success: true, limit: this.limit, remaining: this.limit - 1 };
    }

    if (now > record.expiresAt) {
      // Window expired, reset
      this.store.set(identifier, { count: 1, expiresAt: now + this.windowMs });
      return { success: true, limit: this.limit, remaining: this.limit - 1 };
    }

    if (record.count >= this.limit) {
      return { success: false, limit: this.limit, remaining: 0 };
    }

    record.count += 1;
    return { success: true, limit: this.limit, remaining: this.limit - record.count };
  }
}

// Global instance for AI endpoints: 10 requests per minute per user/IP
export const aiRateLimiter = new InMemoryRateLimiter(10, 60 * 1000);
