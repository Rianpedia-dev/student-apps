import prisma from "@/lib/prisma";

interface CacheItem {
  value: string;
  expiresAt: number;
}

const cache = new Map<string, CacheItem>();
const CACHE_TTL_MS = 5000; // 5 detik TTL in-memory cache

export class SystemSettingService {
  /**
   * Mengambil nilai konfigurasi sistem berdasarkan key.
   * Dilengkapi in-memory caching 5 detik untuk efisiensi tinggi pada halaman public seperti login.
   */
  static async getSetting(key: string, defaultValue = ""): Promise<string> {
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    try {
      let value: string | undefined;

      if ((prisma as any).systemSetting?.findUnique) {
        const setting = await (prisma as any).systemSetting.findUnique({
          where: { key },
        });
        value = setting?.value;
      } else {
        const rows: any = await prisma.$queryRawUnsafe(
          "SELECT `value` FROM `tbl_system_settings` WHERE `key` = ? LIMIT 1",
          key
        );
        if (Array.isArray(rows) && rows.length > 0) {
          value = rows[0].value;
        }
      }

      const finalValue = value ?? defaultValue;
      cache.set(key, { value: finalValue, expiresAt: now + CACHE_TTL_MS });
      return finalValue;
    } catch (err) {
      console.warn(`[SystemSettingService] Gagal membaca setting "${key}", fallback default:`, err);
      return defaultValue;
    }
  }

  /**
   * Mengambil nilai boolean dari setting ("true" / "1" => true, lainnya false).
   */
  static async getBoolean(key: string, defaultBool = true): Promise<boolean> {
    const defaultStr = defaultBool ? "true" : "false";
    const val = await this.getSetting(key, defaultStr);
    const lower = val.trim().toLowerCase();
    return lower === "true" || lower === "1" || lower === "yes" || lower === "on";
  }

  /**
   * Menyimpan atau memperbarui konfigurasi sistem.
   */
  static async setSetting(key: string, value: string, deskripsi?: string): Promise<void> {
    try {
      if ((prisma as any).systemSetting?.upsert) {
        await (prisma as any).systemSetting.upsert({
          where: { key },
          update: {
            value,
            ...(deskripsi ? { deskripsi } : {}),
          },
          create: {
            key,
            value,
            deskripsi: deskripsi ?? null,
          },
        });
      } else {
        await prisma.$executeRawUnsafe(
          "INSERT INTO `tbl_system_settings` (`key`, `value`, `deskripsi`, `updated_at`) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `deskripsi` = COALESCE(VALUES(`deskripsi`), `deskripsi`), `updated_at` = NOW()",
          key,
          value,
          deskripsi ?? null
        );
      }

      // Update in-memory cache seketika
      cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    } catch (err) {
      console.error(`[SystemSettingService] Gagal menyimpan setting "${key}":`, err);
      throw err;
    }
  }

  /**
   * Menghapus cache in-memory untuk key tertentu atau seluruh cache
   */
  static invalidateCache(key?: string) {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  }

  /**
   * Helper spesifik untuk cek apakah fitur Mode Demo diizinkan aktif.
   * Prioritas:
   * 1. Setting database `ENABLE_DEMO_MODE`
   * 2. Jika belum ada di database, gunakan env `process.env.ENABLE_DEMO_MODE` (default: true)
   */
  static async isDemoModeEnabled(): Promise<boolean> {
    const envDefault = process.env.ENABLE_DEMO_MODE !== "false";
    const defaultStr = envDefault ? "true" : "false";

    // Cek database
    const rawVal = await this.getSetting("ENABLE_DEMO_MODE", defaultStr);
    const lower = rawVal.trim().toLowerCase();
    return lower === "true" || lower === "1" || lower === "on" || lower === "yes";
  }
}
