import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppCache } from "@/lib/cache";
import { checkRateLimit, checkRateLimitAsync } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

describe("Production Readiness Architecture Tests", () => {
  beforeEach(() => {
    AppCache.clear();
    metrics.reset();
  });

  describe("1. Multi-Layer AppCache", () => {
    it("should return cached value and avoid re-executing fetcher on cache hit", async () => {
      let callCount = 0;
      const fetcher = async () => {
        callCount++;
        return { data: "test-data" };
      };

      const result1 = await AppCache.getOrSet("key-1", 60, fetcher, ["test-tag"]);
      const result2 = await AppCache.getOrSet("key-1", 60, fetcher, ["test-tag"]);

      expect(callCount).toBe(1);
      expect(result1).toEqual({ data: "test-data" });
      expect(result2).toEqual({ data: "test-data" });
    });

    it("should invalidate cache entries by tag", async () => {
      let fetchCount = 0;
      const fetcher = async () => ++fetchCount;

      await AppCache.getOrSet("tag-key-1", 60, fetcher, ["users"]);
      await AppCache.getOrSet("tag-key-2", 60, fetcher, ["users"]);
      await AppCache.getOrSet("other-key", 60, fetcher, ["settings"]);

      AppCache.invalidateTag("users");

      await AppCache.getOrSet("tag-key-1", 60, fetcher, ["users"]);
      expect(fetchCount).toBe(4); // 3 awal + 1 fetcher dipanggil ulang setelah tag users dibersihkan
    });

    it("should invalidate cache entries by prefix", async () => {
      let count = 0;
      const fetcher = async () => ++count;

      await AppCache.getOrSet("dashboard:sd", 60, fetcher);
      await AppCache.getOrSet("dashboard:smp", 60, fetcher);

      AppCache.invalidatePrefix("dashboard:");

      await AppCache.getOrSet("dashboard:sd", 60, fetcher);
      expect(count).toBe(3);
    });
  });

  describe("2. Rate Limiting", () => {
    it("should enforce request limits within sliding window", () => {
      const id = "test-ip-client-1";
      for (let i = 0; i < 5; i++) {
        const res = checkRateLimit(id, 5, 10);
        expect(res.success).toBe(true);
      }

      const blocked = checkRateLimit(id, 5, 10);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetSeconds).toBeGreaterThan(0);
    });

    it("should work smoothly with checkRateLimitAsync", async () => {
      const id = "async-test-ip";
      const res = await checkRateLimitAsync(id, 10, 30);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(9);
    });
  });

  describe("3. Telemetry & Metrics Collector", () => {
    it("should accurately track request counts, latencies, and error rates", () => {
      metrics.recordRequest(50, false);
      metrics.recordRequest(150, false);
      metrics.recordRequest(300, true);

      const snapshot = metrics.getSnapshot();
      expect(snapshot.performance.totalRequests).toBe(3);
      expect(snapshot.performance.errorCount).toBe(1);
      expect(snapshot.performance.avgLatencyMs).toBe(166.7);
      expect(snapshot.performance.errorRatePercent).toBeCloseTo(33.33, 1);
      expect(snapshot.memory.heapUsedMB).toBeGreaterThan(0);
    });
  });

  describe("4. Structured Logger Measurement", () => {
    it("should measure execution duration of async functions", async () => {
      const result = await logger.measure("Test Async Op", async () => {
        return "completed-successfully";
      });
      expect(result).toBe("completed-successfully");
    });
  });
});
