import { z } from "zod";
import { TINGKAT_PRESTASI, PERINGKAT_PRESTASI } from "@/lib/achievement-points";

export const AchievementFormSchema = z.object({
  id_user: z.string().min(1, "Siswa wajib dipilih"),
  nama: z.string().optional().default(""),
  kelas: z.string().optional().default(""),
  kelas_saat_prestasi: z.string().optional().default(""),
  tingkat: z.enum(TINGKAT_PRESTASI, {
    message: "Pilih tingkat kompetisi yang valid (Internasional, Nasional, Daerah/Kota, Dalam Sekolah)",
  }),
  peringkat: z.enum(PERINGKAT_PRESTASI, {
    message: "Pilih peringkat juara yang valid (Juara 1, Juara 2, Juara 3, Harapan)",
  }),
  prestasi: z.string().min(3, "Nama kejuaraan/prestasi minimal 3 karakter"),
  tahun_ajaran: z.string().optional().nullable(),
  tanggal_prestasi: z.string().optional().nullable(),
  fotoanak: z.string().optional().nullable(),
});

export type AchievementFormData = z.infer<typeof AchievementFormSchema>;
