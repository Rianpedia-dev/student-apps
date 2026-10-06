import prisma from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serializer";

export interface CreatePertemuanData {
  kelas_id: string | bigint;
  mapel_id: string | bigint;
  guru_id: string | bigint;
  pertemuan_ke: number;
  judul: string;
  deskripsi?: string | null;
  tanggal: string | Date;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  video_url?: string | null;
  link_eksternal?: string | null;
  is_published?: boolean;
}

export class MeetingService {
  /**
   * Mengambil daftar pertemuan untuk mapel dan kelas tertentu
   */
  static async getPertemuanList(
    kelasId: string | bigint,
    mapelId: string | bigint,
    options?: { onlyPublished?: boolean; studentId?: bigint }
  ) {
    const kId = BigInt(kelasId);
    const mId = BigInt(mapelId);

    const whereClause: any = {
      kelas_id: kId,
      mapel_id: mId,
    };

    if (options?.onlyPublished) {
      whereClause.is_published = true;
    }

    const pertemuanList = await prisma.pertemuan.findMany({
      where: whereClause,
      include: {
        guru: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            guru_bidang: true,
          },
        },
        tugas: {
          include: {
            submissions: options?.studentId
              ? {
                  where: { siswa_id: options.studentId },
                }
              : false,
          },
        },
        progressSiswa: options?.studentId
          ? {
              where: { siswa_id: options.studentId },
            }
          : false,
      },
      orderBy: [{ pertemuan_ke: "asc" }, { tanggal: "asc" }],
    });

    return serializeBigInt(pertemuanList);
  }

  /**
   * Mengambil detail pertemuan spesifik
   */
  static async getPertemuanDetail(pertemuanId: string | bigint, studentId?: bigint) {
    const pId = BigInt(pertemuanId);

    const detail = await prisma.pertemuan.findUnique({
      where: { id: pId },
      include: {
        kelas: true,
        mapel: true,
        guru: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            guru_bidang: true,
          },
        },
        tugas: {
          include: {
            submissions: studentId
              ? {
                  where: { siswa_id: studentId },
                }
              : false,
          },
        },
        progressSiswa: studentId
          ? {
              where: { siswa_id: studentId },
            }
          : false,
      },
    });

    return detail ? serializeBigInt(detail) : null;
  }

  /**
   * Membuat pertemuan baru
   */
  static async createPertemuan(data: CreatePertemuanData) {
    const created = await prisma.pertemuan.create({
      data: {
        kelas_id: BigInt(data.kelas_id),
        mapel_id: BigInt(data.mapel_id),
        guru_id: BigInt(data.guru_id),
        pertemuan_ke: data.pertemuan_ke,
        judul: data.judul,
        deskripsi: data.deskripsi || null,
        tanggal: new Date(data.tanggal),
        file_url: data.file_url || null,
        file_name: data.file_name || null,
        file_size: data.file_size || null,
        file_type: data.file_type || null,
        video_url: data.video_url || null,
        link_eksternal: data.link_eksternal || null,
        is_published: data.is_published ?? true,
      },
    });

    return serializeBigInt(created);
  }

  /**
   * Menghapus pertemuan
   */
  static async deletePertemuan(id: string | bigint) {
    return await prisma.pertemuan.delete({
      where: { id: BigInt(id) },
    });
  }
}
