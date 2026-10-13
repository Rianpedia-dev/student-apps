import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  from: z.string().min(1, "Asal pengumuman wajib diisi"),
  pengumuman: z.string().min(5, "Konten pengumuman minimal 5 karakter"),
  file: z.string().optional(),
});
