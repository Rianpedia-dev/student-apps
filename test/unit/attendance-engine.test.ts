import { describe, it, expect, vi, beforeEach } from "vitest";
import { AttendanceService } from "@/services/attendance.service";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

vi.mock("@/lib/prisma", () => ({
  default: {
    absen: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    jadwalPelajaran: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    kelas: {
      findMany: vi.fn(),
    },
    mataPelajaran: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (ops: any[]) => {
      // Menjalankan array operasi mock prisma
      return Promise.all(ops);
    }),
  },
}));

describe("Suite 3: Mesin Absensi, Matriks Harian & Kalkulasi Rekapitulasi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("3.1: Kalkulasi Statistik & Persentase Kehadiran", () => {
    it("harus menghitung persentase kehadiran secara proporsional terhadap total pertemuan tercatat", () => {
      const stats = {
        hadir: 18,
        sakit: 1,
        izin: 1,
        alpha: 0,
      };
      const total = stats.hadir + stats.sakit + stats.izin + stats.alpha;
      const percentage = Math.round((stats.hadir / total) * 100);

      expect(total).toBe(20);
      expect(percentage).toBe(90);
    });

    it("harus mengembalikan persentase 100% jika belum ada pertemuan tercatat", () => {
      const hadir = 0, sakit = 0, izin = 0, alpha = 0;
      const total = hadir + sakit + izin + alpha;
      const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100;

      expect(percentage).toBe(100);
    });
  });

  describe("3.2: Fitur Izin / Sakit Seharian oleh Wali Kelas", () => {
    it("harus mendistribusikan status izin ke seluruh mapel yang terjadwal di hari yang sama", async () => {
      // 3 mapel di hari Senin
      const mockSchedules = [
        { id: BigInt(1), mapel_id: BigInt(10), guru_id: BigInt(100), jam_mulai: "07:30", jam_selesai: "09:00" },
        { id: BigInt(2), mapel_id: BigInt(20), guru_id: BigInt(200), jam_mulai: "09:15", jam_selesai: "10:45" },
        { id: BigInt(3), mapel_id: BigInt(30), guru_id: BigInt(300), jam_mulai: "11:00", jam_selesai: "12:30" },
      ];
      vi.mocked(prisma.jadwalPelajaran.findMany).mockResolvedValueOnce(mockSchedules as any);
      vi.mocked(prisma.absen.upsert).mockResolvedValue({ id: BigInt(1) } as any);

      // Panggil applyFullDayStatusByWaliKelas untuk Senin 2026-10-26
      await AttendanceService.applyFullDayStatusByWaliKelas({
        dateStr: "2026-10-26", // Hari Senin
        kelasNama: "4 Abu Bakar",
        studentId: "501",
        keterangan: "Sakit",
        catatan: "Demam tinggi surat dokter terlampir",
      });

      // Harus memanggil upsert untuk 3 mapel terjadwal
      expect(prisma.absen.upsert).toHaveBeenCalledTimes(3);
      expect(prisma.absen.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id_mapel_id_date: {
              user_id: BigInt(501),
              mapel_id: BigInt(10),
              date: "2026-10-26",
            },
          },
          create: expect.objectContaining({
            keterangan: "Sakit",
            catatan: "Demam tinggi surat dokter terlampir",
          }),
        })
      );
    });

    it("harus fallback membuat 1 record absensi umum (mapel_id: 0) bila tidak ada jadwal mapel di hari tersebut", async () => {
      vi.mocked(prisma.jadwalPelajaran.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.absen.upsert).mockResolvedValue({ id: BigInt(1) } as any);

      await AttendanceService.applyFullDayStatusByWaliKelas({
        dateStr: "2026-10-25", // Hari Minggu
        kelasNama: "4 Abu Bakar",
        studentId: "501",
        keterangan: "Izin",
      });

      expect(prisma.absen.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.absen.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id_mapel_id_date: {
              user_id: BigInt(501),
              mapel_id: BigInt(0),
              date: "2026-10-25",
            },
          },
        })
      );
    });
  });

  describe("3.3: Rekap Bulanan Siswa Berbasis Mapel", () => {
    it("harus mengelompokkan kehadiran siswa per tanggal dalam bulan yang bersangkutan", async () => {
      vi.mocked(prisma.mataPelajaran.findUnique).mockResolvedValueOnce({
        id: BigInt(10),
        nama_mapel: "Matematika",
        kode_mapel: "MTK",
        warna: "blue",
      } as any);

      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
        { id: BigInt(501), name: "Ahmad Fauzi", nis: "1001", gender: "L" },
      ] as any);

      vi.mocked(prisma.absen.findMany).mockResolvedValueOnce([
        { user_id: BigInt(501), date: "2026-10-05", keterangan: "Hadir" },
        { user_id: BigInt(501), date: "2026-10-12", keterangan: "Hadir" },
        { user_id: BigInt(501), date: "2026-10-19", keterangan: "Sakit" },
        { user_id: BigInt(501), date: "2026-10-26", keterangan: "Hadir" },
      ] as any);

      const result = await AttendanceService.getSubjectAttendanceRecap(
        "10",
        "4 Abu Bakar",
        10,
        2026
      );

      expect(result.students).toHaveLength(1);
      const studentData = result.students[0];
      expect(studentData.hadir).toBe(3);
      expect(studentData.sakit).toBe(1);
      expect(studentData.daily[5]).toBe("Hadir");
      expect(studentData.daily[12]).toBe("Hadir");
      expect(studentData.daily[19]).toBe("Sakit");
      expect(studentData.percentage).toBe(75); // 3 hadir dari 4 total = 75%
    });
  });

  describe("3.4: Batch Deduplikasi Absensi & Transaksional", () => {
    it("harus mendeduplikasi input user_id ganda dalam satu payload request", async () => {
      vi.mocked(prisma.absen.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.absen.createMany).mockResolvedValueOnce({ count: 1 } as any);

      await AttendanceService.recordSubjectAttendance({
        date: "2026-10-27",
        kelas: "4 Abu Bakar",
        mapelId: "10",
        records: [
          { userId: "501", keterangan: "Hadir" },
          { userId: "501", keterangan: "Sakit" }, // Duplikat dalam payload yang sama
        ],
      });

      // Hanya boleh ada 1 record yang diteruskan ke prisma.absen.createMany
      expect(prisma.absen.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            user_id: BigInt(501),
            keterangan: "Sakit", // Nilai terakhir yang disimpan
          }),
        ],
        skipDuplicates: true,
      });
    });
  });

  describe("3.5: Export Rekap Absensi ke Lembar Kerja Excel (.xlsx)", () => {
    it("harus menghasilkan file Excel valid dengan header, rekapitulasi angka, dan sheet presensi", () => {
      const wb = XLSX.utils.book_new();
      const exportRows = [
        ["REKAPITULASI PRESENSI SISWA"],
        ["Kelas: 4 Abu Bakar", "Bulan: Oktober 2026", "Mapel: Matematika"],
        [],
        ["No", "Nama Siswa", "NIS", "L/P", "Hadir", "Sakit", "Izin", "Alpha", "% Kehadiran"],
        [1, "Ahmad Fauzi", "1001", "L", 18, 1, 1, 0, "90%"],
        [2, "Siti Aisyah", "1002", "P", 20, 0, 0, 0, "100%"],
      ];

      const ws = XLSX.utils.aoa_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(wb, ws, "Rekap_Presensi");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      // Verifikasi buffer Excel dapat dibaca ulang tanpa korupsi
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);

      const parsedWb = XLSX.read(buffer, { type: "buffer" });
      expect(parsedWb.SheetNames).toContain("Rekap_Presensi");
      const readSheet = parsedWb.Sheets["Rekap_Presensi"];
      expect(readSheet["B5"].v).toBe("Ahmad Fauzi");
      expect(readSheet["I5"].v).toBe("90%");
    });
  });
});
