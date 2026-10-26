import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { getRoleFromStatus, resolveUserJenjang } from "./utils";
import { JENJANG_COOKIE_NAME } from "./jenjang";

const authSecret = process.env.AUTH_SECRET;
if (process.env.NODE_ENV === "production" && !authSecret) {
  console.warn(
    "[SECURITY WARNING] AUTH_SECRET tidak disetel di environment production! Segera set AUTH_SECRET di .env untuk keamanan sesi pengguna."
  );
}

const SECRET_KEY = new TextEncoder().encode(
  authSecret || "alazharsdsecretkey2026modernrebuild_at_least_32_chars_long!!"
);

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "guru" | "siswa";
  status: string;
  jenjang?: "SD" | "SMP" | "ALL";
  activeJenjang?: "SD" | "SMP" | "ALL";
  kelas?: string | null;
  nis?: string | null;
  nip?: string | null;
  appleid?: string | null;
  gender?: string | null;
  image?: string | null;
}

export type AuthResult =
  | { success: true; redirectPath: string; user: SessionUser }
  | { success: false; error: string };

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sisfo_session")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  try {
    const cookieStore = await cookies();
    cookieStore.set("sisfo_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Untuk Super Admin, pastikan preferensi tampilan awal selalu "ALL" (Semua Jenjang)
    if (user.role === "admin" && user.jenjang === "ALL") {
      cookieStore.set(JENJANG_COOKIE_NAME, "ALL", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  } catch {
    // Fallback jika dipanggil di luar konteks request (misal CLI/test script)
  }
}

export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("sisfo_session");
    cookieStore.delete(JENJANG_COOKIE_NAME);
    cookieStore.delete("alazhar_active_jenjang"); // Bersihkan legacy cookie
  } catch {
    // Fallback jika dipanggil di luar konteks request
  }
}

