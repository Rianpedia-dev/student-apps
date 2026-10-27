import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createViolationAction,
  deleteViolationAction,
  createAchievementAction,
} from "@/actions/guru";
import {
  formatViolationKeterangan,
  parseViolationKeterangan,
  VIOLATION_SEVERITY_CONFIG,
} from "@/lib/constants/violations";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

vi.mock("@/lib/prisma", () => ({
  default: {
    pelanggaran: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    prestasi: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Suite 7: Buku Kedisiplinan & Pencatatan Prestasi Siswa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("7.1: Pencatatan Pelanggaran & Kalkulasi Poin Kedisiplinan", () => {
    it("harus menyematkan tag tingkat keparahan dan poin penalti (RINGAN: 5, SEDANG: 15, BERAT: 30)", () => {
      expect(VIOLATION_SEVERITY_CONFIG.RINGAN.points).toBe(5);
      expect(VIOLATION_SEVERITY_CONFIG.SEDANG.points).toBe(15);
      expect(VIOLATION_SEVERITY_CONFIG.BERAT.points).toBe(30);

      const formatted = formatViolationKeterangan({
        keterangan: "Terlambat masuk kelas setelah istirahat",
        severity: "RINGAN",
        tindakan: "Teguran lisan oleh guru piket",
      });

      expect(formatted).toContain("[SEV:RINGAN]");
      expect(formatted).toContain("[PTS:5]");
      expect(formatted).toContain("[TINDAKAN:Teguran lisan oleh guru piket]");

      const parsed = parseViolationKeterangan(formatted);
      expect(parsed.severity).toBe("RINGAN");
      expect(parsed.points).toBe(5);
      expect(parsed.tindakan).toBe("Teguran lisan oleh guru piket");
      expect(parsed.cleanKeterangan).toBe("Terlambat masuk kelas setelah istirahat");
    });

    it("harus berhasil menyimpan catatan pelanggaran ke database via createViolationAction", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Ustadz Budi",
        role: "guru",
      } as any);

      vi.mocked(prisma.pelanggaran.create).mockResolvedValueOnce({
        id: BigInt(1),
        user_id: "101",
        nama: "Ahmad Santri",
        kelas: "4 Abu Bakar",
        kategori: "Kedisiplinan",
      } as any);

      const formData = new FormData();
      formData.set("user_id", "101");
      formData.set("nama", "Ahmad Santri");
      formData.set("kelas", "4 Abu Bakar");
      formData.set("kategori", "Kedisiplinan");
      formData.set("keterangan", "Lupa membawa buku panduan tilawah");
      formData.set("severity", "RINGAN");
      formData.set("points", "5");
      formData.set("tindakan", "Nasihat oleh wali kelas");

      const result = await createViolationAction(formData);

      expect(result.success).toBe(true);
      expect(prisma.pelanggaran.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: "101",
            nama: "Ahmad Santri",
            kelas: "4 Abu Bakar",
            kategori: "Kedisiplinan",
          }),
        })
      );
    });

    it("harus menolak pencatatan jika field wajib (siswa, kategori, deskripsi) tidak diisi", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Ustadz Budi",
        role: "guru",
      } as any);

      const formData = new FormData();
      formData.set("user_id", "101");
      // Kategori dan keterangan sengaja dikosongkan

      const result = await createViolationAction(formData);
      expect(result.error).toContain("Siswa, kategori, dan deskripsi pelanggaran wajib diisi");
    });
  });

  describe("7.2: Pencatatan Prestasi Siswa & Poin Keaktifan", () => {
    it("harus berhasil menambahkan catatan prestasi siswa via createAchievementAction", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Ustadz Budi",
        role: "guru",
      } as any);

      vi.mocked(prisma.prestasi.create).mockResolvedValueOnce({
        id: BigInt(7),
        id_user: "101",
        nama: "Ahmad Santri",
        prestasi: "Juara 1 Lomba Tahfidz Al-Qur'an Juz 30 Tingkat Kota",
      } as any);

      const formData = new FormData();
      formData.set("id_user", "101");
      formData.set("nama", "Ahmad Santri");
      formData.set("kelas", "4 Abu Bakar");
      formData.set("prestasi", "Juara 1 Lomba Tahfidz Al-Qur'an Juz 30 Tingkat Kota");

      const result = await createAchievementAction(formData);

      expect(result.success).toBe(true);
      expect(prisma.prestasi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id_user: "101",
            nama: "Ahmad Santri",
            prestasi: "Juara 1 Lomba Tahfidz Al-Qur'an Juz 30 Tingkat Kota",
          }),
        })
      );
    });
  });

  describe("7.3: Pembatalan / Penghapusan Catatan Pelanggaran", () => {
    it("harus berhasil menghapus catatan pelanggaran siswa dari database via deleteViolationAction", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Ustadz Budi",
        role: "guru",
      } as any);

      vi.mocked(prisma.pelanggaran.delete).mockResolvedValueOnce({
        id: BigInt(99),
        user_id: "101",
      } as any);

      const result = await deleteViolationAction("99", "101");

      expect(result.success).toBe(true);
      expect(prisma.pelanggaran.delete).toHaveBeenCalledWith({
        where: { id: BigInt(99) },
      });
    });
  });
});
