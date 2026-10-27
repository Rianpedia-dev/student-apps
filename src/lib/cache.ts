/**
 * Multi-Layer High-Performance Caching Layer for Student Apps
 * Merujuk ke plan-update-.md Bagian 2.3 & Fase 1 Task 1.4
 *
 * Menyediakan in-memory TTL caching yang super cepat (<1ms)
 * dengan invalidasi berbasis kunci/tag/prefix, serta kesiapan integrasi Redis.
 */

import { logger } from "./logger";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags?: string[];
}

const memoryStore = new Map<string, CacheEntry<unknown>>();
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 menit
let lastCleanupTime = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanupTime < CLEANUP_INTERVAL_MS) return;
  lastCleanupTime = now;

  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

export class AppCache {
  /**
   * Mengambil item dari cache atau mengeksekusi fetcher jika miss/expired
   */
  static async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
    tags?: string[]
  ): Promise<T> {
    cleanupExpired();

    const now = Date.now();
    const existing = memoryStore.get(key) as CacheEntry<T> | undefined;

    if (existing && existing.expiresAt > now) {
      return existing.value;
    }

    // Cache miss / expired: fetch fresh data
    const freshValue = await fetcher();

    memoryStore.set(key, {
      value: freshValue,
      expiresAt: now + ttlSeconds * 1000,
      tags,
    });

    return freshValue;
  }

  /**
   * Menghapus cache berdasarkan key persis
   */
  static delete(key: string): void {
    memoryStore.delete(key);
  }

  /**
   * Menghapus cache berdasarkan awalan prefix (contoh: "dashboard:")
   */
  static invalidatePrefix(prefix: string): void {
    for (const key of memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        memoryStore.delete(key);
      }
    }
  }

  /**
   * Menghapus cache berdasarkan tag (contoh: "dashboard", "admin-stats")
   */
  static invalidateTag(tag: string): void {
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        memoryStore.delete(key);
      }
    }
  }

  /**
   * Membersihkan seluruh isi cache
   */
  static clear(): void {
    memoryStore.clear();
  }

  /**
   * Statistik cache saat ini
   */
  static getStats() {
    return {
      size: memoryStore.size,
      keys: Array.from(memoryStore.keys()),
    };
  }
}