export async function authenticateUser(
  email: string,
  passwordPlain: string
): Promise<AuthResult> {
  let user: Awaited<ReturnType<typeof prisma.user.findUnique>> = null;

  try {
    user = await prisma.user.findUnique({
      where: { email },
    });
  } catch (dbErr) {
    console.warn("Prisma lookup failed, falling back to mock credentials if matched:", dbErr);
  }

  // Fallback demo credentials hanya jika database offline/kosong DAN demo mode aktif
  if (!user) {
    const isDemoEnabled = process.env.ENABLE_DEMO_MODE !== "false";

    if (isDemoEnabled) {
      const demoAccounts: Record<
        string,
        {
          pw: string;
          name: string;
          role: "admin" | "guru" | "siswa";
          status: string;
          jenjang: "SD" | "SMP" | "ALL";
          kelas?: string;
          gender?: string;
          nis?: string;
          nip?: string;
          guru_bidang?: string;
        }
      > = {
        // Admin
        "superadmin@gmail.com": {
          pw: "admin123",
          name: "Super Administrator",
          role: "admin",
          status: "3",
          jenjang: "ALL",
          gender: "L",
        },
        "admin.sd@gmail.com": {
          pw: "admin123",
          name: "Admin SD Al-Azhar",
          role: "admin",
          status: "3",
          jenjang: "SD",
          gender: "L",
        },
        "admin.smp@gmail.com": {
          pw: "admin123",
          name: "Admin SMP Al-Azhar",
          role: "admin",
          status: "3",
          jenjang: "SMP",
          gender: "L",
        },

        // Guru SD
        "guru.sd@gmail.com": {
          pw: "guru123",
          name: "Ustadzah Nurul, S.Pd",
          role: "guru",
          status: "2",
          jenjang: "SD",
          gender: "P",
          nip: "198902142013012003",
          guru_bidang: "Tematik & IPAS",
        },
        "walas.sd@gmail.com": {
          pw: "guru123",
          name: "Ustadzah Fatimah, S.Pd",
          role: "guru",
          status: "4",
          jenjang: "SD",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "P",
          nip: "198501152010012001",
          guru_bidang: "Pendidikan Agama Islam",
        },

        // Guru SMP
        "guru.smp@gmail.com": {
          pw: "guru123",
          name: "Ustadz Wildan, M.Pd",
          role: "guru",
          status: "2",
          jenjang: "SMP",
          gender: "L",
          nip: "198604182012011002",
          guru_bidang: "Matematika SMP",
        },
        "walas.smp@gmail.com": {
          pw: "guru123",
          name: "Ustadz Farhan, S.Pd",
          role: "guru",
          status: "4",
          jenjang: "SMP",
          kelas: "Kelas 7 - Ibnu Sina",
          gender: "L",
          nip: "198703122011011005",
          guru_bidang: "Bahasa Inggris SMP",
        },

        // Guru Lintas Jenjang
        "guru.lintas@gmail.com": {
          pw: "guru123",
          name: "Ustadz Ahmad, S.Pd.I",
          role: "guru",
          status: "2",
          jenjang: "ALL",
          gender: "L",
          nip: "198603202011011002",
          guru_bidang: "Bahasa Arab (SD & SMP)",
        },

        // Siswa
        "siswa.sd@gmail.com": {
          pw: "siswa123",
          name: "Muhammad Rayhan Al-Fatih",
          role: "siswa",
          status: "1",
          jenjang: "SD",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "L",
          nis: "202404001",
        },
        "siswa.smp@gmail.com": {
          pw: "siswa123",
          name: "Haidar Ali SMP",
          role: "siswa",
          status: "1",
          jenjang: "SMP",
          kelas: "Kelas 7 - Ibnu Sina",
          gender: "L",
          nis: "202407001",
        },

        // Legacy Aliases
        "admin@gmail.com": {
          pw: "admin123",
          name: "Administrator SDIA",
          role: "admin",
          status: "3",
          jenjang: "ALL",
          gender: "L",
        },
        "guru@gmail.com": {
          pw: "guru123",
          name: "Ustadzah Fatimah, S.Pd",
          role: "guru",
          status: "4",
          jenjang: "SD",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "P",
          nip: "198501152010012001",
        },
        "guru1@gmail.com": {
          pw: "guru123",
          name: "Ustadzah Fatimah, S.Pd",
          role: "guru",
          status: "4",
          jenjang: "SD",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "P",
          nip: "198501152010012001",
        },
        "guru2@gmail.com": {
          pw: "guru123",
          name: "Ustadz Farhan, S.Pd",
          role: "guru",
          status: "4",
          jenjang: "SMP",
          kelas: "Kelas 7 - Ibnu Sina",
          gender: "L",
          nip: "198703122011011005",
        },
        "siswa@gmail.com": {
          pw: "siswa123",
          name: "Muhammad Rayhan Al-Fatih",
          role: "siswa",
          status: "1",
          jenjang: "SD",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "L",
          nis: "202404001",
        },
        "siswa1@gmail.com": {
          pw: "siswa123",
          name: "Muhammad Rayhan",
          role: "siswa",
          status: "1",
          jenjang: "SD",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "L",
          nis: "202404001",
        },
        "siswa2@gmail.com": {
          pw: "siswa123",
          name: "Khalid Al-Ghazi",
          role: "siswa",
          status: "1",
          jenjang: "SD",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "L",
          nis: "202404002",
        },
        "siswa3@gmail.com": {
          pw: "siswa123",
          name: "Zahra Salsabila",
          role: "siswa",
          status: "1",
          jenjang: "SD",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "P",
          nis: "202404003",
        },
      };

      const demo = demoAccounts[email.toLowerCase().trim()];
      if (demo && demo.pw === passwordPlain) {
        try {
          const hash = await bcrypt.hash(demo.pw, 10);
          user = await prisma.user.create({
            data: {
              name: demo.name,
              email: email.toLowerCase().trim(),
              password: hash,
              password1: demo.pw,
              status: demo.status,
              jenjang: demo.jenjang || "SD",
              kelas: demo.kelas || null,
              gender: demo.gender || "L",
              nis: demo.nis || null,
              nip: demo.nip || null,
              guru_bidang: demo.guru_bidang || null,
            },
          });
        } catch (createErr) {
          console.warn("[Demo Login DB Warning] Gagal menyimpan user ke DB, menggunakan fallback sesi demo:", createErr);
          user = {
            id: BigInt(999999),
            name: demo.name,
            email: email.toLowerCase().trim(),
            password: "",
            password1: demo.pw,
            status: demo.status,
            jenjang: demo.jenjang || "SD",
            kelas: demo.kelas || null,
            gender: demo.gender || "L",
            nis: demo.nis || null,
            nip: demo.nip || null,
            guru_bidang: demo.guru_bidang || null,
            appleid: null,
            email_verified_at: null,
            passwordappleid: null,
            ctt_iPad: null,
            image: null,
            address: null,
            notes: null,
            skills: null,
            point: null,
            remember_token: null,
            created_at: new Date(),
            updated_at: new Date(),
          } as any;
        }
      }
    }

    if (!user) {
      return { success: false, error: "Email atau password salah." };
    }
  }

  // Cek verifikasi status: jika status 0 -> ditolak
  if (user.status === "0") {
    return {
      success: false,
      error: "Akun Anda belum diverifikasi oleh Administrator. Silakan hubungi admin sekolah.",
    };
  }

  // Verifikasi password (bcrypt or legacy password1)
  let isMatch = false;
  try {
    isMatch = await bcrypt.compare(passwordPlain, user.password);
  } catch {
    isMatch = false;
  }

  if (!isMatch && user.password1 && user.password1 === passwordPlain) {
    isMatch = true;
  }

  // Also check default passwords for seeded accounts if password hash differs and demo mode is allowed
  if (!isMatch && process.env.ENABLE_DEMO_MODE !== "false") {
    const demoPwList: Record<string, string> = {
      "superadmin@gmail.com": "admin123",
      "admin.sd@gmail.com": "admin123",
      "admin.smp@gmail.com": "admin123",
      "admin@gmail.com": "admin123",
      "guru.sd@gmail.com": "guru123",
      "walas.sd@gmail.com": "guru123",
      "guru.smp@gmail.com": "guru123",
      "walas.smp@gmail.com": "guru123",
      "guru.lintas@gmail.com": "guru123",
      "guru@gmail.com": "guru123",
      "guru1@gmail.com": "guru123",
      "guru2@gmail.com": "guru123",
      "siswa.sd@gmail.com": "siswa123",
      "siswa.smp@gmail.com": "siswa123",
      "siswa@gmail.com": "siswa123",
      "siswa1@gmail.com": "siswa123",
      "siswa2@gmail.com": "siswa123",
      "siswa3@gmail.com": "siswa123",
    };
    if (demoPwList[email.toLowerCase().trim()] === passwordPlain) {
      isMatch = true;
    }
  }

  if (!isMatch) {
    return { success: false, error: "Email atau password salah." };
  }

  const role = getRoleFromStatus(user.status);
  if (role === "unverified") {
    return {
      success: false,
      error: "Status akun tidak memiliki izin akses sistem.",
    };
  }

  const resolvedJenjang = resolveUserJenjang(user.jenjang, user.status, user.kelas);

  const sessionUser: SessionUser = {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    role,
    status: user.status,
    jenjang: resolvedJenjang,
    activeJenjang: resolvedJenjang,
    kelas: user.kelas || null,
    nis: user.nis,
    nip: user.nip,
    appleid: user.appleid,
    gender: user.gender || null,
    image: user.image,
  };

  await setSessionCookie(sessionUser);

  let redirectPath = "/login";
  if (role === "admin") redirectPath = "/admin";
  else if (role === "guru") redirectPath = "/guru";
  else if (role === "siswa") redirectPath = "/siswa";

  return { success: true, redirectPath, user: sessionUser };
}

