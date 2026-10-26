import { getSession, type SessionUser } from "./auth";

/**
 * Guard untuk memastikan pengguna adalah Admin dan memiliki akses ke jenjang yang diminta.
 * Super Admin (jenjang === "ALL") selalu memiliki akses.
 */
export async function requireAdminAccess(requiredJenjang?: "SD" | "SMP"): Promise<SessionUser> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized: Hanya admin yang dapat mengakses fitur ini.");
  }

  if (requiredJenjang && session.jenjang !== "ALL" && session.jenjang !== requiredJenjang) {
    throw new Error(`Unauthorized: Anda tidak memiliki akses ke data jenjang ${requiredJenjang}.`);
  }

  return session;
}

/**
 * Guard untuk memastikan pengguna adalah Super Admin (role === "admin" dan jenjang === "ALL").
 */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || session.role !== "admin" || session.jenjang !== "ALL") {
    throw new Error("Unauthorized: Hanya Super Admin yang dapat mengakses fitur ini.");
  }
  return session;
}

/**
 * Guard untuk memastikan pengguna adalah Guru yang sah.
 */
export async function requireGuruAccess(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    throw new Error("Unauthorized: Hanya guru yang dapat mengakses fitur ini.");
  }
  return session;
}
