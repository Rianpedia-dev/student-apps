import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubjectService } from "@/services/subject.service";
import { ClassService } from "@/services/class.service";
import { compareScheduleTime, parseTimeToMinutes } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { AppCache } from "@/lib/cache";
import * as XLSX from "xlsx";

vi.mock("@/lib/prisma", () => ({
  default: {
    mataPelajaran: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    jadwalPelajaran: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    kelas: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    restrict: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Suite 2: Master Akademik & Logika Bentrok Jadwal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AppCache.clear();
  });

  describe("2.1: Pengurutan Kronologis Jadwal Pelajaran", () => {
    it("harus mengurutkan jadwal berdasarkan hari (Senin -> Sabtu) dan jam mulai", () => {
      const unsorted = [
        { hari: "Kamis", jam_mulai: "08:00", jam_selesai: "09:30" },
        { hari: "Senin", jam_mulai: "10:00", jam_selesai: "11:30" },
        { hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00" },
        { hari: "Rabu", jam_mulai: "07:30", jam_selesai: "09:00" },
        { hari: "Selasa", jam_mulai: "09:00", jam_selesai: "10:30" },
      ];

      const sorted = [...unsorted].sort((a, b) =>
        compareScheduleTime(a.hari, a.jam_mulai, a.jam_selesai, b.hari, b.jam_mulai, b.jam_selesai)
      );

      expect(sorted[0]).toEqual({ hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00" });
      expect(sorted[1]).toEqual({ hari: "Senin", jam_mulai: "10:00", jam_selesai: "11:30" });
      expect(sorted[2].hari).toBe("Selasa");
      expect(sorted[3].hari).toBe("Rabu");
      expect(sorted[4].hari).toBe("Kamis");
    });
  });

  describe("2.2: Deteksi Bentrok Jadwal Guru (Teacher Conflict Prevention)", () => {
    const isConflict = (
      slotA: { hari: string; jam_mulai: string; jam_selesai: string },
      slotB: { hari: string; jam_mulai: string; jam_selesai: string }
    ) => {
      if (slotA.hari.trim().toLowerCase() !== slotB.hari.trim().toLowerCase()) return false;
      const startA = parseTimeToMinutes(slotA.jam_mulai);
      const endA = parseTimeToMinutes(slotA.jam_selesai);
      const startB = parseTimeToMinutes(slotB.jam_mulai);
      const endB = parseTimeToMinutes(slotB.jam_selesai);

      // Overlap terjadi jika rentang saling memotong
      return startA < endB && endA > startB;
    };

    it("harus mendeteksi bentrok ketika guru yang sama dijadwalkan di dua kelas pada jam tumpang tindih", () => {
      const existingSlot = { hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00", kelas: "4 Abu Bakar" };
      const newSlotConflict = { hari: "Senin", jam_mulai: "08:30", jam_selesai: "10:00", kelas: "4 Umar" };
      const newSlotNoConflict = { hari: "Senin", jam_mulai: "09:00", jam_selesai: "10:30", kelas: "4 Umar" };

      expect(isConflict(existingSlot, newSlotConflict)).toBe(true);
      expect(isConflict(existingSlot, newSlotNoConflict)).toBe(false);
    });

    it("tidak boleh bentrok jika hari berbeda meskipun jamnya sama persis", () => {
      const slotSenin = { hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00" };
      const slotSelasa = { hari: "Selasa", jam_mulai: "07:30", jam_selesai: "09:00" };

      expect(isConflict(slotSenin, slotSelasa)).toBe(false);
    });
  });

  describe("2.3: Deteksi Bentrok Jadwal Rombel Kelas", () => {
    const isClassConflict = (
      slotA: { kelasId: string; hari: string; jam_mulai: string; jam_selesai: string },
      slotB: { kelasId: string; hari: string; jam_mulai: string; jam_selesai: string }
    ) => {
      if (slotA.kelasId !== slotB.kelasId) return false;
      if (slotA.hari.trim().toLowerCase() !== slotB.hari.trim().toLowerCase()) return false;
      const startA = parseTimeToMinutes(slotA.jam_mulai);
      const endA = parseTimeToMinutes(slotA.jam_selesai);
      const startB = parseTimeToMinutes(slotB.jam_mulai);
      const endB = parseTimeToMinutes(slotB.jam_selesai);

      return startA < endB && endA > startB;
    };

    it("harus mencegah kelas yang sama memiliki dua mapel berbeda pada jam yang bertubrukan", () => {
      const mapel1 = { kelasId: "1", hari: "Rabu", jam_mulai: "07:30", jam_selesai: "09:00" };
      const mapel2 = { kelasId: "1", hari: "Rabu", jam_mulai: "08:00", jam_selesai: "09:30" };
      const mapelLainKelas = { kelasId: "2", hari: "Rabu", jam_mulai: "08:00", jam_selesai: "09:30" };

      expect(isClassConflict(mapel1, mapel2)).toBe(true);
      expect(isClassConflict(mapel1, mapelLainKelas)).toBe(false);
    });
  });

  describe("2.4: Filter Mata Pelajaran Sesuai Jenjang", () => {
    it("harus menyaring mapel SD hanya yang berjenjang 'SD' atau 'SEMUA'", async () => {
      const mockMapels = [
        { id: BigInt(1), nama_mapel: "Matematika SD", jenjang: "SD" },
        { id: BigInt(2), nama_mapel: "Pendidikan Agama Islam", jenjang: "SEMUA" },
      ];
      vi.mocked(prisma.mataPelajaran.findMany).mockResolvedValueOnce(mockMapels as any);

      const result = await SubjectService.getMataPelajaranList("SD");

      expect(prisma.mataPelajaran.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ jenjang: "SD" }, { jenjang: "SEMUA" }],
        },
        orderBy: { nama_mapel: "asc" },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("1");
    });

    it("harus mengambil seluruh mapel tanpa filter jika jenjang 'SEMUA' atau undefined", async () => {
      vi.mocked(prisma.mataPelajaran.findMany).mockResolvedValueOnce([
        { id: BigInt(1), nama_mapel: "IPA", jenjang: "SD" },
        { id: BigInt(2), nama_mapel: "Fisika", jenjang: "SMP" },
      ] as any);

      const result = await SubjectService.getMataPelajaranList();
      expect(prisma.mataPelajaran.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { nama_mapel: "asc" },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe("2.5: Parsing & Impor File Excel Kelas (ClassService)", () => {
    it("harus mendeteksi otomatis kolom nama kelas, tingkat (grade 1-9), dan jenjang (SD/SMP)", async () => {
      // Buat binary excel virtual di memory dengan XLSX
      const wb = XLSX.utils.book_new();
      const wsData = [
        ["Nama Kelas", "Jenjang", "Tingkat", "Wali Kelas", "Kapasitas", "Code Restrict"],
        ["4 Abu Bakar", "SD", "4", "Ustadz Budi", "28", "RESTRICT4AB"],
        ["Kelas 7 Al-Fatih", "SMP", "7", "Ustadzah Siti", "30", "RESTRICT7AF"],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const excelBase64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      vi.mocked(prisma.kelas.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.kelas.create).mockResolvedValue({ id: BigInt(1) } as any);
      vi.mocked(prisma.restrict.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.restrict.create).mockResolvedValue({ id: BigInt(1) } as any);

      const count = await ClassService.importClassesFromBase64(excelBase64);

      expect(count).toBe(2);
      expect(prisma.kelas.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nama_kelas: "4 Abu Bakar",
            jenjang: "SD",
            tingkat: 4,
            wali_kelas: "Ustadz Budi",
            code_restrict: "RESTRICT4AB",
          }),
        })
      );
      expect(prisma.kelas.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nama_kelas: "Kelas 7 Al-Fatih",
            jenjang: "SMP",
            tingkat: 7,
            wali_kelas: "Ustadzah Siti",
            code_restrict: "RESTRICT7AF",
          }),
        })
      );
    });
  });
});
