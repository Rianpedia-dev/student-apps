import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { AppError, NotFoundError, ValidationError } from "@/lib/errors";
import { serializeBigInt } from "@/lib/serializer";
import { resolveUserJenjang } from "@/lib/utils";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  jenjang?: string | null;
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
  jenjang?: string | null;
  nis?: string | null;
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
    const userJenjang = data.jenjang || resolveUserJenjang(null, roleStatus, data.kelas);

    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        password1: data.password, // fallback legacy
        status: roleStatus,
        jenjang: userJenjang,
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
    if (data.jenjang !== undefined) dataToUpdate.jenjang = data.jenjang;
    if (data.nis !== undefined) dataToUpdate.nis = data.nis;
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

    await prisma.pelanggaran.deleteMany({
      where: { user_id: String(id) },
    });
    await prisma.prestasi.deleteMany({
      where: { id_user: String(id) },
    });

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
    const stringIds = ids.map((id) => String(id));

    await prisma.pelanggaran.deleteMany({
      where: { user_id: { in: stringIds } },
    });
    await prisma.prestasi.deleteMany({
      where: { id_user: { in: stringIds } },
    });

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
   * Mendaftarkan beberapa siswa sekaligus ke kelas wali
   */
  static async enrollStudentsToClass(studentIds: string[], kelas: string) {
    if (!studentIds || studentIds.length === 0) return 0;

    const result = await prisma.user.updateMany({
      where: {
        id: { in: studentIds.map((id) => BigInt(id)) },
      },
      data: { kelas },
    });

    return result.count;
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
   * Fleksibel terhadap urutan kolom, header dinamis, teks 'kosong', serta mendukung kelas & NIS.
   */
  static async importStudentsFromBase64(
    base64Data: string,
    defaultKelas?: string | null,
    defaultJenjang?: string | null
  ): Promise<number> {
    const buffer = Buffer.from(base64Data, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });

    // 1. Pilih sheet terbaik: cari sheet yang mengandung kata siswa/student/murid, atau sheet yang memiliki kolom nama/email
    let sheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      const lower = name.toLowerCase();
      if (lower.includes("siswa") || lower.includes("student") || lower.includes("murid")) {
        sheetName = name;
        break;
      }
      const ws = workbook.Sheets[name];
      if (ws) {
        const sampleRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" }).slice(0, 5);
        const hasHeader = sampleRows.some((r) =>
          Array.isArray(r) &&
          r.some((c) => {
            const s = String(c ?? "").toLowerCase();
            return s.includes("nama") || s.includes("email") || s.includes("username");
          })
        );
        if (hasHeader) {
          sheetName = name;
        }
      }
    }

    if (!sheetName) {
      throw new AppError("File Excel tidak memiliki lembar kerja (sheet).");
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
    if (!rows || rows.length === 0) return 0;

    // 2. Deteksi letak baris header dan pemetaan nama kolom secara presisi
    let headerRowIdx = -1;
    const colMap: Record<string, number> = {};

    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const joined = row.map((c) => String(c ?? "").trim().toLowerCase()).join(" ");

      if (
        joined.includes("nama") ||
        joined.includes("email") ||
        joined.includes("username") ||
        joined.includes("apple") ||
        joined.includes("nis") ||
        joined.includes("kelas")
      ) {
        headerRowIdx = r;
        row.forEach((col, idx) => {
          const norm = String(col ?? "").trim().toLowerCase();
          // Catatan: 'jenis kelamin' mengandung substring 'nis' (je-nis), maka harus dikecualikan
          if (
            !norm.includes("jenis") &&
            (/\bnis\b/.test(norm) || norm.includes("nomor induk") || norm.includes("no induk"))
          ) {
            colMap["nis"] = idx;
          } else if (
            norm.includes("email") ||
            norm.includes("username") ||
            norm.includes("surel") ||
            norm.includes("e-mail")
          ) {
            colMap["email"] = idx;
          } else if (
            !norm.includes("username") &&
            (norm.includes("nama") || norm.includes("name"))
          ) {
            colMap["name"] = idx;
          } else if (norm.includes("apple") && (norm.includes("pass") || norm.includes("sandi") || norm.includes("pwd"))) {
            colMap["passwordappleid"] = idx;
          } else if (norm.includes("apple")) {
            colMap["appleid"] = idx;
          } else if (norm.includes("plain") || norm.includes("password plain")) {
            colMap["passwordPlain"] = idx;
          } else if (norm.includes("pass") || norm.includes("sandi") || norm.includes("pwd")) {
            colMap["password"] = idx;
          } else if (norm.includes("kelamin") || norm.includes("gender") || norm === "jk" || norm.includes("(l/p)")) {
            colMap["gender"] = idx;
          } else if (norm.includes("kelas") || norm.includes("rombel") || norm.includes("class")) {
            colMap["kelas"] = idx;
          } else if (norm.includes("status") || norm.includes("aktif")) {
            colMap["status"] = idx;
          } else if (norm.includes("jenjang") || norm.includes("tingkat pendidikan")) {
            colMap["jenjang"] = idx;
          }
        });
        break;
      }
    }

    const cleanVal = (val: unknown): string | null => {
      if (val === undefined || val === null) return null;
      const s = String(val).trim();
      const lower = s.toLowerCase();
      if (!s || lower === "kosong" || lower === "-" || lower === "null" || lower === "none") {
        return null;
      }
      return s;
    };

    const getVal = (row: any[], key: string, fallbackIdx: number): string | null => {
      // Jika baris header ditemukan, gunakan HANYA pemetaan colMap agar tidak salah membaca kolom lain
      const idx = colMap[key] !== undefined ? colMap[key] : (headerRowIdx >= 0 ? -1 : fallbackIdx);
      if (idx >= 0 && idx < row.length) {
        return cleanVal(row[idx]);
      }
      return null;
    };

    const dataRows = headerRowIdx >= 0 ? rows.slice(headerRowIdx + 1) : rows.slice(1);
    let importedCount = 0;

    // Cache hash password agar tidak hashing ulang password yang identik (meningkatkan performa 500x)
    const passwordHashMap = new Map<string, string>();
    const detectedClasses = new Set<string>();

    // Proses dalam chunk 15 baris untuk performa optimal
    const CHUNK_SIZE = 15;
    for (let i = 0; i < dataRows.length; i += CHUNK_SIZE) {
      const chunk = dataRows.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (row) => {
          if (!row || !Array.isArray(row) || row.length === 0) return;

          const email = getVal(row, "email", 0);
          const name = getVal(row, "name", 3);
          if (!email || !name) return;

          let rawPassword: string | null = null;
          if (colMap["passwordPlain"] !== undefined) {
            rawPassword = cleanVal(row[colMap["passwordPlain"]]);
          }
          if (!rawPassword && colMap["password"] !== undefined) {
            rawPassword = cleanVal(row[colMap["password"]]);
          }
          if (!rawPassword && headerRowIdx < 0) {
            rawPassword = cleanVal(row[2]) || cleanVal(row[1]);
          }
          if (!rawPassword) {
            rawPassword = "123456";
          }

          const appleid = getVal(row, "appleid", 4);
          const passwordappleid = getVal(row, "passwordappleid", 5);

          let rawStatus = getVal(row, "status", 6);
          // Normalisasi status: jika kosong atau "active" -> "1"
          if (!rawStatus || rawStatus.toLowerCase() === "active" || rawStatus.toLowerCase() === "aktif") {
            rawStatus = "1";
          } else if (
            rawStatus.toLowerCase() === "nonactive" ||
            rawStatus.toLowerCase() === "nonaktif" ||
            rawStatus === "0"
          ) {
            rawStatus = "0";
          } else if (rawStatus !== "1") {
            rawStatus = "1";
          }

          let gender = getVal(row, "gender", 7);
          if (gender) {
            const gUpper = gender.toUpperCase();
            if (gUpper.startsWith("L") || gUpper.includes("LAKI")) gender = "L";
            else if (gUpper.startsWith("P") || gUpper.includes("PEREMPUAN")) gender = "P";
            else gender = "L";
          } else {
            gender = "L";
          }

          const rowKelas = getVal(row, "kelas", 8);
          const rawKelas = rowKelas || (defaultKelas && defaultKelas.trim() ? defaultKelas.trim() : null);
          const kelas = rawKelas && rawKelas.toLowerCase() !== "kosong" && rawKelas !== "-" ? rawKelas : null;
          const nis = getVal(row, "nis", 9);

          const rawJenjang = getVal(row, "jenjang", -1);
          let studentJenjang = defaultJenjang || null;
          if (rawJenjang) {
            const normJ = rawJenjang.toUpperCase();
            if (normJ.includes("SMP")) studentJenjang = "SMP";
            else if (normJ.includes("SD")) studentJenjang = "SD";
          }
          if (!studentJenjang && kelas) {
            studentJenjang = resolveUserJenjang(null, "1", kelas);
          }
          if (!studentJenjang) {
            studentJenjang = defaultJenjang || "SD";
          }

          if (kelas) {
            detectedClasses.add(kelas);
          }

          let hashedPassword = passwordHashMap.get(rawPassword);
          if (!hashedPassword) {
            hashedPassword = await bcrypt.hash(rawPassword, 10);
            passwordHashMap.set(rawPassword, hashedPassword);
          }

          await prisma.user.upsert({
            where: { email },
            update: {
              name,
              password: hashedPassword,
              password1: rawPassword,
              appleid,
              passwordappleid,
              gender,
              status: rawStatus,
              ...(studentJenjang ? { jenjang: studentJenjang } : {}),
              ...(kelas ? { kelas } : {}),
              ...(nis ? { nis } : {}),
            },
            create: {
              email,
              name,
              password: hashedPassword,
              password1: rawPassword,
              appleid,
              passwordappleid,
              status: rawStatus,
              gender,
              jenjang: studentJenjang,
              kelas: kelas || null,
              nis: nis || null,
            },
          });
          importedCount++;
        })
      );
    }

    // Sinkronisasi otomatis kelas baru ke tabel `kelas` agar langsung tampil di dropdown/kelola kelas
    for (const className of detectedClasses) {
      try {
        const existingClass = await prisma.kelas.findFirst({
          where: { nama_kelas: className },
        });
        if (!existingClass) {
          let jenjang = "SD";
          let tingkat = 3;
          const matchDigit = className.match(/\b([1-9]|1[0-2])\b/) || className.match(/^(\d+)/);
          if (matchDigit) {
            const num = parseInt(matchDigit[1], 10);
            if (num >= 1 && num <= 6) {
              jenjang = "SD";
              tingkat = num;
            } else if (num >= 7 && num <= 9) {
              jenjang = "SMP";
              tingkat = num;
            } else if (num >= 10 && num <= 12) {
              jenjang = "SMA";
              tingkat = num;
            }
          } else if (className.toUpperCase().includes("SMP")) {
            jenjang = "SMP";
            tingkat = 7;
          } else if (className.toUpperCase().includes("SMA") || className.toUpperCase().includes("SMK")) {
            jenjang = "SMA";
            tingkat = 10;
          }

          await prisma.kelas.create({
            data: {
              nama_kelas: className,
              jenjang,
              tingkat,
            },
          });
        }
      } catch (err) {
        console.warn(`[importStudents] Gagal sinkronisasi kelas ${className}:`, err);
      }
    }

    return importedCount;
  }

  /**
   * Mengimpor data guru secara massal dari file Excel (base64 buffer)
   * Fleksibel terhadap kolom kosong, urutan kolom berbeda, dan membuat akun tetap berhasil diimpor.
   */
  static async importTeachersFromBase64(
    base64Data: string,
    defaultJenjang?: string | null
  ): Promise<number> {
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
          } else if (
            norm.includes("email") ||
            norm.includes("username") ||
            norm.includes("surel") ||
            norm.includes("e-mail")
          ) {
            colMap["email"] = idx;
          } else if (
            !norm.includes("username") &&
            (norm.includes("nama") || norm.includes("name"))
          ) {
            colMap["name"] = idx;
          } else if (norm.includes("apple") && (norm.includes("pass") || norm.includes("sandi") || norm.includes("pwd"))) {
            colMap["passwordappleid"] = idx;
          } else if (norm.includes("apple")) {
            colMap["appleid"] = idx;
          } else if (norm.includes("pass") || norm.includes("sandi") || norm.includes("pwd")) {
            colMap["password"] = idx;
          } else if (norm.includes("kelamin") || norm.includes("gender") || norm === "jk" || norm.includes("(l/p)")) {
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
          } else if (norm.includes("jenjang") || norm.includes("tingkat pendidikan")) {
            colMap["jenjang"] = idx;
          }
        });
        break;
      }
    }

    const getVal = (row: any[], key: string, fallbackIdx: number): string => {
      const idx = colMap[key] !== undefined ? colMap[key] : (headerRowIdx >= 0 ? -1 : fallbackIdx);
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
          const gender =
            rawGender.startsWith("P") ||
            rawGender.startsWith("W") ||
            rawGender.startsWith("M") ||
            rawGender.includes("PEREMPUAN") ||
            rawGender.includes("MUSLIMAH")
              ? "P"
              : "L";
          const guru_bidang = rawBidang || null;
          const roleStatus = rawRole.includes("wali") || rawRole === "4" ? "4" : "2";
          const kelas = rawKelas || null;
          const appleid = rawAppleId || null;
          const passwordappleid = rawPasswordApple || null;

          const rawJenjang = getVal(row, "jenjang", -1);
          let teacherJenjang: string = defaultJenjang || "SD";
          if (rawJenjang) {
            const normJ = rawJenjang.toUpperCase();
            if (normJ.includes("ALL") || normJ.includes("SEMUA") || normJ.includes("LINTAS")) {
              teacherJenjang = "ALL";
            } else if (normJ.includes("SMP")) {
              teacherJenjang = "SMP";
            } else if (normJ.includes("SD")) {
              teacherJenjang = "SD";
            }
          } else if (kelas) {
            teacherJenjang = resolveUserJenjang(null, roleStatus, kelas);
          }

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
              if (teacherJenjang) updateData.jenjang = teacherJenjang;
              if (appleid) updateData.appleid = appleid;
              if (passwordappleid) updateData.passwordappleid = passwordappleid;
              if (rawPassword) {
                if (existingUser.password1 !== passwordPlain) {
                  updateData.password = await bcrypt.hash(passwordPlain, 10);
                  updateData.password1 = passwordPlain;
                }
              }

              await prisma.user.update({
                where: { email },
                data: updateData,
              });
            } else {
              const hashedPassword = await bcrypt.hash(passwordPlain, 10);
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
                  jenjang: teacherJenjang,
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

