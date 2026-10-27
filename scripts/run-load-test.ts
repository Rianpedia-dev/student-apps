/**
 * Local High-Performance Load Testing Engine
 * Al-Azhar Cairo Palembang — Student Apps
 *
 * Mensimulasikan ratusan request concurrent secara real-time
 * langsung di lingkungan lokal tanpa perlu instalasi k6 pihak ketiga.
 *
 * Jalankan: npx tsx scripts/run-load-test.ts [TARGET_URL] [CONCURRENCY] [TOTAL_REQUESTS]
 * Contoh:   npx tsx scripts/run-load-test.ts http://localhost:3000 100 1000
 */

const BASE_URL = process.argv[2] || "http://localhost:3000";
const CONCURRENCY = parseInt(process.argv[3] || "50", 10);
const TOTAL_REQUESTS = parseInt(process.argv[4] || "300", 10);

interface Result {
  status: number;
  durationMs: number;
  success: boolean;
  endpoint: string;
}

const ENDPOINTS = ["/api/health", "/login"];

async function runWorker(
  id: number,
  requestsPerWorker: number,
  onResult: (res: Result) => void
) {
  for (let i = 0; i < requestsPerWorker; i++) {
    const endpoint = ENDPOINTS[i % ENDPOINTS.length];
    const url = `${BASE_URL}${endpoint}`;
    const start = performance.now();

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": `LoadTestWorker/${id}`,
          Accept: "text/html,application/json",
        },
      });
      const durationMs = Math.round((performance.now() - start) * 10) / 10;
      onResult({
        status: response.status,
        durationMs,
        success: response.status >= 200 && response.status < 400,
        endpoint,
      });
    } catch {
      const durationMs = Math.round((performance.now() - start) * 10) / 10;
      onResult({
        status: 0,
        durationMs,
        success: false,
        endpoint,
      });
    }
  }
}

async function main() {
  console.log("===================================================================");
  console.log("🚀 STUDENT APPS AL-AZHAR — LOCAL LOAD & CONCURRENCY BENCHMARK");
  console.log("===================================================================");
  console.log(`🌐 Target Base URL   : ${BASE_URL}`);
  console.log(`⚡ Concurrent Workers: ${CONCURRENCY} virtual users`);
  console.log(`📦 Total Permintaan  : ${TOTAL_REQUESTS} requests`);
  console.log(`🎯 Endpoints Tested  : ${ENDPOINTS.join(", ")}`);
  console.log("-------------------------------------------------------------------");
  console.log("⏳ Menjalankan pengujian beban concurrent...");

  const results: Result[] = [];
  const startTime = performance.now();

  const requestsPerWorker = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);
  const workers: Promise<void>[] = [];

  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(
      runWorker(w + 1, requestsPerWorker, (res) => {
        results.push(res);
        if (results.length % 50 === 0 || results.length === TOTAL_REQUESTS) {
          process.stdout.write(`\r  Progress: ${results.length}/${TOTAL_REQUESTS} (${Math.round((results.length / TOTAL_REQUESTS) * 100)}%)`);
        }
      })
    );
  }

  await Promise.all(workers);
  const totalDurationSeconds = (performance.now() - startTime) / 1000;

  console.log("\n-------------------------------------------------------------------");
  console.log("📊 HASIL ANALISIS BEBAN & PERFORMA:");
  console.log("-------------------------------------------------------------------");

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;
  const successRate = Math.round((successCount / results.length) * 1000) / 10;

  const latencies = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const avgLatency = Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10;
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.9)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  const rps = Math.round((results.length / totalDurationSeconds) * 10) / 10;

  console.log(`✅ Permintaan Berhasil : ${successCount} (${successRate}%)`);
  console.log(`❌ Permintaan Gagal    : ${failureCount} (${(100 - successRate).toFixed(1)}%)`);
  console.log(`⏱️ Total Waktu Uji     : ${totalDurationSeconds.toFixed(2)} detik`);
  console.log(`⚡ Throughput (RPS)    : ${rps} requests/detik`);
  console.log("");
  console.log("📈 Distribusi Latensi Respon (Response Times):");
  console.log(`   - Min Latency       : ${minLatency} ms`);
  console.log(`   - Rata-rata (Avg)   : ${avgLatency} ms`);
  console.log(`   - Median (P50)      : ${p50} ms`);
  console.log(`   - 90th Persentil    : ${p90} ms`);
  console.log(`   - 95th Persentil    : ${p95} ms`);
  console.log(`   - 99th Persentil    : ${p99} ms`);
  console.log(`   - Max Latency       : ${maxLatency} ms`);
  console.log("-------------------------------------------------------------------");

  // Penilaian Kesesuaian Kriteria Target SLA Produksi
  const p95TargetPassed = p95 < 2000;
  const errorTargetPassed = failureCount / results.length < 0.05;

  if (p95TargetPassed && errorTargetPassed) {
    console.log("🎉 STATUS: EXCELLENT! Aplikasi memenuhi seluruh kriteria target produksi (P95 < 2.000ms & Error < 5%).");
  } else {
    console.log("⚠️ STATUS: Perlu perhatian pada kestabilan saat load tinggi.");
  }
  console.log("===================================================================\n");
}

main().catch((err) => {
  console.error("Fatal error saat load test:", err);
  process.exit(1);
});
