import { cookies } from "next/headers";
import type { SessionUser } from "./auth";

export type JenjangType = "SD" | "SMP" | "ALL";

export const JENJANG_COOKIE_NAME = "alazhar_active_jenjang_v2";

/**
 * Mendapatkan jenjang yang sedang aktif dilihat oleh user:
 * - Jika user adalah Guru/Admin jenjang tunggal (SD atau SMP), selalu mengembalikan jenjang tersebut.
 * - Jika user adalah Super Admin atau Guru Lintas ("ALL"), membaca preferensi dari cookie.
 *   Jika cookie belum ada atau di luar jangkauan, default ke "ALL" (Semua Jenjang).
 */
export async function getActiveJenjang(session: SessionUser | null): Promise<JenjangType> {
  if (!session) return "ALL";

  // Jika user terbatas pada SD atau SMP, tidak bisa beralih
  if (session.jenjang === "SD" || session.jenjang === "SMP") {
    return session.jenjang;
  }

  // Jika user memiliki akses ALL (Super Admin atau Guru Lintas), cek preferensi cookie
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get(JENJANG_COOKIE_NAME)?.value;
    if (cookieVal === "SD" || cookieVal === "SMP" || cookieVal === "ALL") {
      return cookieVal;
    }
  } catch {
    // Fallback jika dipanggil di luar konteks request headers
  }

  return "ALL";
}

/**
 * Helper untuk membangun Prisma where filter berdasarkan jenjang aktif.
 * Jika activeJenjang === "ALL", tidak ada batasan jenjang (return {}).
 * Jika activeJenjang === "SD" atau "SMP", filter kelas atau relasi jenjang.
 */
export function buildJenjangFilter(activeJenjang: JenjangType) {
  if (activeJenjang === "ALL") {
    return {};
  }
  return { jenjang: activeJenjang };
}
