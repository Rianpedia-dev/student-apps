import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Periksa kembali email anda"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const registerTeacherSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().min(3, "Email / Username minimal 3 karakter"),
  appleid: z.string().min(1, "Apple ID wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  passwordappleid: z.string().min(1, "Password Apple ID wajib diisi"),
  guru_bidang: z.string().min(1, "Bidang studi wajib diisi"),
  gender: z.enum(["L", "P"], { message: "Pilih jenis kelamin" }),
  nip: z.string().optional(),
  kelas: z.string().optional().default("-"),
});
