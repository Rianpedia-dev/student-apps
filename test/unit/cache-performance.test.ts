import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppCache } from "@/lib/cache";
import { checkRateLimit, resetRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { metrics } from "@/lib/metrics";

describe("Suite 10: Multi-Layer Caching, Rate Limit & Telemetri", () => {
  beforeEach(() => {
    AppCache.clear();
  });

  describe("10.1: AppCache In-Memory TTL (<1ms Fast Retrieval)", () => {
    it("harus mengeksekusi fetcher pada pemanggilan pertama, dan mengembalikan cache instan pada pemanggilan kedua", async () => {
      const mockDbFetcher = vi.fn().mockResolvedValue([
        { id: 1, name: "Matematika" },
        { id: 2, name: "IPA" },
      ]);

      const key = "test:mapel:list";
      const ttl = 60; // 60 detik

      // Pemanggilan pertama: cache miss -> fetcher dipanggil
      const result1 = await AppCache.getOrSet(key, ttl, mockDbFetcher);
      expect(result1).toHaveLength(2);
      expect(mockDbFetcher).toHaveBeenCalledTimes(1);

      // Pemanggilan kedua: cache hit -> instan tanpa panggil fetcher
      const startTime = performance.now();
      const result2 = await AppCache.getOrSet(key, ttl, mockDbFetcher);
      const duration = performance.now() - startTime;

      expect(result2).toEqual(result1);
      expect(mockDbFetcher).toHaveBeenCalledTimes(1); // Tetap 1 kali!
      expect(duration).toBeLessThan(5); // Harus super instan di memori (<5ms)
    });

    it("harus menghormati TTL dan memanggil kembali fetcher jika cache sudah expired", async () => {
      let counter = 1;
      const fetcher = vi.fn().mockImplementation(async () => `Value ${counter++}`);

      // TTL negatif / 0 langsung kadaluarsa
      const val1 = await AppCache.getOrSet("key:expire", -1, fetcher);
      expect(val1).toBe("Value 1");

      const val2 = await AppCache.getOrSet("key:expire", -1, fetcher);
      expect(val2).toBe("Value 2");
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe("10.2: Invalidasi Berbasis Tag & Prefix (Tag Invalidation)", () => {
    it("harus menghapus seluruh cache dengan tag yang sama saat invalidateTag dipanggil", async () => {
      const fetcherMapel = vi.fn().mockResolvedValue({ mapel: "Kimia" });
      const fetcherJadwal = vi.fn().mockResolvedValue({ jadwal: "Senin 08:00" });
      const fetcherUser = vi.fn().mockResolvedValue({ user: "Admin" });

      await AppCache.getOrSet("mapel:sd:1", 60, fetcherMapel, ["mapel"]);
      await AppCache.getOrSet("mapel:smp:2", 60, fetcherMapel, ["mapel"]);
      await AppCache.getOrSet("user:profile:100", 60, fetcherUser, ["user"]);

      expect(AppCache.getStats().size).toBe(3);

      // Invalidate tag "mapel"
      AppCache.invalidateTag("mapel");

      expect(AppCache.getStats().size).toBe(1);

      // Pemanggilan mapel berikutnya harus fetch ulang
      await AppCache.getOrSet("mapel:sd:1", 60, fetcherMapel, ["mapel"]);
      expect(fetcherMapel).toHaveBeenCalledTimes(3); // 2 dari pemanggilan awal + 1 fetch ulang
    });

    it("harus menghapus cache berdasarkan awalan prefix", async () => {
      const fetcher = vi.fn().mockResolvedValue("dummy");
      await AppCache.getOrSet("dashboard:stats:sd", 60, fetcher);
      await AppCache.getOrSet("dashboard:stats:smp", 60, fetcher);
      await AppCache.getOrSet("other:data", 60, fetcher);

      AppCache.invalidatePrefix("dashboard:");

      expect(AppCache.getStats().size).toBe(1);
    });
  });

  describe("10.3: Sliding Window Rate Limiter", () => {
    it("harus membatasi percobaan login maksimal 5 kali dalam 15 menit per identifier", () => {
      const ip = "192.168.1.50";
      resetRateLimit(ip);

      const policy = RATE_LIMIT_POLICIES.LOGIN; // limit: 5, windowSeconds: 900

      // Percobaan 1 s/d 5 harus sukses
      for (let i = 1; i <= 5; i++) {
        const res = checkRateLimit(ip, policy.limit, policy.windowSeconds);
        expect(res.success).toBe(true);
        expect(res.remaining).toBe(5 - i);
      }

      // Percobaan ke-6 harus ditolak (blocked)
      const blocked = checkRateLimit(ip, policy.limit, policy.windowSeconds);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetSeconds).toBeGreaterThan(0);
    });

    it("harus mengisolasi kuota rate limit antar identifier yang berbeda", () => {
      const userA = "user_101";
      const userB = "user_202";
      resetRateLimit(userA);
      resetRateLimit(userB);

      // Habiskan kuota User A
      for (let i = 0; i < 5; i++) {
        checkRateLimit(userA, 5, 60);
      }
      expect(checkRateLimit(userA, 5, 60).success).toBe(false);

      // User B harus tetap memiliki kuota penuh
      const resB = checkRateLimit(userB, 5, 60);
      expect(resB.success).toBe(true);
      expect(resB.remaining).toBe(4);
    });
  });

  describe("10.4: Telemetri & Metrics Collector", () => {
    it("harus menghitung persentil P95 dan rata-rata durasi permintaan secara akurat", () => {
      metrics.reset();

      // Rekam 100 sampel request dengan latensi 1ms s/d 100ms
      for (let ms = 1; ms <= 100; ms++) {
        metrics.recordRequest(ms, ms > 95); // 5 error saat ms > 95
      }

      const snapshot = metrics.getSnapshot();

      expect(snapshot.performance.totalRequests).toBe(100);
      // Rata-rata dari 1..100 = 50.5
      expect(snapshot.performance.avgLatencyMs).toBeCloseTo(50.5, 1);
      // P95 untuk sampel 1..100 berada di sekitar 96ms
      expect(snapshot.performance.p95LatencyMs).toBeGreaterThanOrEqual(95);
      expect(snapshot.performance.p95LatencyMs).toBeLessThanOrEqual(97);
      // Error count = 5
      expect(snapshot.performance.errorCount).toBe(5);
      expect(snapshot.performance.errorRatePercent).toBe(5);
    });
  });
});
