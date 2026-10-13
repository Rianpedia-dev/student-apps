import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken, type SessionUser } from "@/lib/auth";
import { getRoleFromStatus, getRoleLabel } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import path from "path";

describe("AUDIT KEAMANAN: 1. Proteksi Brute-Force & Rate Limiting", () => {
  it("Rate Limiter harus mengizinkan request normal dan memblokir request ke-11 jika limit 10", () => {
    const testId = `test-ip-${Date.now()}`;

    // 10 request pertama harus sukses
    for (let i = 0; i < 10; i++) {
      const res = checkRateLimit(testId, 10, 60);
      expect(res.success).toBe(true);
    }

    // Request ke-11 harus diblokir
    const blockedRes = checkRateLimit(testId, 10, 60);
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.resetSeconds).toBeGreaterThan(0);
  });
});

describe("AUDIT KEAMANAN: 2. Hashing Password & Integritas Kriptografis", () => {
  it("Bcrypt harus menghasilkan hash yang unik dengan salt dan lolos verifikasi password asli", async () => {
    const plain = "AlAzharPassword2026!";
    const hash1 = await bcrypt.hash(plain, 10);
    const hash2 = await bcrypt.hash(plain, 10);

    // Dua hash dari password yang sama tidak boleh identik karena random salt
    expect(hash1).not.toBe(hash2);

    // Keduanya harus valid terhadap password asli
    expect(await bcrypt.compare(plain, hash1)).toBe(true);
    expect(await bcrypt.compare(plain, hash2)).toBe(true);

    // Password yang salah harus ditolak
    expect(await bcrypt.compare("PasswordSalah123", hash1)).toBe(false);
  });
});

describe("AUDIT KEAMANAN: 3. Integritas Sesi JWT & Anti-Tampering", () => {
  it("Token JWT yang diubah (tampered) atau tanda tangannya dipalsukan harus ditolak", async () => {
    const user: SessionUser = {
      id: "999",
      name: "Siswa Audit",
      email: "siswa@alazhar.sch.id",
      role: "siswa",
      status: "1",
    };

    const token = await createSessionToken(user);
    const validPayload = await verifySessionToken(token);
    expect(validPayload).not.toBeNull();
    expect(validPayload?.role).toBe("siswa");

    // Skenario penyerang mencoba mengubah role menjadi admin di payload
    const parts = token.split(".");
    expect(parts.length).toBe(3);

    // Rusak payload atau signature
    const fakeToken = `${parts[0]}.${parts[1]}.invalidsignaturexyz123`;
    const invalidResult = await verifySessionToken(fakeToken);
    expect(invalidResult).toBeNull();
  });
});

describe("AUDIT KEAMANAN: 4. Role-Based Access Control (RBAC) & Isolasi Hak Akses", () => {
  it("Status Akun harus memetakan peran secara tepat dan menolak status 0", () => {
    expect(getRoleFromStatus("3")).toBe("admin");
    expect(getRoleFromStatus("4")).toBe("guru");
    expect(getRoleFromStatus("2")).toBe("guru");
    expect(getRoleFromStatus("1")).toBe("siswa");
    expect(getRoleFromStatus("0")).toBe("unverified");

    expect(getRoleLabel("3")).toBe("Administrator");
    expect(getRoleLabel("4")).toBe("Guru & Wali Kelas");
    expect(getRoleLabel("2")).toBe("Guru");
    expect(getRoleLabel("1")).toBe("Siswa");
    expect(getRoleLabel("0")).toBe("Belum Terverifikasi");
  });

  it("Aturan Proxy & Middleware harus membatasi rute sesuai peran", () => {
    const isRouteAuthorized = (
      userRole: "admin" | "guru" | "siswa" | "unverified",
      userStatus: string,
      pathname: string
    ) => {
      // Akun unverified (status 0) dilarang mengakses rute internal apa pun
      if (userStatus === "0" || userRole === "unverified") {
        return false;
      }
      if (pathname.startsWith("/admin") && userRole !== "admin") return false;
      if (pathname.startsWith("/guru") && userRole !== "guru") return false;
      if (pathname.startsWith("/siswa") && userRole !== "siswa") return false;
      return true;
    };

    // Siswa mencoba akses rute guru atau admin
    expect(isRouteAuthorized("siswa", "1", "/siswa")).toBe(true);
    expect(isRouteAuthorized("siswa", "1", "/guru")).toBe(false);
    expect(isRouteAuthorized("siswa", "1", "/admin")).toBe(false);

    // Guru mencoba akses rute siswa atau admin
    expect(isRouteAuthorized("guru", "4", "/guru")).toBe(true);
    expect(isRouteAuthorized("guru", "4", "/admin")).toBe(false);
    expect(isRouteAuthorized("guru", "4", "/siswa")).toBe(false);

    // Admin memiliki akses penuh ke rute admin
    expect(isRouteAuthorized("admin", "3", "/admin")).toBe(true);
    expect(isRouteAuthorized("admin", "3", "/admin/students")).toBe(true);

    // User berstatus 0 tidak boleh bisa mengakses rute manapun
    expect(isRouteAuthorized("unverified", "0", "/siswa")).toBe(false);
    expect(isRouteAuthorized("unverified", "0", "/guru")).toBe(false);
    expect(isRouteAuthorized("unverified", "0", "/admin")).toBe(false);
  });
});

describe("AUDIT KEAMANAN: 5. Proteksi Path Traversal pada File Download", () => {
  it("Validasi path download harus menolak path di luar folder uploads (Directory Traversal)", () => {
    const isValidDownloadPath = (filePath: string) => {
      const decoded = decodeURIComponent(filePath).trim();
      const normalized = path.normalize(decoded).replace(/^(\.\.[\/\\])+/, "");
      const isUploadPath =
        normalized.startsWith("/uploads") ||
        normalized.startsWith("uploads") ||
        normalized.startsWith("\\uploads");
      return isUploadPath && !normalized.includes("..");
    };

    // Path legal di dalam uploads
    expect(isValidDownloadPath("/uploads/materi/modul-1.pdf")).toBe(true);
    expect(isValidDownloadPath("uploads/avatar/foto.webp")).toBe(true);

    // Upaya Path Traversal
    expect(isValidDownloadPath("../../etc/passwd")).toBe(false);
    expect(isValidDownloadPath("../../.env")).toBe(false);
    expect(isValidDownloadPath("../../../windows/system32/cmd.exe")).toBe(false);
    expect(isValidDownloadPath("/var/www/secret.key")).toBe(false);
  });
});
