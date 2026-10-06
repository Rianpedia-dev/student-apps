import prisma from "@/lib/prisma";
import { compareScheduleTime } from "@/lib/utils";
import { serializeBigInt } from "@/lib/serializer";

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
}
