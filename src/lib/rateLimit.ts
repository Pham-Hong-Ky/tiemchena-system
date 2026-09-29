/**
 * Centralized In-Memory Sliding Window Rate Limiter
 * With automatic memory cleanup to prevent memory leaks
 */

interface RateLimitRecord {
  timestamps: number[];
  blockedUntil?: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
  errorMessage?: string;
}

export function checkGenericRateLimit(
  namespace: string,
  key: string,
  options: RateLimitOptions
): { allowed: boolean; retryAfterMinutes?: number; error?: string } {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map<string, RateLimitRecord>();
    stores.set(namespace, store);
  }

  const now = Date.now();
  let record = store.get(key);

  if (!record) {
    record = { timestamps: [now] };
    store.set(key, record);
    return { allowed: true };
  }

  // Check if currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
    return {
      allowed: false,
      retryAfterMinutes: remainingMinutes,
      error: options.errorMessage || `Quá nhiều yêu cầu. Vui lòng thử lại sau ${remainingMinutes} phút.`,
    };
  }

  // Filter timestamps within sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < options.windowMs);

  if (record.timestamps.length >= options.maxRequests) {
    if (options.blockDurationMs) {
      record.blockedUntil = now + options.blockDurationMs;
      store.set(key, record);
      const blockedMinutes = Math.ceil(options.blockDurationMs / 60000);
      return {
        allowed: false,
        retryAfterMinutes: blockedMinutes,
        error: options.errorMessage || `Quá nhiều yêu cầu liên tiếp. Vui lòng thử lại sau ${blockedMinutes} phút.`,
      };
    } else {
      return {
        allowed: false,
        retryAfterMinutes: Math.ceil(options.windowMs / 60000),
        error: options.errorMessage || "Vui lòng thao tác chậm lại.",
      };
    }
  }

  record.timestamps.push(now);
  store.set(key, record);
  return { allowed: true };
}

// Periodic cleanup every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  const CLEANUP_INTERVAL = 10 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, record] of store) {
        const isBlocked = record.blockedUntil && record.blockedUntil > now;
        const hasRecentTimestamps = record.timestamps.some((t) => now - t < 30 * 60 * 1000);
        if (!isBlocked && !hasRecentTimestamps) {
          store.delete(key);
        }
      }
    }
  }, CLEANUP_INTERVAL).unref?.();
}
