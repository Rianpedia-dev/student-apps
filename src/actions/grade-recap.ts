"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  buildMapelGradeRecapMatrix,
  type MapelGradeRecapPayload,
} from "@/lib/grade-recap-utils";

export interface GetMapelGradeRecapResult {
  success: boolean;
  data?: MapelGradeRecapPayload;
  error?: string;
}

/**
 * Mengambil rekapitulasi nilai seluruh tugas pada satu mata pelajaran & kelas (on-demand saat guru mengunduh).
 */
export async function getMapelGradeRecapAction(input: {
  mapelId: string;
  kelasId: string;
}): Promise<GetMapelGradeRecapResult> {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return {
      success: false,
      error: "Akses ditolak. Hanya guru atau admin yang dapat mengunduh rekap nilai.",
    };
  }

  const mapelIdStr = String(input.mapelId || "").trim();
  const kelasIdStr = String(input.kelasId || "").trim();

  if (!/^\d+$/.test(mapelIdStr) || !/^\d+$/.test(kelasIdStr)) {
    return {
      success: false,
      error: "Parameter mata pelajaran atau kelas tidak valid.",
    };
  }

  const mapelBigInt = BigInt(mapelIdStr);
  const kelasBigInt = BigInt(kelasIdStr);

  try {
    const [mapel, kelas] = await Promise.all([
      prisma.mataPelajaran.findUnique({
        where: { id: mapelBigInt },
        select: { id: true, kode_mapel: true, nama_mapel: true },
      }),
      prisma.kelas.findUnique({
        where: { id: kelasBigInt },
        select: { id: true, nama_kelas: true, jenjang: true },
      }),
    ]);

    if (!mapel || !kelas) {
      return {
        success: false,
        error: "Data mata pelajaran atau kelas tidak ditemukan.",
      };
    }

    // Verifikasi otorisasi guru pengampu pada mapel & kelas terkait
    if (session.role === "guru") {
      const guruBigInt = BigInt(session.id);
      const [hasSchedule, hasTask, hasMeeting] = await Promise.all([
        prisma.jadwalPelajaran.findFirst({
          where: { mapel_id: mapel.id, kelas_id: kelas.id, guru_id: guruBigInt },
          select: { id: true },
        }),
        prisma.tugas.findFirst({
          where: { mapel_id: mapel.id, kelas_id: kelas.id, guru_id: guruBigInt },
          select: { id: true },
        }),
        prisma.pertemuan.findFirst({
          where: { mapel_id: mapel.id, kelas_id: kelas.id, guru_id: guruBigInt },
          select: { id: true },
        }),
      ]);

      if (!hasSchedule && !hasTask && !hasMeeting) {
        return {
          success: false,
          error: "Anda tidak terdaftar sebagai pengampu mata pelajaran di kelas ini.",
        };
      }
    }

    const [students, rawTasks] = await Promise.all([
      prisma.user.findMany({
        where: {
          kelas: kelas.nama_kelas,
          status: "1",
        },
        select: {
          id: true,
          name: true,
          nis: true,
          gender: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.tugas.findMany({
        where: {
          kelas_id: kelas.id,
          mapel_id: mapel.id,
        },
        include: {
          pertemuan: {
            select: {
              pertemuan_ke: true,
              judul: true,
            },
          },
          submissions: {
            select: {
              siswa_id: true,
              status: true,
              nilai: true,
              submitted_at: true,
            },
          },
        },
      }),
    ]);

    const payload = buildMapelGradeRecapMatrix({
      meta: {
        mapelId: mapel.id.toString(),
        mapelNama: mapel.nama_mapel,
        mapelKode: mapel.kode_mapel,
        kelasId: kelas.id.toString(),
        kelasNama: kelas.nama_kelas,
        jenjang: kelas.jenjang,
        guruNama: session.name || "Dewan Guru",
        generatedAt: new Date().toISOString(),
      },
      students: students.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        nis: s.nis,
        gender: s.gender,
      })),
      tasks: rawTasks.map((t) => ({
        id: t.id.toString(),
        judul: t.judul,
        tipePengerjaan: t.tipe_pengerjaan,
        pertemuanKe: t.pertemuan ? t.pertemuan.pertemuan_ke : null,
        pertemuanJudul: t.pertemuan ? t.pertemuan.judul : null,
        deadline: t.deadline.toISOString(),
        createdAt: t.created_at ? t.created_at.toISOString() : null,
        poinMaksimal: t.poin_maksimal,
        submissions: t.submissions.map((sub) => ({
          siswaId: sub.siswa_id.toString(),
          status: sub.status,
          nilai: sub.nilai,
          submittedAt: sub.submitted_at ? sub.submitted_at.toISOString() : null,
        })),
      })),
    });

    return {
      success: true,
      data: payload,
    };
  } catch (error) {
    console.error("[getMapelGradeRecapAction Error]:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyiapkan rekapitulasi nilai tugas.",
    };
  }
}

