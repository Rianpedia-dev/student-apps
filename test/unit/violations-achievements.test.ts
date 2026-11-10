import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createViolationAction,
  deleteViolationAction,
  createAchievementAction,
} from "@/actions/guru";
import { AchievementService } from "@/services/achievement.service";
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
      findUnique: vi.fn(),
    },
    prestasi: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    tahunAjar: {
      findFirst: vi.fn(),
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
        status: "4",
        kelas: "4 Abu Bakar",
      } as any);

      vi.mocked(prisma.pelanggaran.create).mockResolvedValueOnce({
        id: BigInt(1),
        user_id: "101",
        nama: "Ahmad Siswa",
        kelas: "4 Abu Bakar",
        kategori: "Kedisiplinan",
      } as any);

      const formData = new FormData();
      formData.set("user_id", "101");
      formData.set("nama", "Ahmad Siswa");
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
            nama: "Ahmad Siswa",
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
        status: "4",
        kelas: "4 Abu Bakar",
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
        status: "4",
        kelas: "4 Abu Bakar",
      } as any);

      vi.mocked(prisma.prestasi.create).mockResolvedValueOnce({
        id: BigInt(7),
        id_user: "101",
        nama: "Ahmad Siswa",
        prestasi: "Juara 1 Lomba Tahfidz Al-Qur'an Juz 30 Tingkat Kota",
      } as any);

      const formData = new FormData();
      formData.set("id_user", "101");
      formData.set("nama", "Ahmad Siswa");
      formData.set("kelas", "4 Abu Bakar");
      formData.set("prestasi", "Juara 1 Lomba Tahfidz Al-Qur'an Juz 30 Tingkat Kota");

      const result = await createAchievementAction(formData);

      expect(result.success).toBe(true);
      expect(prisma.prestasi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id_user: "101",
            nama: "Ahmad Siswa",
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
        status: "4",
        kelas: "4 Abu Bakar",
      } as any);

      vi.mocked(prisma.pelanggaran.findUnique).mockResolvedValueOnce({
        id: BigInt(99),
        guru_id: BigInt(202),
        guru_nama: "Ustadz Budi",
        user_id: "101",
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

  describe("7.4: Leaderboard Papan Peringkat Prestasi Siswa", () => {
    it("harus menyajikan siswa berpoin pada leaderboard default dan menyertakan seluruh siswa (allStudents) untuk pencarian 0 poin", async () => {
      vi.mocked(prisma.prestasi.findMany).mockResolvedValueOnce([
        {
          id: BigInt(1),
          id_user: "101",
          nama: "Kaneishia",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          tingkat: "Nasional",
          peringkat: "Juara 1",
          poin: 12,
          fotoanak: "/uploads/cert1.png",
          prestasi: "Juara 1 Olimpiade Sains",
          jenjang: "SD",
          created_at: new Date(),
        },
        {
          id: BigInt(2),
          id_user: "102",
          nama: "Zahra",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          tingkat: "Daerah/Kota",
          peringkat: "Juara 1",
          poin: 6,
          fotoanak: "/uploads/cert2.png",
          prestasi: "Juara 1 MHQ",
          jenjang: "SD",
          created_at: new Date(),
        },
      ] as any);

      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
        {
          id: BigInt(101),
          name: "Kaneishia",
          image: "/images/kaneishia.png",
          gender: "P",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          jenjang: "SD",
        },
        {
          id: BigInt(102),
          name: "Zahra",
          image: "/images/zahra.png",
          gender: "P",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          jenjang: "SD",
        },
        {
          id: BigInt(103),
          name: "Budi Siswa Nol Poin",
          image: null,
          gender: "L",
          kelas: "Kelas 4 - Mehmed Al Fatih",
          jenjang: "SD",
        },
      ] as any);

      const result = await AchievementService.getLeaderboard({ jenjang: "SD" });

      expect(result.entries.length).toBe(2);
      expect(result.entries[0].userName).toBe("Kaneishia");
      expect(result.entries[0].totalPoints).toBe(12);
      expect(result.entries[0].rank).toBe(1);

      expect(result.entries[1].userName).toBe("Zahra");
      expect(result.entries[1].totalPoints).toBe(6);
      expect(result.entries[1].rank).toBe(2);

      // Pastikan allStudents berisi seluruh siswa aktif (termasuk yang 0 poin)
      expect(result.allStudents.length).toBe(3);
      expect(result.allStudents.some((s) => s.name === "Budi Siswa Nol Poin")).toBe(true);
    });
  });
});
