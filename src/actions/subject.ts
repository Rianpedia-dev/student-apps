"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMataPelajaranList(jenjang?: string) {
  try {
    const where = jenjang && jenjang !== "SEMUA" 
      ? { OR: [{ jenjang }, { jenjang: "SEMUA" }] } 
      : {};
    const list = await prisma.mataPelajaran.findMany({
      where,
      orderBy: { nama_mapel: "asc" },
    });
    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function getMataPelajaranById(id: bigint | string) {
  try {
    const isNum = /^\d+$/.test(String(id));
    if (!isNum) return { success: false, error: "ID tidak valid", data: null };

    const mapel = await prisma.mataPelajaran.findUnique({
      where: { id: BigInt(id) },
    });
    return { success: true, data: mapel };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function getJadwalByKelas(namaKelas: string) {
  try {
    const kelas = await prisma.kelas.findFirst({
      where: { nama_kelas: namaKelas },
    });
    if (!kelas) return { success: false, data: [] };

    const jadwal = await prisma.jadwalPelajaran.findMany({
      where: { kelas_id: kelas.id },
      include: {
        mapel: true,
        guru: {
          select: { id: true, name: true, image: true, email: true, guru_bidang: true },
        },
      },
      orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
    });

    return { success: true, data: jadwal };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function getJadwalByGuru(guruId: bigint | string) {
  try {
    const isNum = /^\d+$/.test(String(guruId));
    if (!isNum) return { success: false, data: [] };

    const jadwal = await prisma.jadwalPelajaran.findMany({
      where: { guru_id: BigInt(guruId) },
      include: {
        kelas: true,
        mapel: true,
      },
      orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
    });

    return { success: true, data: jadwal };
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

export async function createJadwalAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Akses ditolak." };
  }

  const kelas_id = BigInt(formData.get("kelas_id") as string);
  const mapel_id = BigInt(formData.get("mapel_id") as string);
  const guru_id = BigInt(formData.get("guru_id") as string);
  const hari = formData.get("hari") as string;
  const jam_mulai = formData.get("jam_mulai") as string;
  const jam_selesai = formData.get("jam_selesai") as string;
  const ruang = (formData.get("ruang") as string) || null;

  try {
    await prisma.jadwalPelajaran.create({
      data: {
        kelas_id,
        mapel_id,
        guru_id,
        hari,
        jam_mulai,
        jam_selesai,
        ruang,
      },
    });

    revalidatePath("/admin/schedules");
    return { success: true, message: "Jadwal pelajaran berhasil ditambahkan!" };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menambahkan jadwal." };
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
