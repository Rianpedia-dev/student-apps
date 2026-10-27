/**
 * Application Metrics & Telemetry Collector for Student Apps
 * Merujuk ke plan-update-.md Bagian 8.1 & Fase 3 Task 3.6
 */

export interface MetricSnapshot {
  uptimeSeconds: number;
  timestamp: string;
  memory: {
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    externalMB: number;
  };
  performance: {
    totalRequests: number;
    requestsPerMinute: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    errorCount: number;
    errorRatePercent: number;
  };
}

class MetricsCollector {
  private requestLatencies: number[] = [];
  private totalRequests = 0;
  private errorCount = 0;
  private minuteStartTime = Date.now();
  private requestsInCurrentMinute = 0;
  private lastRPM = 0;

  recordRequest(latencyMs: number, isError: boolean = false) {
    this.totalRequests++;
    this.requestsInCurrentMinute++;
    if (isError) this.errorCount++;

    this.requestLatencies.push(latencyMs);
    // Keep max 1000 latest samples in sliding window
    if (this.requestLatencies.length > 1000) {
      this.requestLatencies.shift();
    }

    const now = Date.now();
    if (now - this.minuteStartTime >= 60000) {
      this.lastRPM = this.requestsInCurrentMinute;
      this.requestsInCurrentMinute = 0;
      this.minuteStartTime = now;
    }
  }

  getSnapshot(): MetricSnapshot {
    const mem = process.memoryUsage();
    const sorted = [...this.requestLatencies].sort((a, b) => a - b);
    const avgLatency =
      sorted.length > 0
        ? Math.round((sorted.reduce((acc, curr) => acc + curr, 0) / sorted.length) * 10) / 10
        : 0;

    const p95Idx = Math.floor(sorted.length * 0.95);
    const p95Latency = sorted.length > 0 ? sorted[p95Idx] : 0;

    const errorRate =
      this.totalRequests > 0
        ? Math.round((this.errorCount / this.totalRequests) * 10000) / 100
        : 0;

    return {
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        rssMB: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
        heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
        heapTotalMB: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
        externalMB: Math.round((mem.external / 1024 / 1024) * 10) / 10,
      },
      performance: {
        totalRequests: this.totalRequests,
        requestsPerMinute: this.lastRPM,
        avgLatencyMs: avgLatency,
        p95LatencyMs: p95Latency,
        errorCount: this.errorCount,
        errorRatePercent: errorRate,
      },
    };
  }

  reset() {
    this.requestLatencies = [];
    this.totalRequests = 0;
    this.errorCount = 0;
    this.requestsInCurrentMinute = 0;
    this.minuteStartTime = Date.now();
  }
}

export const metrics = new MetricsCollector();
