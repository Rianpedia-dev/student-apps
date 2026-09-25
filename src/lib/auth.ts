import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { getRoleFromStatus } from "./utils";

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
  const cookieStore = await cookies();
  cookieStore.set("sisfo_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("sisfo_session");
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
    const isDemoEnabled =
      process.env.ENABLE_DEMO_MODE === "true" || process.env.NODE_ENV !== "production";

    if (isDemoEnabled) {
      const demoAccounts: Record<
        string,
        {
          pw: string;
          name: string;
          role: "admin" | "guru" | "siswa";
          status: string;
          kelas?: string;
          gender?: string;
          nis?: string;
          nip?: string;
        }
      > = {
        "admin@gmail.com": {
          pw: "admin123",
          name: "Administrator SDIA",
          role: "admin",
          status: "3",
          gender: "L",
        },
        "guru@gmail.com": {
          pw: "guru123",
          name: "Ustadzah Fatimah, S.Pd",
          role: "guru",
          status: "4",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "P",
          nip: "198501152010012001",
        },
        "siswa@gmail.com": {
          pw: "siswa123",
          name: "Muhammad Rayhan Al-Fatih",
          role: "siswa",
          status: "1",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "L",
          nis: "202404001",
        },
        "siswa1@gmail.com": {
          pw: "siswa123",
          name: "Muhammad Rayhan",
          role: "siswa",
          status: "1",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "L",
          nis: "202404001",
        },
        "siswa2@gmail.com": {
          pw: "siswa123",
          name: "Khalid Al-Ghazi",
          role: "siswa",
          status: "1",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "L",
          nis: "202404002",
        },
        "siswa3@gmail.com": {
          pw: "siswa123",
          name: "Zahra Salsabila",
          role: "siswa",
          status: "1",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          gender: "P",
          nis: "202404003",
        },
      };

      const demo = demoAccounts[email.toLowerCase().trim()];
      if (demo && demo.pw === passwordPlain) {
        const hash = await bcrypt.hash(demo.pw, 10);
        user = await prisma.user.create({
          data: {
            name: demo.name,
            email: email.toLowerCase().trim(),
            password: hash,
            password1: demo.pw,
            status: demo.status,
            kelas: demo.kelas || null,
            gender: demo.gender || "L",
            nis: demo.nis || null,
            nip: demo.nip || null,
          },
        });
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
  if (!isMatch && (process.env.ENABLE_DEMO_MODE === "true" || process.env.NODE_ENV !== "production")) {
    if (email === "admin@gmail.com" && passwordPlain === "admin123") isMatch = true;
    if (email === "guru@gmail.com" && passwordPlain === "guru123") isMatch = true;
    if (email === "siswa@gmail.com" && passwordPlain === "siswa123") isMatch = true;
    if (email === "siswa1@gmail.com" && passwordPlain === "siswa123") isMatch = true;
    if (email === "siswa2@gmail.com" && passwordPlain === "siswa123") isMatch = true;
    if (email === "siswa3@gmail.com" && passwordPlain === "siswa123") isMatch = true;
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

  const sessionUser: SessionUser = {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    role,
    status: user.status,
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

export type DemoRole = "admin" | "guru" | "siswa" | "siswa1" | "siswa2" | "siswa3";

export async function loginAsDemoRole(
  role: DemoRole
): Promise<AuthResult> {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_MODE !== "true") {
    return {
      success: false,
      error: "Demo login dinonaktifkan di lingkungan produksi. Silakan login menggunakan akun terdaftar.",
    };
  }

  const credentials: Record<string, { email: string; pw: string }> = {
    admin: { email: "admin@gmail.com", pw: "admin123" },
    guru: { email: "guru@gmail.com", pw: "guru123" },
    siswa: { email: "siswa1@gmail.com", pw: "siswa123" },
    siswa1: { email: "siswa1@gmail.com", pw: "siswa123" },
    siswa2: { email: "siswa2@gmail.com", pw: "siswa123" },
    siswa3: { email: "siswa3@gmail.com", pw: "siswa123" },
  };
  const cred = credentials[role] || credentials.siswa;
  return authenticateUser(cred.email, cred.pw);
}

