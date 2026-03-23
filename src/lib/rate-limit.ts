/**
 * Simple in-memory rate limiter.
 * Uses a sliding window per (key, route) pair.
 *
 * NOTE: This is per-instance — for multi-instance deployments (e.g. Vercel Edge),
 * replace with a Redis-backed solution (e.g. @upstash/ratelimit).
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Clean expired entries every 5 minutes to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (win.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key      Unique identifier for the caller (e.g. IP address)
 * @param route    Route identifier (e.g. "POST /api/servers")
 * @param limit    Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  route: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const storeKey = `${route}:${key}`;
  const now = Date.now();

  let win = store.get(storeKey);
  if (!win || win.resetAt < now) {
    win = { count: 0, resetAt: now + windowMs };
    store.set(storeKey, win);
  }

  win.count++;

  return {
    allowed: win.count <= limit,
    remaining: Math.max(0, limit - win.count),
    resetAt: win.resetAt,
  };
}

/**
 * Extract the caller IP from a Next.js request.
 */
export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
