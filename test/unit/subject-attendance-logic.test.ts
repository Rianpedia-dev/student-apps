import { describe, it, expect } from "vitest";
import {
  subjectAttendanceRecordSchema,
  waliKelasFullDayStatusSchema,
} from "../../src/lib/validators/attendance.schema";

describe("MODUL PRESENSI MAPEL: Validasi Skema Zod", () => {
  it("ATT-MAPEL-01: Validasi payload presensi per mata pelajaran yang valid", () => {
    const validPayload = {
      date: "2026-10-20",
      kelas: "Kelas 7 - Ibnu Sina",
      kelasId: "1",
      mapelId: "5",
      jadwalId: "12",
      jamKe: "07:30 - 08:50",
      records: [
        { userId: "101", keterangan: "Hadir", catatan: "" },
        { userId: "102", keterangan: "Sakit", catatan: "Surat dokter dari RS" },
        { userId: "103", keterangan: "Izin", catatan: "Acara keluarga syar'i" },
        { userId: "104", keterangan: "Alpha", catatan: "" },
      ],
    };

    const parsed = subjectAttendanceRecordSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("ATT-MAPEL-02: Menolak nilai keterangan yang bukan Hadir, Sakit, Izin, Alpha", () => {
    const invalidPayload = {
      date: "2026-10-20",
      kelas: "Kelas 7 - Ibnu Sina",
      mapelId: "5",
      records: [
        { userId: "101", keterangan: "Bolos" }, // Keterangan tidak valid
      ],
    };

    const parsed = subjectAttendanceRecordSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it("ATT-MAPEL-03: Validasi form penetapan izin seharian oleh Wali Kelas", () => {
    const fullDayPayload = {
      date: "2026-10-20",
      kelas: "Kelas 7 - Ibnu Sina",
      studentId: "105",
      keterangan: "Sakit",
      catatan: "Demam tinggi, istirahat di rumah",
    };

    const parsed = waliKelasFullDayStatusSchema.safeParse(fullDayPayload);
    expect(parsed.success).toBe(true);
  });
});

describe("MODUL PRESENSI MAPEL: Logika Evaluasi Matriks & Deteksi Bolos (Truancy)", () => {
  it("ATT-MAPEL-04: Mendeteksi anomali siswa bolos di jam KBM tertentu (Hadir di Mapel A, Alpha di Mapel B)", () => {
    const evaluateStudentDailyStatus = (statuses: string[]) => {
      if (statuses.length === 0) return "Belum Lengkap";
      if (statuses.every((s) => s === "Sakit")) return "Sakit Seharian";
      if (statuses.every((s) => s === "Izin")) return "Izin Seharian";
      if (statuses.includes("Alpha") && (statuses.includes("Hadir") || statuses.includes("Izin"))) {
        return "Bolos Terdeteksi";
      }
      return "Lengkap";
    };

    // Siswa hadir di PAI pagi tapi Alpha di Matematika siang
    expect(evaluateStudentDailyStatus(["Hadir", "Hadir", "Alpha"])).toBe("Bolos Terdeteksi");

    // Siswa sakit seharian dengan konfirmasi dokter
    expect(evaluateStudentDailyStatus(["Sakit", "Sakit", "Sakit"])).toBe("Sakit Seharian");

    // Siswa hadir di seluruh jam KBM
    expect(evaluateStudentDailyStatus(["Hadir", "Hadir", "Hadir", "Hadir"])).toBe("Lengkap");
  });

  it("ATT-MAPEL-05: Perhitungan persentase kehadiran per mata pelajaran untuk syarat asesmen", () => {
    const calcPercentage = (hadir: number, total: number) => {
      if (total === 0) return 100;
      return Math.round((hadir / total) * 100);
    };

    // 22 hadir dari 25 pertemuan => 88%
    expect(calcPercentage(22, 25)).toBe(88);

    // 18 hadir dari 25 pertemuan => 72% (Di bawah batas minimal 75%)
    expect(calcPercentage(18, 25)).toBe(72);
  });

  it("ATT-MAPEL-06: Logika tombol sakti '1-Click Semua Hadir' pada form presensi mapel", () => {
    const students = [
      { id: "1", name: "Zaidan", status: "Alpha" },
      { id: "2", name: "Maryam", status: "Izin" },
      { id: "3", name: "Fathir", status: "Sakit" },
    ];

    const bulkSetAllHadir = (list: typeof students) => {
      return list.map((s) => ({ ...s, status: "Hadir" }));
    };

    const updated = bulkSetAllHadir(students);
    expect(updated.every((s) => s.status === "Hadir")).toBe(true);
    expect(updated.length).toBe(3);
  });
});
