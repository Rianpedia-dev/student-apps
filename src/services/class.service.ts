import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { AppError, NotFoundError, ValidationError } from "@/lib/errors";
import { serializeBigInt } from "@/lib/serializer";

export interface CreateClassInput {
  nama_kelas: string;
  jenjang?: string | null;
  tingkat?: number | null;
  wali_kelas?: string | null;
  jumlah_siswa?: string | null;
  code_restrict?: string | null;
}

export interface UpdateClassInput extends CreateClassInput {
  id: string;
}

export class ClassService {
  /**
   * Membuat rombel / kelas baru
   */
  static async createClass(data: CreateClassInput) {
    if (!data.nama_kelas || data.nama_kelas.trim().length === 0) {
      throw new ValidationError("Nama kelas wajib diisi.");
    }

    // Auto detect jenjang & tingkat if not given
    const detectedJenjang = data.jenjang || (/^(7|8|9|smp)/i.test(data.nama_kelas.trim()) ? "SMP" : "SD");
    const matchTingkat = data.nama_kelas.match(/\b([1-9]|1[0-2])\b/);
    const detectedTingkat = data.tingkat ?? (matchTingkat ? parseInt(matchTingkat[1], 10) : null);

    const created = await prisma.kelas.create({
      data: {
        nama_kelas: data.nama_kelas,
        jenjang: detectedJenjang,
        tingkat: detectedTingkat,
        wali_kelas: data.wali_kelas || null,
        jumlah_siswa: data.jumlah_siswa || null,
        code_restrict: data.code_restrict || null,
      },
    });

    if (data.code_restrict) {
      await prisma.restrict.create({
        data: {
          nama_kelas: data.nama_kelas,
          code_restrict: data.code_restrict,
        },
      });
    }

    return serializeBigInt(created);
  }

  /**
   * Memperbarui informasi kelas dan wali kelas
   */
  static async updateClass(data: UpdateClassInput) {
    const existing = await prisma.kelas.findUnique({
      where: { id: BigInt(data.id) },
    });

    if (!existing) {
      throw new NotFoundError("Kelas tidak ditemukan.");
    }

    const detectedJenjang = data.jenjang || (/^(7|8|9|smp)/i.test(data.nama_kelas.trim()) ? "SMP" : "SD");
    const matchTingkat = data.nama_kelas.match(/\b([1-9]|1[0-2])\b/);
    const detectedTingkat = data.tingkat ?? (matchTingkat ? parseInt(matchTingkat[1], 10) : null);

    // Jika nama kelas berubah, sinkronkan referensi di user dan restrict
    if (existing.nama_kelas !== data.nama_kelas) {
      await prisma.user.updateMany({
        where: { kelas: existing.nama_kelas },
        data: { kelas: data.nama_kelas },
      });
      await prisma.restrict.updateMany({
        where: { nama_kelas: existing.nama_kelas },
        data: { nama_kelas: data.nama_kelas },
      });
    }

    const updated = await prisma.kelas.update({
      where: { id: BigInt(data.id) },
      data: {
        nama_kelas: data.nama_kelas,
        jenjang: detectedJenjang,
        tingkat: detectedTingkat,
        wali_kelas: data.wali_kelas || null,
        jumlah_siswa: data.jumlah_siswa || null,
        code_restrict: data.code_restrict || null,
        kode_restrict: data.code_restrict || null,
      },
    });

    // Sinkronkan kode restrict di tabel restrict
    if (data.code_restrict) {
      const existingRestrict = await prisma.restrict.findFirst({
        where: { nama_kelas: data.nama_kelas },
      });
      if (existingRestrict) {
        await prisma.restrict.update({
          where: { id: existingRestrict.id },
          data: { code_restrict: data.code_restrict },
        });
      } else {
        await prisma.restrict.create({
          data: {
            nama_kelas: data.nama_kelas,
            code_restrict: data.code_restrict,
          },
        });
      }
    }

    return serializeBigInt(updated);
  }