export type DemoRole =
  | "superadmin"
  | "admin_sd"
  | "admin_smp"
  | "guru_sd"
  | "walas_sd"
  | "guru_smp"
  | "walas_smp"
  | "guru_lintas"
  | "siswa_sd"
  | "siswa_smp"
  // Legacy aliases
  | "admin"
  | "guru"
  | "guru1"
  | "guru2"
  | "siswa"
  | "siswa1"
  | "siswa2"
  | "siswa3";

export async function loginAsDemoRole(
  role: DemoRole
): Promise<AuthResult> {
  if (process.env.ENABLE_DEMO_MODE === "false") {
    return {
      success: false,
      error: "Demo login dinonaktifkan oleh administrator.",
    };
  }

  const credentials: Record<DemoRole, { email: string; pw: string }> = {
    superadmin:   { email: "superadmin@gmail.com",  pw: "admin123" },
    admin_sd:     { email: "admin.sd@gmail.com",    pw: "admin123" },
    admin_smp:    { email: "admin.smp@gmail.com",   pw: "admin123" },
    guru_sd:      { email: "guru.sd@gmail.com",     pw: "guru123" },
    walas_sd:     { email: "walas.sd@gmail.com",     pw: "guru123" },
    guru_smp:     { email: "guru.smp@gmail.com",    pw: "guru123" },
    walas_smp:    { email: "walas.smp@gmail.com",    pw: "guru123" },
    guru_lintas:  { email: "guru.lintas@gmail.com",  pw: "guru123" },
    siswa_sd:     { email: "siswa.sd@gmail.com",    pw: "siswa123" },
    siswa_smp:    { email: "siswa.smp@gmail.com",   pw: "siswa123" },
    // Legacy fallbacks
    admin:        { email: "superadmin@gmail.com",  pw: "admin123" },
    guru:         { email: "walas.sd@gmail.com",     pw: "guru123" },
    guru1:        { email: "walas.sd@gmail.com",     pw: "guru123" },
    guru2:        { email: "walas.smp@gmail.com",    pw: "guru123" },
    siswa:        { email: "siswa.sd@gmail.com",    pw: "siswa123" },
    siswa1:       { email: "siswa.sd@gmail.com",    pw: "siswa123" },
    siswa2:       { email: "siswa.sd@gmail.com",    pw: "siswa123" },
    siswa3:       { email: "siswa.sd@gmail.com",    pw: "siswa123" },
  };

  const cred = credentials[role] || credentials.superadmin;
  return authenticateUser(cred.email, cred.pw);
}
