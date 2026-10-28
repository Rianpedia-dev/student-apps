/**
 * Redis Connection & Client Wrapper for Distributed Caching & Rate Limiting
 * Merujuk ke plan-update-.md Bagian 2.3 & Fase 2 Task 2.1
 *
 * Mendukung Redis client dengan reconnect strategy, healthcheck,
 * dan graceful fallback jika instance Redis belum/tidak tersedia.
 */

import { logger } from "./logger";

export interface RedisClientInterface {
  isAvailable(): boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  zadd(key: string, score: number, member: string): Promise<number>;
  zremrangebyscore(key: string, min: number, max: number): Promise<number>;
  zcard(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
}

class MemoryFallbackClient implements RedisClientInterface {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private zsets = new Map<string, Array<{ score: number; member: string }>>();

  isAvailable(): boolean {
    return false;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.zsets.delete(key);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    let list = this.zsets.get(key);
    if (!list) {
      list = [];
      this.zsets.set(key, list);
    }
    list.push({ score, member });
    return 1;
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    const list = this.zsets.get(key);
    if (!list) return 0;
    const initialLen = list.length;
    const filtered = list.filter((item) => item.score < min || item.score > max);
    this.zsets.set(key, filtered);
    return initialLen - filtered.length;
  }

  async zcard(key: string): Promise<number> {
    const list = this.zsets.get(key);
    return list ? list.length : 0;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
  }
}

let redisInstance: RedisClientInterface = new MemoryFallbackClient();
let isRedisConnected = false;

// Coba inisialisasi ioredis jika dependensi dan konfigurasi REDIS_URL/REDIS_HOST tersedia
(async function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (!redisUrl && !redisHost) {
    // Mode dev/standalone tanpa Redis, fallback in-memory aktif
    return;
  }

  try {
    // Dynamic import dengan webpackIgnore agar bundler Next.js tidak memunculkan warning jika modul belum diinstall
    const moduleName = "ioredis";
    const { default: Redis } = (await import(/* webpackIgnore: true */ moduleName)) as any;
    const client = redisUrl
      ? new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
          lazyConnect: true,
        })
      : new Redis({
          host: redisHost || "127.0.0.1",
          port: parseInt(process.env.REDIS_PORT || "6379", 10),
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
          lazyConnect: true,
        });

    client.on("connect", () => {
      isRedisConnected = true;
      logger.info("[Redis] Berhasil terhubung ke server Redis");
    });

    client.on("error", (err: any) => {
      logger.warn(`[Redis Connection Warning] ${err.message}`);
    });

    await client.connect();

    redisInstance = {
      isAvailable: () => isRedisConnected,
      get: (key) => client.get(key),
      set: async (key, val, ttl) => {
        if (ttl) {
          await client.set(key, val, "EX", ttl);
        } else {
          await client.set(key, val);
        }
      },
      del: async (key) => {
        await client.del(key);
      },
      zadd: async (key, score, member) => client.zadd(key, score, member),
      zremrangebyscore: async (key, min, max) => client.zremrangebyscore(key, min, max),
      zcard: async (key) => client.zcard(key),
      expire: async (key, seconds) => {
        await client.expire(key, seconds);
      },
    };
  } catch (err: any) {
    logger.warn(`[Redis Initialization] Menggunakan In-Memory Fallback: ${err.message}`);
  }
})();

export const redis = redisInstance;
