import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { AppError, NotFoundError, ValidationError } from "@/lib/errors";
import { serializeBigInt } from "@/lib/serializer";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  kelas?: string | null;
  appleid?: string | null;
  passwordappleid?: string | null;
  gender?: string;
  nis?: string | null;
  nip?: string | null;
  guru_bidang?: string | null;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  nip?: string | null;
  gender?: string | null;
  status?: string;
  kelas?: string | null;
  appleid?: string | null;
  passwordappleid?: string | null;
  ctt_iPad?: string | null;
  password?: string;
  address?: string | null;
  notes?: string | null;
  skills?: string | null;
  guru_bidang?: string | null;
  image?: string | null;
}

export class UserService {
  /**
   * Menambahkan pengguna baru ke sistem (Siswa, Guru, Wali)
   */
  static async createUser(data: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ValidationError("Email sudah terdaftar dalam sistem.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const roleStatus = data.role || "1"; // 1=siswa, 2=guru, 4=wali

    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        password1: data.password, // fallback legacy
        status: roleStatus,
        kelas: data.kelas || null,
        appleid: data.appleid || null,
        passwordappleid: data.passwordappleid || null,
        gender: data.gender || "L",
        nis: data.nis || null,
        nip: data.nip || null,
        guru_bidang: data.guru_bidang || null,
        point: "0",
      },
    });

    return serializeBigInt(created);
  }

  /**
   * Memperbarui informasi pengguna
   */
  static async updateUser(data: UpdateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { id: BigInt(data.id) },
    });

    if (!existing) {
      throw new NotFoundError("Pengguna tidak ditemukan.");
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (data.name !== undefined) dataToUpdate.name = data.name;
    if (data.email !== undefined) dataToUpdate.email = data.email;
    if (data.nip !== undefined) dataToUpdate.nip = data.nip;
    if (data.gender !== undefined) dataToUpdate.gender = data.gender;
    if (data.status !== undefined) dataToUpdate.status = data.status;
    if (data.kelas !== undefined) dataToUpdate.kelas = data.kelas;
    if (data.appleid !== undefined) dataToUpdate.appleid = data.appleid;
    if (data.passwordappleid !== undefined) dataToUpdate.passwordappleid = data.passwordappleid;
    if (data.ctt_iPad !== undefined) dataToUpdate.ctt_iPad = data.ctt_iPad;
    if (data.address !== undefined) dataToUpdate.address = data.address;
    if (data.notes !== undefined) dataToUpdate.notes = data.notes;
    if (data.skills !== undefined) dataToUpdate.skills = data.skills;
    if (data.guru_bidang !== undefined) dataToUpdate.guru_bidang = data.guru_bidang;
    if (data.image !== undefined) dataToUpdate.image = data.image;

    if (data.password && data.password.trim().length > 0) {
      dataToUpdate.password = await bcrypt.hash(data.password, 10);
      dataToUpdate.password1 = data.password;
    }

    const updated = await prisma.user.update({
      where: { id: BigInt(data.id) },
      data: dataToUpdate,
    });

    return serializeBigInt(updated);
  }

  /**
   * Menghapus pengguna secara permanen
   */
  static async deleteUser(id: string) {
    const existing = await prisma.user.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundError("Pengguna tidak ditemukan.");
    }

    await prisma.user.delete({
      where: { id: BigInt(id) },
    });

    return true;
  }

  /**
   * Menghapus beberapa pengguna secara massal (bulk delete)
   */
  static async deleteUsers(ids: string[]) {
    if (!ids || ids.length === 0) return 0;
    const bigIntIds = ids.map((id) => BigInt(id));
    try {
      const res = await prisma.user.deleteMany({
        where: {
          id: { in: bigIntIds },
        },
      });
      return res.count;
    } catch {
      const results = await prisma.$transaction(
        bigIntIds.map((id) => prisma.user.delete({ where: { id } }))
      );
      return results.length;
    }
  }

  /**
   * Memverifikasi status akun (misal guru baru status 0 -> 2 atau 4)
   */
  static async verifyUser(id: string, status: string) {
    const updated = await prisma.user.update({
      where: { id: BigInt(id) },
      data: { status },
    });

    return serializeBigInt(updated);
  }

  /**
   * Menambah atau mengurangi point perilaku siswa
   */
  static async adjustStudentPoint(studentId: string, delta: number) {
    const student = await prisma.user.findUnique({
      where: { id: BigInt(studentId) },
    });

    if (!student) {
      throw new NotFoundError("Siswa tidak ditemukan.");
    }

    const currentPoint = parseInt(student.point || "0", 10) || 0;
    const newPoint = Math.max(0, currentPoint + delta);

    const updated = await prisma.user.update({
      where: { id: BigInt(studentId) },
      data: { point: String(newPoint) },
    });

    return { newPoint, user: serializeBigInt(updated) };
  }

  /**
   * Mendaftarkan siswa ke kelas wali
   */
  static async enrollStudentToClass(studentId: string, kelas: string) {
    const updated = await prisma.user.update({
      where: { id: BigInt(studentId) },
      data: { kelas },
    });

    return serializeBigInt(updated);
  }

  /**
   * Mengeluarkan sejumlah siswa dari kelas (set kelas = null)
   */
  static async removeStudentsFromClass(studentIds: string[]) {
    if (!studentIds || studentIds.length === 0) return 0;

    const result = await prisma.user.updateMany({
      where: {
        id: { in: studentIds.map((id) => BigInt(id)) },
      },
      data: { kelas: null },
    });

    return result.count;
  }

  /**
   * Mengimpor data siswa secara massal dari file Excel (base64 buffer) dengan batching
   */
  static async importStudentsFromBase64(base64Data: string): Promise<number> {
    const buffer = Buffer.from(base64Data, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new AppError("File Excel tidak memiliki lembar kerja (sheet).");
    }

    const worksheet = workbook.Sheets[sheetName];
    // Format: Email, Password, Password Plain, Nama, Apple ID, Password Apple ID, Status, Gender
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    const dataRows = rows.slice(1);
    let importedCount = 0;

    // Proses dalam chunk 10 baris agar tidak memblokir event loop saat ribuan siswa diimpor
    const CHUNK_SIZE = 10;
    for (let i = 0; i < dataRows.length; i += CHUNK_SIZE) {
      const chunk = dataRows.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (row) => {
          if (!row || row.length < 4) return;
          const email = String(row[0] || "").trim();
          const passwordPlain = String(row[2] || row[1] || "123456").trim();
          const name = String(row[3] || "").trim();
          const appleid = row[4] ? String(row[4]).trim() : null;
          const passwordappleid = row[5] ? String(row[5]).trim() : null;
          const status = row[6] ? String(row[6]).trim() : "1";
          const gender = row[7] ? String(row[7]).trim() : "L";

          if (!email || !name) return;

          const hashedPassword = await bcrypt.hash(passwordPlain, 10);

          await prisma.user.upsert({
            where: { email },
            update: {
              name,
              appleid,
              passwordappleid,
              gender,
              status,
            },
            create: {
              email,
              name,
              password: hashedPassword,
              password1: passwordPlain,
              appleid,
              passwordappleid,
              status,
              gender,
            },
          });
          importedCount++;
        })
      );
    }

    return importedCount;
  }

  /**
   * Mengimpor data guru secara massal dari file Excel (base64 buffer)
   * Fleksibel terhadap kolom kosong, urutan kolom berbeda, dan membuat akun tetap berhasil diimpor.
   */
  static async importTeachersFromBase64(base64Data: string): Promise<number> {
    const buffer = Buffer.from(base64Data, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new AppError("File Excel tidak memiliki lembar kerja (sheet).");
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
    if (!rows || rows.length === 0) return 0;

    // 1. Deteksi letak baris header dan pemetaan nama kolom
    let headerRowIdx = -1;
    const colMap: Record<string, number> = {};

    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const joined = row.map((c) => String(c ?? "").trim().toLowerCase()).join(" ");

      if (
        joined.includes("nama") ||
        joined.includes("email") ||
        joined.includes("nip") ||
        joined.includes("guru") ||
        joined.includes("mapel")
      ) {
        headerRowIdx = r;
        row.forEach((col, idx) => {
          const norm = String(col ?? "").trim().toLowerCase();
          if (norm.includes("nip") || norm.includes("nomor induk") || norm.includes("no induk")) {
            colMap["nip"] = idx;
          } else if (norm.includes("nama") || norm.includes("name")) {
            colMap["name"] = idx;
          } else if (norm.includes("email") || norm.includes("surel") || norm.includes("e-mail")) {
            colMap["email"] = idx;
          } else if (norm.includes("apple") && (norm.includes("pass") || norm.includes("sandi") || norm.includes("pwd"))) {
            colMap["passwordappleid"] = idx;
          } else if (norm.includes("apple")) {
            colMap["appleid"] = idx;
          } else if (norm.includes("pass") || norm.includes("sandi") || norm.includes("pwd")) {
            colMap["password"] = idx;
          } else if (norm.includes("kelamin") || norm.includes("gender") || norm === "jk") {
            colMap["gender"] = idx;
          } else if (
            norm.includes("bidang") ||
            norm.includes("mapel") ||
            norm.includes("studi") ||
            norm.includes("pelajaran")
          ) {
            colMap["guru_bidang"] = idx;
          } else if (norm.includes("peran") || norm.includes("role") || norm.includes("status") || norm.includes("jabatan")) {
            colMap["role"] = idx;
          } else if (norm.includes("kelas") || norm.includes("wali")) {
            colMap["kelas"] = idx;
          }
        });
        break;
      }
    }

    const getVal = (row: any[], key: string, fallbackIdx: number): string => {
      const idx = colMap[key] !== undefined ? colMap[key] : fallbackIdx;
      return idx >= 0 && idx < row.length ? String(row[idx] ?? "").trim() : "";
    };

    const dataRows = headerRowIdx >= 0 ? rows.slice(headerRowIdx + 1) : rows;
    let importedCount = 0;

    const CHUNK_SIZE = 10;
    for (let i = 0; i < dataRows.length; i += CHUNK_SIZE) {
      const chunk = dataRows.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (row) => {
          if (!row || !Array.isArray(row)) return;

          // Cek jika seluruh baris kosong
          const hasAnyContent = row.some((c) => String(c ?? "").trim().length > 0);
          if (!hasAnyContent) return;

          const rawNip = getVal(row, "nip", 0);
          const rawName = getVal(row, "name", 1);
          const rawEmail = getVal(row, "email", 2).toLowerCase();
          const rawPassword = getVal(row, "password", 3);
          const rawGender = getVal(row, "gender", 4).toUpperCase();
          const rawBidang = getVal(row, "guru_bidang", 5);
          const rawRole = getVal(row, "role", 6).toLowerCase();
          const rawKelas = getVal(row, "kelas", 7);
          const rawAppleId = getVal(row, "appleid", 8);
          const rawPasswordApple = getVal(row, "passwordappleid", 9);

          // Jika tidak ada data pengenal sama sekali pada baris ini, lewati
          if (!rawName && !rawEmail && !rawNip) return;

          // Nama: toleran jika kosong
          let name = rawName;
          if (!name) {
            if (rawEmail) {
              const prefix = rawEmail.split("@")[0] || "Guru";
              name = prefix
                .split(/[._-]/)
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" ");
            } else if (rawNip) {
              name = `Guru ${rawNip}`;
            } else {
              name = "Dewan Guru";
            }
          }

          // Email: jika kosong, generate email default berbasis NIP atau Nama
          let email = rawEmail;
          if (!email) {
            const cleanSlug = name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, ".")
              .replace(/\.+/g, ".")
              .replace(/^\.|\.$/g, "")
              .slice(0, 25) || (rawNip ? `guru.${rawNip}` : `guru.${Date.now()}`);

            let candidate = `${cleanSlug}@alazhar.sch.id`;
            let counter = 1;
            while (await prisma.user.findUnique({ where: { email: candidate } })) {
              candidate = `${cleanSlug}${counter}@alazhar.sch.id`;
              counter++;
            }
            email = candidate;
          }

          // Fallback nilai jika kolom kosong
          const nip = rawNip || null;
          const passwordPlain = rawPassword || "123456";
          const gender = rawGender.startsWith("P") || rawGender.startsWith("W") ? "P" : "L";
          const guru_bidang = rawBidang || null;
          const roleStatus = rawRole.includes("wali") || rawRole === "4" ? "4" : "2";
          const kelas = rawKelas || null;
          const appleid = rawAppleId || null;
          const passwordappleid = rawPasswordApple || null;

          const hashedPassword = await bcrypt.hash(passwordPlain, 10);

          try {
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (existingUser) {
              // Jika user sudah ada, hanya perbarui kolom yang memiliki nilai di Excel
              // agar data yang sudah diisi manual oleh guru/admin tidak hilang terhapus null
              const updateData: Record<string, any> = {
                name,
              };
              if (nip) updateData.nip = nip;
              if (guru_bidang) updateData.guru_bidang = guru_bidang;
              if (kelas) updateData.kelas = kelas;
              if (rawGender) updateData.gender = gender;
              if (rawRole) updateData.status = roleStatus;
              if (appleid) updateData.appleid = appleid;
              if (passwordappleid) updateData.passwordappleid = passwordappleid;
              if (rawPassword) {
                updateData.password = hashedPassword;
                updateData.password1 = passwordPlain;
              }

              await prisma.user.update({
                where: { email },
                data: updateData,
              });
            } else {
              // Akun baru dibuat dengan nilai default untuk kolom yang kosong
              await prisma.user.create({
                data: {
                  email,
                  name,
                  nip,
                  guru_bidang,
                  kelas,
                  status: roleStatus,
                  gender,
                  password: hashedPassword,
                  password1: passwordPlain,
                  appleid,
                  passwordappleid,
                },
              });
            }

            importedCount++;
          } catch (rowErr) {
            console.error(`Gagal memproses baris guru ${name} (${email}):`, rowErr);
          }
        })
      );
    }

    return importedCount;
  }
}

