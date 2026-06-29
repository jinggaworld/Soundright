const requestCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * In-memory rate limiter.
 *
 * @param key       Unique key per client (e.g. IP address or wallet address).
 * @param maxRequests  Maximum requests allowed within the window.
 * @param windowMs Window duration in milliseconds (default 60 s).
 * @returns `{ allowed, remaining }` — remaining is the number of requests left.
 */
export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}
