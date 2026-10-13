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
