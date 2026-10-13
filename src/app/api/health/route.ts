import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint ringan untuk load balancer, Nginx, dan uptime monitoring.
 * Melakukan query paling ringan (SELECT 1) untuk memastikan konektivitas database berjalan baik.
 */
export async function GET() {
  const startTime = Date.now();
  let dbHealthy = false;
  let errorMessage: string | null = null;

  try {
    // Quick probe to ensure database connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (err: any) {
    dbHealthy = false;
    errorMessage = err?.message || String(err);
  }

  const responseTimeMs = Date.now() - startTime;
  let dbHost: string | null = null;
  try {
    if (process.env.DATABASE_URL) {
      dbHost = new URL(process.env.DATABASE_URL).hostname;
    }
  } catch {}

  if (!dbHealthy) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        errorMessage,
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        databaseHost: dbHost,
        isVercel: Boolean(process.env.VERCEL),
        responseTimeMs,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: "healthy",
      database: "connected",
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
