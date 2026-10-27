/**
 * Rate Limiter Berbasis Sliding-Window untuk Student Apps
 * Merujuk ke plan-update-.md Bagian 3.2 & Fase 2 Task 2.2
 *
 * Menyediakan proteksi synchronous in-memory (kompatibel penuh dengan vitest & server actions)
 * serta proteksi async berbasis Redis untuk multi-instance cluster production.
 */

import { redis } from "./redis";

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const threshold = now - windowMs;
  for (const [key, record] of rateLimitMap.entries()) {
    const valid = record.timestamps.filter((t) => t > threshold);
    if (valid.length === 0) {
      rateLimitMap.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/** Kebijakan Rate Limit Standar Produksi */
export const RATE_LIMIT_POLICIES = {
  LOGIN: { limit: 5, windowSeconds: 15 * 60 }, // 5 percobaan per 15 menit
  REGISTER: { limit: 3, windowSeconds: 60 * 60 }, // 3 pendaftaran per jam
  PASSWORD_RESET: { limit: 3, windowSeconds: 30 * 60 }, // 3 per 30 menit
  FILE_UPLOAD: { limit: 10, windowSeconds: 5 * 60 }, // 10 upload per 5 menit
  CHAT_MESSAGE: { limit: 30, windowSeconds: 60 }, // 30 pesan per menit
  API_GENERIC: { limit: 100, windowSeconds: 60 }, // 100 request per menit
  ADMIN_BULK: { limit: 5, windowSeconds: 60 }, // 5 operasi bulk per menit
} as const;

/**
 * Memeriksa rate limit secara sinkron (in-memory sliding window).
 * Kompatibel dengan semua unit test dan synchronous action checks.
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  if (process.env.RATE_LIMIT_ENABLED === "false") {
    return {
      success: true,
      limit,
      remaining: limit,
      resetSeconds: 0,
    };
  }

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  cleanupExpired(windowMs);

  const record = rateLimitMap.get(identifier) || { timestamps: [] };
  const validTimestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  validTimestamps.push(now);
  rateLimitMap.set(identifier, { timestamps: validTimestamps });

  return {
    success: true,
    limit,
    remaining: limit - validTimestamps.length,
    resetSeconds: windowSeconds,
  };
}

/**
 * Memeriksa rate limit secara asinkron (mendukung Redis cluster distributed rate limiting).
 */
export async function checkRateLimitAsync(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_ENABLED === "false") {
    return { success: true, limit, remaining: limit, resetSeconds: 0 };
  }

  // Jika Redis tidak tersedia, fallback ke fungsi sinkron in-memory
  if (!redis.isAvailable()) {
    return checkRateLimit(identifier, limit, windowSeconds);
  }

  const key = `rate:${identifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  try {
    await redis.zremrangebyscore(key, 0, now - windowMs);
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    const count = await redis.zcard(key);
    await redis.expire(key, windowSeconds);

    if (count > limit) {
      return { success: false, limit, remaining: 0, resetSeconds: windowSeconds };
    }

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - count),
      resetSeconds: windowSeconds,
    };
  } catch {
    // Graceful fallback to memory on any Redis error
    return checkRateLimit(identifier, limit, windowSeconds);
  }
}

/**
 * Reset memory rate limit (berguna untuk testing atau manual unblock admin)
 */
export function resetRateLimit(identifier?: string): void {
  if (identifier) {
    rateLimitMap.delete(identifier);
  } else {
    rateLimitMap.clear();
  }
}

