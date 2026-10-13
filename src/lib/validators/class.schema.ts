import { z } from "zod";

export const createClassSchema = z.object({
  nama_kelas: z.string().min(3, "Nama kelas minimal 3 karakter"),
  wali_kelas: z.string().optional(),
  jumlah_siswa: z.string().optional(),
  code_restrict: z.string().optional(),
});
