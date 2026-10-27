import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

/**
 * Comprehensive Health Check Endpoint
 * Merujuk ke plan-update-.md Fase 1 Task 1.8
 *
 * Digunakan oleh Nginx, Docker healthcheck, Uptime Kuma, dan Load Balancer
 * untuk memantau integritas server, konektivitas database, memory usage, dan uptime.
 */
export async function GET() {
  const startTime = performance.now();

  const checks = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: process.env.npm_package_version || "0.1.0",
    environment: process.env.NODE_ENV || "development",
    memory: {
      rssMB: Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10,
      heapUsedMB: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10,
      heapTotalMB: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 10) / 10,
    },
    database: {
      status: "unknown",
      latencyMs: 0,
      host: null as string | null,
    },
    cache: {
      activeEntries: AppCache.getStats().size,
    },
  };

  try {
    if (process.env.DATABASE_URL) {
      checks.database.host = new URL(process.env.DATABASE_URL).hostname;
    }
  } catch {}

  try {
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database.status = "connected";
    checks.database.latencyMs = Math.round(performance.now() - dbStart);
  } catch (err: any) {
    checks.status = "degraded";
    checks.database.status = "disconnected";
    checks.database.latencyMs = -1;
  }

  const durationMs = Math.round(performance.now() - startTime);
  const statusCode = checks.status === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      ...checks,
      totalLatencyMs: durationMs,
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "X-Health-Status": checks.status,
      },
    }
  );
}
