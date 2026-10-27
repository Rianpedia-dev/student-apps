import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  authenticateUser,
  createSessionToken,
  verifySessionToken,
  type SessionUser,
} from "@/lib/auth";
import { requireAdminAccess, requireSuperAdmin, requireGuruAccess } from "@/lib/auth-guard";
import { getActiveJenjang, buildJenjangFilter } from "@/lib/jenjang";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Mocking prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mocking next/headers cookies
const mockCookieMap = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: vi.fn((name: string) => {
      const val = mockCookieMap.get(name);
      return val ? { value: val } : undefined;
    }),
    set: vi.fn((name: string, value: string) => mockCookieMap.set(name, value)),
    delete: vi.fn((name: string) => mockCookieMap.delete(name)),
  })),
}));

describe("Suite 1: Autentikasi, Sesi & Isolasi Multi-Jenjang RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieMap.clear();
    delete process.env.ENABLE_DEMO_MODE;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("1.1 Status Akun & Verifikasi", () => {
    it("harus menolak akun berstatus '0' (belum diverifikasi admin)", async () => {
      const hashed = await bcrypt.hash("rahasia123", 10);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: BigInt(1001),
        name: "Siswa Belum Diverifikasi",
        email: "pending@alazhar.sch.id",
        password: hashed,
        status: "0",
        jenjang: "SD",
      });

      const res = await authenticateUser("pending@alazhar.sch.id", "rahasia123");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("belum diverifikasi oleh Administrator");
      }
    });
  });

  describe("1.2 Isolasi Multi-Jenjang RBAC (SD vs SMP)", () => {
    it("Admin SD tidak boleh mengakses resource jenjang SMP", async () => {
      const adminSDSession: SessionUser = {
        id: "101",
        name: "Admin SD Al-Azhar",
        email: "admin.sd@alazhar.sch.id",
        role: "admin",
        status: "3",
        jenjang: "SD",
      };

      const token = await createSessionToken(adminSDSession);
      mockCookieMap.set("sisfo_session", token);

      // Mengakses SD -> Berhasil
      await expect(requireAdminAccess("SD")).resolves.toMatchObject({ jenjang: "SD" });

      // Mengakses SMP -> Ditolak
      await expect(requireAdminAccess("SMP")).rejects.toThrow("tidak memiliki akses ke data jenjang SMP");
    });

    it("Super Admin ('ALL') dapat mengakses resource jenjang SD maupun SMP", async () => {
      const superAdminSession: SessionUser = {
        id: "1",
        name: "Super Administrator",
        email: "superadmin@gmail.com",
        role: "admin",
        status: "3",
        jenjang: "ALL",
      };

      const token = await createSessionToken(superAdminSession);
      mockCookieMap.set("sisfo_session", token);

      await expect(requireAdminAccess("SD")).resolves.toMatchObject({ jenjang: "ALL" });
      await expect(requireAdminAccess("SMP")).resolves.toMatchObject({ jenjang: "ALL" });
      await expect(requireSuperAdmin()).resolves.toMatchObject({ role: "admin" });
    });

    it("Admin biasa bukan Super Admin ditolak saat memanggil requireSuperAdmin", async () => {
      const normalAdminSession: SessionUser = {
        id: "102",
        name: "Admin SMP",
        email: "admin.smp@alazhar.sch.id",
        role: "admin",
        status: "3",
        jenjang: "SMP",
      };

      const token = await createSessionToken(normalAdminSession);
      mockCookieMap.set("sisfo_session", token);

      await expect(requireSuperAdmin()).rejects.toThrow("Hanya Super Admin yang dapat mengakses fitur ini");
    });
  });

  describe("1.3 Switch Active Jenjang & Prisma Filter Helper", () => {
    it("Super Admin dapat mengganti activeJenjang melalui cookie preferensi", async () => {
      const superSession: SessionUser = {
        id: "1",
        name: "Super Admin",
        email: "superadmin@alazhar.sch.id",
        role: "admin",
        status: "3",
        jenjang: "ALL",
      };

      // Default tanpa cookie -> ALL
      expect(await getActiveJenjang(superSession)).toBe("ALL");
      expect(buildJenjangFilter("ALL")).toEqual({});

      // Set cookie ke SD
      mockCookieMap.set("alazhar_active_jenjang_v2", "SD");
      expect(await getActiveJenjang(superSession)).toBe("SD");
      expect(buildJenjangFilter("SD")).toEqual({ jenjang: "SD" });

      // Set cookie ke SMP
      mockCookieMap.set("alazhar_active_jenjang_v2", "SMP");
      expect(await getActiveJenjang(superSession)).toBe("SMP");
      expect(buildJenjangFilter("SMP")).toEqual({ jenjang: "SMP" });
    });

    it("Guru atau Siswa jenjang tunggal tidak terpengaruh oleh cookie luar", async () => {
      const guruSD: SessionUser = {
        id: "201",
        name: "Guru SD",
        email: "guru.sd@alazhar.sch.id",
        role: "guru",
        status: "2",
        jenjang: "SD",
      };

      mockCookieMap.set("alazhar_active_jenjang_v2", "SMP");
      // Harus tetap SD karena jenjang akun terbatas ke SD
      expect(await getActiveJenjang(guruSD)).toBe("SD");
    });
  });

  describe("1.4 Integritas Kriptografis Token Sesi & Tampering Guard", () => {
    it("harus menolak token sesi yang dimodifikasi (tampered payload/signature)", async () => {
      const validUser: SessionUser = {
        id: "99",
        name: "Test User",
        email: "user@alazhar.sch.id",
        role: "siswa",
        status: "1",
        jenjang: "SD",
      };

      const validToken = await createSessionToken(validUser);
      const verified = await verifySessionToken(validToken);
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe("99");

      // Modifikasi payload token
      const parts = validToken.split(".");
      const tamperedToken = `${parts[0]}.${parts[1]}xyz.${parts[2]}`;
      const failedVerify = await verifySessionToken(tamperedToken);
      expect(failedVerify).toBeNull();
    });
  });

  describe("1.5 Transparent Lazy Migration Password Legacy", () => {
    it("harus memverifikasi legacy password1 dan otomatis meng-upgrade hash bcrypt serta mengosongkan password1", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: BigInt(555),
        name: "User Legacy",
        email: "legacy@alazhar.sch.id",
        password: "old-md5-or-plain",
        password1: "passwordLama123",
        status: "1",
        jenjang: "SD",
      });

      (prisma.user.update as any).mockResolvedValue({ id: BigInt(555) });

      const res = await authenticateUser("legacy@alazhar.sch.id", "passwordLama123");
      expect(res.success).toBe(true);

      // Verifikasi bahwa prisma.user.update dipanggil untuk migrasi bcrypt
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: BigInt(555) },
        data: expect.objectContaining({
          password1: null,
          password: expect.any(String),
        }),
      });
    });
  });

  describe("1.6 Production Demo Mode Guard", () => {
    it("harus menolak demo login fallback di production jika ENABLE_DEMO_MODE bukan 'true'", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ENABLE_DEMO_MODE", "false");

      (prisma.user.findUnique as any).mockResolvedValue(null);

      const res = await authenticateUser("siswa.sd@gmail.com", "siswa123");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("Email atau password salah.");
      }
    });
  });
});
