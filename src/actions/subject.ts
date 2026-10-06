"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { compareScheduleTime } from "@/lib/utils";

import { SubjectService } from "@/services/subject.service";

export async function getMataPelajaranList(jenjang?: string) {
  try {
    const list = await SubjectService.getMataPelajaranList(jenjang);
    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function getMataPelajaranById(id: bigint | string) {
  try {
    const mapel = await SubjectService.getMataPelajaranById(id);
    if (!mapel) return { success: false, error: "Mata pelajaran tidak ditemukan", data: null };
    return { success: true, data: mapel };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function getJadwalByKelas(namaKelas: string) {
  try {
    const sorted = await SubjectService.getJadwalByKelas(namaKelas);
    return { success: true, data: sorted };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function getJadwalByGuru(guruId: bigint | string) {
  try {
    const sorted = await SubjectService.getJadwalByGuru(guruId);
    return { success: true, data: sorted };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function createMataPelajaranAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Akses ditolak. Hanya admin yang dapat menambah mata pelajaran." };
  }

  const kode = (formData.get("kode_mapel") as string)?.trim().toUpperCase();
  const nama = (formData.get("nama_mapel") as string)?.trim();
  const jenjang = (formData.get("jenjang") as string) || "SEMUA";
  const icon = (formData.get("icon") as string) || "BookOpen";
  const warna = (formData.get("warna") as string) || "emerald";
  const deskripsi = (formData.get("deskripsi") as string) || "";

  if (!kode || !nama) {
    return { success: false, error: "Kode dan Nama mata pelajaran wajib diisi." };
  }

  try {
    await prisma.mataPelajaran.create({
      data: {
        kode_mapel: kode,
        nama_mapel: nama,
        jenjang,
        icon,
        warna,
        deskripsi,
      },
    });

    revalidatePath("/admin/subjects");
    return { success: true, message: "Mata pelajaran berhasil ditambahkan!" };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { success: false, error: `Kode mapel "${kode}" sudah terdaftar.` };
    }
    return { success: false, error: err.message || "Gagal menambahkan mata pelajaran." };
  }
}

export async function deleteMataPelajaranAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    await prisma.mataPelajaran.delete({
      where: { id: BigInt(id) },
    });
    revalidatePath("/admin/subjects");
    return { success: true, message: "Mata pelajaran berhasil dihapus." };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menghapus mata pelajaran." };
  }
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function checkTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

export interface JadwalConflictResult {
  type: "guru" | "kelas";
  message: string;
}

async function findScheduleConflicts(params: {
  kelas_id: bigint;
  guru_id: bigint;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  excludeId?: bigint;
}): Promise<JadwalConflictResult[]> {
  const sameDaySchedules = await prisma.jadwalPelajaran.findMany({
    where: {
      hari: params.hari,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    include: {
      kelas: true,
      mapel: true,
      guru: { select: { id: true, name: true } },
    },
  });

  const conflicts: JadwalConflictResult[] = [];

  for (const s of sameDaySchedules) {
    if (!checkTimeOverlap(params.jam_mulai, params.jam_selesai, s.jam_mulai, s.jam_selesai)) {
      continue;
    }

    // 1. Guru bentrok
    if (s.guru_id === params.guru_id) {
      conflicts.push({
        type: "guru",
        message: `Guru ${s.guru.name} bentrok: sudah mengajar di kelas ${s.kelas.nama_kelas} (${s.mapel.nama_mapel}, ${s.jam_mulai} - ${s.jam_selesai}).`,
      });
    }

    // 2. Kelas bentrok
    if (s.kelas_id === params.kelas_id) {
      conflicts.push({
        type: "kelas",
        message: `Kelas ${s.kelas.nama_kelas} bentrok: sudah terjadwal mapel ${s.mapel.nama_mapel} bersama ${s.guru.name} (${s.jam_mulai} - ${s.jam_selesai}).`,
      });
    }
  }

  return conflicts;
}

export async function createJadwalAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Akses ditolak." };
  }

  const kelas_id = BigInt(formData.get("kelas_id") as string);
  const mapel_id = BigInt(formData.get("mapel_id") as string);
  const guru_id = BigInt(formData.get("guru_id") as string);
  const hari = formData.get("hari") as string;
  const jam_mulai = (formData.get("jam_mulai") as string)?.trim();
  const jam_selesai = (formData.get("jam_selesai") as string)?.trim();
  const ruang = (formData.get("ruang") as string)?.trim() || null;
  const allow_conflict = formData.get("allow_conflict") === "true";

  if (!jam_mulai || !jam_selesai) {
    return { success: false, error: "Jam mulai dan jam selesai wajib diisi." };
  }

  if (parseTimeToMinutes(jam_mulai) >= parseTimeToMinutes(jam_selesai)) {
    return { success: false, error: "Jam selesai harus lebih akhir dari jam mulai." };
  }

  try {
    const conflicts = await findScheduleConflicts({
      kelas_id,
      guru_id,
      hari,
      jam_mulai,
      jam_selesai,
    });

    if (conflicts.length > 0 && !allow_conflict) {
      return {
        success: false,
        isConflict: true,
        conflicts: conflicts.map((c) => c.message),
        error: `Jadwal bentrok terdeteksi:\n${conflicts.map((c) => `• ${c.message}`).join("\n")}`,
      };
    }

    await prisma.jadwalPelajaran.create({
      data: {
        kelas_id,
        mapel_id,
        guru_id,
        hari,
        jam_mulai,
        jam_selesai,
        ruang: null,
      },
    });

    revalidatePath("/admin/schedules");
    return {
      success: true,
      message: conflicts.length > 0
        ? "Jadwal berhasil disimpan (dengan catatan bentrok)."
        : "Jadwal pelajaran berhasil ditambahkan!",
      hasConflict: conflicts.length > 0,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menambahkan jadwal." };
  }
}

export async function updateJadwalAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Akses ditolak." };
  }

  const idStr = formData.get("id") as string;
  if (!idStr) {
    return { success: false, error: "ID jadwal tidak ditemukan." };
  }
  const id = BigInt(idStr);

  const kelas_id = BigInt(formData.get("kelas_id") as string);
  const mapel_id = BigInt(formData.get("mapel_id") as string);
  const guru_id = BigInt(formData.get("guru_id") as string);
  const hari = formData.get("hari") as string;
  const jam_mulai = (formData.get("jam_mulai") as string)?.trim();
  const jam_selesai = (formData.get("jam_selesai") as string)?.trim();
  const allow_conflict = formData.get("allow_conflict") === "true";

  if (!jam_mulai || !jam_selesai) {
    return { success: false, error: "Jam mulai dan jam selesai wajib diisi." };
  }

  if (parseTimeToMinutes(jam_mulai) >= parseTimeToMinutes(jam_selesai)) {
    return { success: false, error: "Jam selesai harus lebih akhir dari jam mulai." };
  }

  try {
    const conflicts = await findScheduleConflicts({
      kelas_id,
      guru_id,
      hari,
      jam_mulai,
      jam_selesai,
      excludeId: id,
    });

    if (conflicts.length > 0 && !allow_conflict) {
      return {
        success: false,
        isConflict: true,
        conflicts: conflicts.map((c) => c.message),
        error: `Jadwal bentrok terdeteksi:\n${conflicts.map((c) => `• ${c.message}`).join("\n")}`,
      };
    }

    await prisma.jadwalPelajaran.update({
      where: { id },
      data: {
        kelas_id,
        mapel_id,
        guru_id,
        hari,
        jam_mulai,
        jam_selesai,
        ruang: null,
      },
    });

    revalidatePath("/admin/schedules");
    return {
      success: true,
      message: conflicts.length > 0
        ? "Perubahan jadwal disimpan (dengan catatan bentrok)."
        : "Jadwal pelajaran berhasil diperbarui!",
      hasConflict: conflicts.length > 0,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui jadwal." };
  }
}

export async function deleteJadwalAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    await prisma.jadwalPelajaran.delete({
      where: { id: BigInt(id) },
    });
    revalidatePath("/admin/schedules");
    return { success: true, message: "Jadwal berhasil dihapus." };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menghapus jadwal." };
  }
}
