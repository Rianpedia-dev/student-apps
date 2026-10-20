import { z } from "zod";

export const attendanceRecordSchema = z.object({
  date: z.string().min(1, "Tanggal absensi wajib diisi"),
  kelas: z.string().min(1, "Kelas wajib diisi"),
  records: z.array(
    z.object({
      userId: z.string().min(1),
      keterangan: z.enum(["Hadir", "Sakit", "Izin", "Alpha"]),
    })
  ),
});

export const subjectAttendanceRecordSchema = z.object({
  date: z.string().min(1, "Tanggal absensi wajib diisi"),
  kelas: z.string().min(1, "Kelas wajib diisi"),
  kelasId: z.string().optional(),
  mapelId: z.string().min(1, "Mata pelajaran wajib dipilih"),
  jadwalId: z.string().optional(),
  pertemuanId: z.string().optional(),
  jamKe: z.string().optional(),
  records: z.array(
    z.object({
      userId: z.string().min(1),
      keterangan: z.enum(["Hadir", "Sakit", "Izin", "Alpha"]),
      catatan: z.string().max(500).optional(),
    })
  ),
});

export const waliKelasFullDayStatusSchema = z.object({
  date: z.string().min(1, "Tanggal absensi wajib diisi"),
  kelas: z.string().min(1, "Nama kelas wajib diisi"),
  studentId: z.string().min(1, "ID siswa wajib diisi"),
  keterangan: z.enum(["Sakit", "Izin", "Alpha", "Hadir"]),
  catatan: z.string().max(500).optional(),
});
