import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { compareScheduleTime } from "@/lib/utils";
import { serializeBigInt } from "@/lib/serializer";
import { AppError } from "@/lib/errors";

export class SubjectService {
  /**
   * Mengambil daftar mata pelajaran, opsional filter jenjang
   */
  static async getMataPelajaranList(jenjang?: string) {
    const where = jenjang && jenjang !== "SEMUA"
      ? { OR: [{ jenjang }, { jenjang: "SEMUA" }] }
      : {};

    const list = await prisma.mataPelajaran.findMany({
      where,
      orderBy: { nama_mapel: "asc" },
    });

    return serializeBigInt(list);
  }

  /**
   * Mengambil detail mata pelajaran berdasarkan ID
   */
  static async getMataPelajaranById(id: bigint | string) {
    const isNum = /^\d+$/.test(String(id));
    if (!isNum) return null;

    const mapel = await prisma.mataPelajaran.findUnique({
      where: { id: BigInt(id) },
    });

    return mapel ? serializeBigInt(mapel) : null;
  }

  /**
   * Mengambil jadwal pelajaran berdasarkan nama kelas
   */
  static async getJadwalByKelas(namaKelas: string) {
    const kelas = await prisma.kelas.findFirst({
      where: { nama_kelas: namaKelas },
    });
    if (!kelas) return [];

    const jadwal = await prisma.jadwalPelajaran.findMany({
      where: { kelas_id: kelas.id },
      include: {
        mapel: true,
        guru: {
          select: { id: true, name: true, image: true, email: true, guru_bidang: true },
        },
      },
    });

    const sorted = [...jadwal].sort((a, b) => {
      const comp = compareScheduleTime(
        a.hari,
        a.jam_mulai,
        a.jam_selesai,
        b.hari,
        b.jam_mulai,
        b.jam_selesai
      );
      if (comp !== 0) return comp;
      return (a.mapel?.nama_mapel || "").localeCompare(b.mapel?.nama_mapel || "");
    });

    return serializeBigInt(sorted);
  }

  /**
   * Mengambil jadwal mengajar guru berdasarkan guruId
   */
  static async getJadwalByGuru(guruId: bigint | string) {
    const isNum = /^\d+$/.test(String(guruId));
    if (!isNum) return [];

    const jadwal = await prisma.jadwalPelajaran.findMany({
      where: { guru_id: BigInt(guruId) },
      include: {
        mapel: true,
        kelas: true,
      },
    });

    const sorted = [...jadwal].sort((a, b) =>
      compareScheduleTime(
        a.hari,
        a.jam_mulai,
        a.jam_selesai,
        b.hari,
        b.jam_mulai,
        b.jam_selesai
      )
    );

    return serializeBigInt(sorted);
  }

  /**
   * Menghapus beberapa mata pelajaran secara massal (bulk delete)
   */
  static async deleteMataPelajaranBulk(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    const bigIntIds = ids.map((id) => BigInt(id));

    const res = await prisma.mataPelajaran.deleteMany({
      where: { id: { in: bigIntIds } },
    });

    return res.count;
  }

  /**
   * Mengimpor data mata pelajaran dari spreadsheet Excel (base64 buffer)
   */
  static async importMataPelajaranFromBase64(
    base64Data: string,
    defaultJenjang?: string | null
  ): Promise<number> {
    const buffer = Buffer.from(base64Data, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });

    // Prioritaskan sheet dengan nama mapel / subject, atau gunakan sheet pertama
    let sheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      const lower = name.toLowerCase();
      if (lower.includes("mapel") || lower.includes("mata pelajaran") || lower.includes("subject")) {
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
        joined.includes("kode") ||
        joined.includes("nama") ||
        joined.includes("mapel") ||
        joined.includes("mata pelajaran") ||
        joined.includes("jenjang")
      ) {
        headerRowIdx = r;
        row.forEach((col, idx) => {
          const norm = String(col ?? "").trim().toLowerCase();
          if (
            norm === "kode" ||
            norm === "kode_mapel" ||
            norm === "kode mapel" ||
            norm.includes("kode")
          ) {
            colMap["kode_mapel"] = idx;
          } else if (
            norm === "nama" ||
            norm === "nama_mapel" ||
            norm === "nama mapel" ||
            norm === "mata pelajaran" ||
            norm.includes("mata pelajaran") ||
            norm.includes("nama mapel")
          ) {
            colMap["nama_mapel"] = idx;
          } else if (norm.includes("jenjang") || norm.includes("tingkat")) {
            colMap["jenjang"] = idx;
          } else if (norm.includes("warna") || norm.includes("color") || norm.includes("badge")) {
            colMap["warna"] = idx;
          } else if (norm.includes("deskripsi") || norm.includes("keterangan") || norm.includes("silabus")) {
            colMap["deskripsi"] = idx;
          }
        });
        break;
      }
    }

    // Jika header tidak terdeteksi di 5 baris pertama, gunakan default urutan kolom:
    // 0: Kode, 1: Nama, 2: Jenjang, 3: Deskripsi
    if (headerRowIdx === -1) {
      headerRowIdx = 0;
      colMap["kode_mapel"] = 0;
      colMap["nama_mapel"] = 1;
      colMap["jenjang"] = 2;
      colMap["deskripsi"] = 3;
    }

    const dataRows = rows.slice(headerRowIdx + 1);
    let importedCount = 0;

    const allowedWarna = ["emerald", "indigo", "violet", "amber", "rose", "teal"];

    for (const row of dataRows) {
      if (!Array.isArray(row)) continue;

      const getVal = (field: string, fallbackIdx?: number): string => {
        const idx = colMap[field] ?? fallbackIdx;
        if (idx !== undefined && idx >= 0 && idx < row.length) {
          return String(row[idx] ?? "").trim();
        }
        return "";
      };

      const rawKode = getVal("kode_mapel", 0).toUpperCase();
      const rawNama = getVal("nama_mapel", 1);
      let rawJenjang = getVal("jenjang", 2).toUpperCase();
      let rawWarna = getVal("warna").toLowerCase();
      const rawDeskripsi = getVal("deskripsi", 3);

      // Baris kosong atau tidak valid dilewati
      if (!rawKode || !rawNama || rawKode.toLowerCase() === "kode" || rawNama.toLowerCase() === "nama") {
        continue;
      }

      // Normalisasi jenjang
      if (rawJenjang.includes("SD") && rawJenjang.includes("SMP")) {
        rawJenjang = "SEMUA";
      } else if (rawJenjang.includes("SD")) {
        rawJenjang = "SD";
      } else if (rawJenjang.includes("SMP")) {
        rawJenjang = "SMP";
      } else if (!["SD", "SMP", "SEMUA"].includes(rawJenjang)) {
        rawJenjang = defaultJenjang && ["SD", "SMP", "SEMUA"].includes(defaultJenjang) ? defaultJenjang : "SEMUA";
      }

      // Warna badge otomatis dipilih secara random jika tidak disediakan di Excel
      if (!rawWarna || !allowedWarna.includes(rawWarna)) {
        rawWarna = allowedWarna[Math.floor(Math.random() * allowedWarna.length)];
      }

      await prisma.mataPelajaran.upsert({
        where: { kode_mapel: rawKode },
        update: {
          nama_mapel: rawNama,
          jenjang: rawJenjang,
          warna: rawWarna,
          deskripsi: rawDeskripsi || null,
        },
        create: {
          kode_mapel: rawKode,
          nama_mapel: rawNama,
          jenjang: rawJenjang,
          warna: rawWarna,
          icon: "BookOpen",
          deskripsi: rawDeskripsi || null,
        },
      });

      importedCount++;
    }

    return importedCount;
  }
}