  /**
   * Menghapus data kelas
   */
  static async deleteClass(id: string) {
    const existing = await prisma.kelas.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundError("Kelas tidak ditemukan.");
    }

    if (existing.nama_kelas) {
      await prisma.restrict.deleteMany({
        where: { nama_kelas: existing.nama_kelas },
      });
      await prisma.user.updateMany({
        where: { kelas: existing.nama_kelas, status: "4" },
        data: { kelas: null },
      });
    }

    await prisma.kelas.delete({
      where: { id: BigInt(id) },
    });

    return true;
  }

  /**
   * Menghapus beberapa kelas secara massal (bulk delete)
   */
  static async deleteClasses(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    const bigIntIds = ids.map((id) => BigInt(id));

    // Dapatkan nama_kelas dari kelas yang akan dihapus
    const targetClasses = await prisma.kelas.findMany({
      where: { id: { in: bigIntIds } },
      select: { nama_kelas: true },
    });
    const classNames = targetClasses.map((c) => c.nama_kelas).filter(Boolean);

    if (classNames.length > 0) {
      await prisma.restrict.deleteMany({
        where: { nama_kelas: { in: classNames } },
      });
      await prisma.user.updateMany({
        where: { kelas: { in: classNames }, status: "4" },
        data: { kelas: null },
      });
    }

    const res = await prisma.kelas.deleteMany({
      where: { id: { in: bigIntIds } },
    });

    return res.count;
  }

  /**
   * Mengimpor data kelas secara massal dari file Excel (base64 buffer)
   */
  static async importClassesFromBase64(base64Data: string, defaultJenjang?: string | null): Promise<number> {
    const buffer = Buffer.from(base64Data, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });

    // Cari sheet yang relevan: prioritaskan sheet dengan nama kelas/rombel, atau sheet pertama
    let sheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      const lower = name.toLowerCase();
      if (lower.includes("kelas") || lower.includes("class") || lower.includes("rombel")) {
        sheetName = name;
        break;
      }
    }

    if (!sheetName) {
      throw new AppError("File Excel tidak memiliki lembar kerja (sheet).");
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
    if (!rows || rows.length === 0) return 0;

    // Deteksi letak header row dan pemetaan kolom
    let headerRowIdx = -1;
    const colMap: Record<string, number> = {};

    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const joined = row.map((c) => String(c ?? "").trim().toLowerCase()).join(" ");

      if (
        joined.includes("nama") ||
        joined.includes("kelas") ||
        joined.includes("jenjang") ||
        joined.includes("tingkat") ||
        joined.includes("wali") ||
        joined.includes("restrict")
      ) {
        headerRowIdx = r;
        row.forEach((col, idx) => {
          const norm = String(col ?? "").trim().toLowerCase();
          if (
            norm === "nama kelas" ||
            norm === "nama_kelas" ||
            norm === "nama rombel" ||
            norm === "nama" ||
            norm === "kelas" ||
            norm === "rombel" ||
            norm.includes("nama kelas")
          ) {
            colMap["nama_kelas"] = idx;
          } else if (norm.includes("jenjang") || norm.includes("tingkat pendidikan")) {
            colMap["jenjang"] = idx;
          } else if (norm.includes("tingkat") || norm === "grade" || norm.includes("level")) {
            colMap["tingkat"] = idx;
          } else if (norm.includes("wali") || norm.includes("walikelas")) {
            colMap["wali_kelas"] = idx;
          } else if (
            norm.includes("jumlah") ||
            norm.includes("kapasitas") ||
            norm.includes("kuota") ||
            norm.includes("perkiraan") ||
            norm.includes("siswa")
          ) {
            colMap["jumlah_siswa"] = idx;
          } else if (norm.includes("restrict") || norm.includes("kode ipad") || norm.includes("code ipad")) {
            colMap["code_restrict"] = idx;
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
      const idx = colMap[key] !== undefined ? colMap[key] : fallbackIdx;
      if (idx >= 0 && idx < row.length) {
        return cleanVal(row[idx]);
      }
      return null;
    };

    const dataRows = headerRowIdx >= 0 ? rows.slice(headerRowIdx + 1) : rows.slice(1);
    let importedCount = 0;

    for (const row of dataRows) {
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      // Fallback: 0: Nama Kelas, 1: Jenjang, 2: Tingkat, 3: Wali Kelas, 4: Kapasitas Siswa, 5: Code Restrict
      const namaKelasRaw = getVal(row, "nama_kelas", 0);
      if (!namaKelasRaw) continue;

      const rawJenjang = getVal(row, "jenjang", 1);
      const rawTingkat = getVal(row, "tingkat", 2);
      const waliKelas = getVal(row, "wali_kelas", 3);
      const jumlahSiswa = getVal(row, "jumlah_siswa", 4);
      const codeRestrict = getVal(row, "code_restrict", 5);

      // Auto detect jenjang
      let detectedJenjang = defaultJenjang || "SD";
      if (rawJenjang) {
        const normJ = rawJenjang.toUpperCase();
        if (normJ.includes("SMP")) detectedJenjang = "SMP";
        else if (normJ.includes("SD")) detectedJenjang = "SD";
      } else if (
        /^(7|8|9|smp)/i.test(namaKelasRaw.trim()) ||
        namaKelasRaw.includes("Kelas 7") ||
        namaKelasRaw.includes("Kelas 8") ||
        namaKelasRaw.includes("Kelas 9")
      ) {
        detectedJenjang = "SMP";
      }

      // Auto detect tingkat
      let detectedTingkat: number | null = null;
      if (rawTingkat) {
        const parsed = parseInt(rawTingkat.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed)) detectedTingkat = parsed;
      }
      if (!detectedTingkat) {
        const matchTingkat = namaKelasRaw.match(/\b([1-9]|1[0-2])\b/);
        detectedTingkat = matchTingkat ? parseInt(matchTingkat[1], 10) : detectedJenjang === "SMP" ? 7 : 4;
      }

      // Cek apakah kelas sudah terdaftar berdasarkan nama_kelas
      const existing = await prisma.kelas.findFirst({
        where: { nama_kelas: namaKelasRaw },
      });

      if (existing) {
        await prisma.kelas.update({
          where: { id: existing.id },
          data: {
            jenjang: detectedJenjang,
            tingkat: detectedTingkat,
            wali_kelas: waliKelas !== null ? waliKelas : existing.wali_kelas,
            jumlah_siswa: jumlahSiswa !== null ? jumlahSiswa : existing.jumlah_siswa,
            code_restrict: codeRestrict !== null ? codeRestrict : existing.code_restrict,
            kode_restrict: codeRestrict !== null ? codeRestrict : existing.kode_restrict,
          },
        });
      } else {
        await prisma.kelas.create({
          data: {
            nama_kelas: namaKelasRaw,
            jenjang: detectedJenjang,
            tingkat: detectedTingkat,
            wali_kelas: waliKelas,
            jumlah_siswa: jumlahSiswa,
            code_restrict: codeRestrict,
            kode_restrict: codeRestrict,
          },
        });
      }

      // Update tabel restrict jika ada code_restrict
      if (codeRestrict) {
        const existingRestrict = await prisma.restrict.findFirst({
          where: { nama_kelas: namaKelasRaw },
        });
        if (existingRestrict) {
          await prisma.restrict.update({
            where: { id: existingRestrict.id },
            data: { code_restrict: codeRestrict },
          });
        } else {
          await prisma.restrict.create({
            data: {
              nama_kelas: namaKelasRaw,
              code_restrict: codeRestrict,
            },
          });
        }
      }

      importedCount++;
    }

    return importedCount;
  }

  /**
   * Memperbarui kode restrict iPad per kelas
   */
  static async updateRestrictCode(id: string, code_restrict: string) {
    const updated = await prisma.restrict.update({
      where: { id: BigInt(id) },
      data: { code_restrict },
    });

    return serializeBigInt(updated);
  }
}
