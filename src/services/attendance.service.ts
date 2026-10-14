import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface AttendanceRecordItem {
  userId: string;
  keterangan: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  name: string;
  nis: string;
  gender: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  daily: Record<number, string>;
}

export class AttendanceService {
  /**
   * Menyimpan / memperbarui presensi harian per kelas secara batch (transaksional).
   *
   * Catatan performa: operasi ini sengaja dibuat dalam sedikit mungkin
   * round-trip. Database berada di remote (TiDB Cloud) dengan latensi tinggi,
   * sehingga N upsert sekuensial di dalam satu transaksi bisa melewati batas
   * timeout transaksi Prisma dan gagal secara intermiten.
   */
  static async recordAttendance(
    date: string,
    kelas: string,
    records: AttendanceRecordItem[]
  ) {
    if (records.length === 0) return true;

    const month = date.split("-")[1] || String(new Date().getMonth() + 1);

    // Normalisasi & deduplikasi: satu siswa hanya boleh punya satu baris per tanggal.
    const deduped = new Map<string, string>();
    for (const record of records) {
      if (!record?.userId) continue;
      deduped.set(String(record.userId), record.keterangan);
    }
    if (deduped.size === 0) return true;

    const userIds = Array.from(deduped.keys()).map((id) => BigInt(id));

    // Round-trip #1: tentukan siswa yang sudah punya baris absensi pada tanggal ini.
    const existing = await prisma.absen.findMany({
      where: { date, user_id: { in: userIds } },
      select: { user_id: true },
    });
    const existingIds = new Set(existing.map((e) => e.user_id.toString()));

    const toCreate: Prisma.AbsenCreateManyInput[] = [];
    const idsByKeterangan = new Map<string, bigint[]>();

    for (const [id, keterangan] of deduped) {
      if (existingIds.has(id)) {
        const group = idsByKeterangan.get(keterangan) ?? [];
        group.push(BigInt(id));
        idsByKeterangan.set(keterangan, group);
      } else {
        toCreate.push({
          user_id: BigInt(id),
          kelas,
          keterangan,
          date,
          month,
        });
      }
    }

    // Bangun operasi transaksi. Jumlahnya berkisar 2-5 buah (bukan N siswa),
    // karena pembaruan dikelompokkan per nilai keterangan yang unik.
    const operations: Prisma.PrismaPromise<unknown>[] = [];

    if (toCreate.length > 0) {
      operations.push(
        prisma.absen.createMany({ data: toCreate, skipDuplicates: true })
      );
    }

    for (const [keterangan, ids] of idsByKeterangan) {
      operations.push(
        prisma.absen.updateMany({
          where: { date, user_id: { in: ids } },
          data: { keterangan, kelas, month },
        })
      );
    }

    if (operations.length === 0) return true;

    // Timeout eksplisit sebagai jaring pengaman untuk kelas besar / jaringan lambat.
    await prisma.$transaction(operations, { timeout: 30000 });
    return true;
  }

  /**
   * Menghapus seluruh data presensi untuk tanggal dan kelas tertentu
   */
  static async deleteAttendanceByDate(date: string, kelas: string) {
    const result = await prisma.absen.deleteMany({
      where: {
        date,
        kelas,
      },
    });

    return result.count;
  }

  /**
   * Mengambil rekap presensi bulanan beserta matriks harian per siswa
   */
  static async getAttendanceRecap(
    kelas: string,
    month: number,
    year: number
  ): Promise<{
    kelas: string;
    month: number;
    year: number;
    daysInMonth: number;
    data: StudentAttendanceSummary[];
  }> {
    const students = await prisma.user.findMany({
      where: { kelas, status: "1" },
      orderBy: { name: "asc" },
    });

    const attendanceList = await prisma.absen.findMany({
      where: {
        kelas,
        month: String(month),
      },
    });

    const daysInMonth = new Date(year, month, 0).getDate();

    const report: StudentAttendanceSummary[] = students.map((student) => {
      const studentAbsens = attendanceList.filter((a) => a.user_id === student.id);
      let hadir = 0,
        sakit = 0,
        izin = 0,
        alpha = 0;
      const dailyMap: Record<number, string> = {};

      studentAbsens.forEach((a) => {
        const parts = (a.date || "").split("-");
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          dailyMap[day] = a.keterangan || "";
        }
        if (a.keterangan === "Hadir") hadir++;
        else if (a.keterangan === "Sakit") sakit++;
        else if (a.keterangan === "Izin") izin++;
        else if (a.keterangan === "Alpha") alpha++;
      });

      return {
        studentId: student.id.toString(),
        name: student.name,
        nis: student.nis || "-",
        gender: student.gender || "L",
        hadir,
        sakit,
        izin,
        alpha,
        daily: dailyMap,
      };
    });

    return {
      kelas,
      month,
      year,
      daysInMonth,
      data: report,
    };
  }

  /**
   * Mengambil status kehadiran per tanggal dalam satu bulan untuk kalender interaktif
   */
  static async getMonthlyStatus(kelas: string, monthStr: string) {
    const records = await prisma.absen.findMany({
      where: {
        kelas,
        month: monthStr,
      },
      select: {
        date: true,
        keterangan: true,
      },
    });

    // Map tanggal -> ada absensi
    const dateSet = new Set<string>();
    records.forEach((r) => {
      if (r.date) dateSet.add(r.date);
    });

    return Array.from(dateSet);
  }
}
