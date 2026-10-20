import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaBuild: string | undefined;
};

function createPrismaClient() {
  let rawUrl = (process.env.DATABASE_URL || "").trim();

  // Bersihkan tanda petik ganda/tunggal jika user memasukkannya di Vercel Environment Variables
  if (
    (rawUrl.startsWith('"') && rawUrl.endsWith('"')) ||
    (rawUrl.startsWith("'") && rawUrl.endsWith("'"))
  ) {
    rawUrl = rawUrl.slice(1, -1).trim();
  }

  const url = rawUrl || "mysql://root:@localhost:3306/student-app";

  try {
    const parsed = new URL(url);
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    const dbName = parsed.pathname.replace(/^\//, "").split("?")[0] || "student-app";

    const isVercel = Boolean(process.env.VERCEL);
    if (!rawUrl && isVercel) {
      console.error(
        "[Prisma Error] DATABASE_URL tidak ditemukan di environment Vercel! Harap tambahkan DATABASE_URL pada Vercel Settings -> Environment Variables lalu lakukan Redeploy."
      );
    }

    const defaultLimit = isVercel ? 5 : (isLocal ? 15 : 10);
    const poolLimit = parseInt(
      process.env.DB_CONNECTION_LIMIT || process.env.DATABASE_POOL_SIZE || String(defaultLimit),
      10
    ) || defaultLimit;

    // Untuk remote DB seperti TiDB Cloud di Vercel Lambda, default rejectUnauthorized false agar tidak gagal verifikasi cert di container serverless
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === "true";

    const adapter = new PrismaMariaDb({
      host: parsed.hostname || "localhost",
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username || "root"),
      password: decodeURIComponent(parsed.password || ""),
      database: dbName,
      connectionLimit: poolLimit,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      ssl: isLocal ? undefined : { minVersion: "TLSv1.2", rejectUnauthorized },
    });

    return new PrismaClient({ adapter });
  } catch (err) {
    console.error("[Prisma Setup Error] Failed to parse DATABASE_URL:", err);
    // Fallback adapter configuration
    const adapter = new PrismaMariaDb({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "student-app",
      connectionLimit: 15,
      connectTimeout: 10000,
      acquireTimeout: 10000,
    });
    return new PrismaClient({ adapter });
  }
}

const PRISMA_SCHEMA_BUILD = "2026-10-02-interactive-tasks-v2";

// Pastikan instansiasi ulang jika schema berubah atau belum memiliki build version saat ini
const isPrismaValid =
  globalForPrisma.prisma &&
  globalForPrisma.prismaBuild === PRISMA_SCHEMA_BUILD &&
  "tugasSoal" in globalForPrisma.prisma;

if (globalForPrisma.prisma && !isPrismaValid) {
  try {
    globalForPrisma.prisma.$disconnect().catch(() => {});
  } catch {}
  globalForPrisma.prisma = undefined;
}

export const prisma = isPrismaValid
  ? (globalForPrisma.prisma as PrismaClient)
  : createPrismaClient();

// Selalu simpan di globalThis agar tidak membuat pool baru pada re-evaluasi server actions
globalForPrisma.prisma = prisma;
globalForPrisma.prismaBuild = PRISMA_SCHEMA_BUILD;

export default prisma;
