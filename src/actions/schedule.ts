"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  parseScheduleExcelBuffer,
  generateScheduleTemplateBuffer,
  ScheduleReferenceData,
} from "@/lib/excel-schedules";

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Akses ditolak. Tindakan ini memerlukan hak Administrator.");
  }
  return session;
}

/**
 * Mengambil data referensi kelas, mata pelajaran, dan guru untuk validasi import dan template.
 */
export async function getScheduleReferenceDataAction(): Promise<{
  success: boolean;
  data?: ScheduleReferenceData;
  error?: string;
}> {
  try {
    await checkAdmin();

    const [classes, subjects, teachers] = await Promise.all([
      prisma.kelas.findMany({
        select: { id: true, nama_kelas: true, jenjang: true },
        orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
      }),
      prisma.mataPelajaran.findMany({
        select: { id: true, nama_mapel: true, kode_mapel: true, jenjang: true },
        orderBy: { nama_mapel: "asc" },
      }),
      prisma.user.findMany({
        where: { status: { in: ["2", "4"] } },
        select: { id: true, name: true, nip: true, guru_bidang: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      success: true,
      data: {
        classes: classes.map((c) => ({
          id: c.id.toString(),
          nama: c.nama_kelas,
          jenjang: c.jenjang || "SD",
        })),
        subjects: subjects.map((m) => ({
          id: m.id.toString(),
          nama: m.nama_mapel,
          kode: m.kode_mapel,
          jenjang: m.jenjang || "SEMUA",
        })),
        teachers: teachers.map((t) => ({
          id: t.id.toString(),
          nama: t.name,
          nip: t.nip || "-",
          guru_bidang: t.guru_bidang || "-",
        })),
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memuat data referensi jadwal.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Mengunduh template Excel jadwal pelajaran dalam format base64.
 */
export async function downloadScheduleTemplateAction(): Promise<{
  success: boolean;
  base64?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const refRes = await getScheduleReferenceDataAction();
    if (!refRes.success || !refRes.data) {
      throw new Error(refRes.error || "Gagal menyiapkan data referensi.");
    }

    const buffer = generateScheduleTemplateBuffer(refRes.data);
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      success: true,
      base64,
      filename: "Template_Import_Jadwal_AlAzhar.xlsx",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghasilkan template Excel.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Mengimpor jadwal pelajaran dari file Excel (.xlsx).
 */
export async function importScheduleExcelAction(params: {
  base64File: string;
  mode: "append" | "replace";
  tahunPelajaran: string;
  semester: string;
}): Promise<{
  success: boolean;
  insertedCount: number;
  errors: string[];
  warnings: string[];
  message?: string;
}> {
  try {
    await checkAdmin();
    const { base64File, mode, tahunPelajaran, semester } = params;

    const refRes = await getScheduleReferenceDataAction();
    if (!refRes.success || !refRes.data) {
      throw new Error("Gagal mengambil referensi master data.");
    }

    const fileBuffer = Buffer.from(base64File, "base64");
    const { validRows, errors } = parseScheduleExcelBuffer(
      fileBuffer,
      refRes.data,
      tahunPelajaran,
      semester
    );

    if (errors.length > 0 && validRows.length === 0) {
      return {
        success: false,
        insertedCount: 0,
        errors,
        warnings: [],
      };
    }

    // Jika mode 'replace', bersihkan jadwal lama pada semester & tahun pelajaran tersebut
    if (mode === "replace") {
      await prisma.jadwalPelajaran.deleteMany({
        where: {
          tahun_pelajaran: tahunPelajaran,
          semester,
        },
      });
    }

    // Insert batch
    const createData = validRows.map((r) => ({
      kelas_id: r.kelasId,
      mapel_id: r.mapelId,
      guru_id: r.guruId,
      hari: r.hari,
      jam_mulai: r.jamMulai,
      jam_selesai: r.jamSelesai,
      tahun_pelajaran: r.tahunPelajaran,
      semester: r.semester,
      is_active: true,
    }));

    await prisma.jadwalPelajaran.createMany({
      data: createData,
    });

    revalidatePath("/admin/schedules");
    revalidatePath("/guru/attendance");

    return {
      success: true,
      insertedCount: validRows.length,
      errors,
      warnings: [],
      message: `Berhasil mengimpor ${validRows.length} jadwal pelajaran pada semester ${semester === "2" ? "2 (Genap)" : "1 (Ganjil)"} Tahun ${tahunPelajaran}.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengimpor jadwal.";
    return {
      success: false,
      insertedCount: 0,
      errors: [errorMsg],
      warnings: [],
    };
  }
}

/**
 * Hapus jadwal secara massal berdasarkan cakupan (per kelas, per jenjang, atau seluruh semester).
 */
export async function deleteScheduleBulkAction(params: {
  scope: "class" | "sd" | "smp" | "all";
  kelasId?: string;
  tahunPelajaran: string;
  semester: string;
}): Promise<{
  success: boolean;
  count: number;
  message?: string;
  error?: string;
}> {
  try {
    await checkAdmin();
    const { scope, kelasId, tahunPelajaran, semester } = params;

    const where: any = {
      tahun_pelajaran: tahunPelajaran,
      semester,
    };

    if (scope === "class" && kelasId) {
      where.kelas_id = BigInt(kelasId);
    } else if (scope === "sd") {
      where.kelas = { jenjang: "SD" };
    } else if (scope === "smp") {
      where.kelas = { jenjang: "SMP" };
    }
    // Jika scope === "all", hapus seluruh jadwal pada semester & tahun tersebut

    const result = await prisma.jadwalPelajaran.deleteMany({ where });

    revalidatePath("/admin/schedules");
    revalidatePath("/guru/attendance");

    return {
      success: true,
      count: result.count,
      message: `Berhasil menghapus ${result.count} jadwal pelajaran.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus jadwal massal.";
    return { success: false, count: 0, error: errorMsg };
  }
}

/**
 * Salin seluruh jadwal dari semester sebelumnya ke semester baru.
 */
export async function copyScheduleSemesterAction(params: {
  fromTahun: string;
  fromSemester: string;
  toTahun: string;
  toSemester: string;
  overwrite: boolean;
}): Promise<{
  success: boolean;
  count: number;
  message?: string;
  error?: string;
}> {
  try {
    await checkAdmin();
    const { fromTahun, fromSemester, toTahun, toSemester, overwrite } = params;

    if (fromTahun === toTahun && fromSemester === toSemester) {
      throw new Error("Semester asal dan semester tujuan tidak boleh sama.");
    }

    // Ambil semua jadwal dari semester sumber
    const sourceSchedules = await prisma.jadwalPelajaran.findMany({
      where: {
        tahun_pelajaran: fromTahun,
        semester: fromSemester,
      },
    });

    if (sourceSchedules.length === 0) {
      throw new Error(`Tidak ditemukan data jadwal pada ${fromTahun} Semester ${fromSemester}.`);
    }

    // Jika overwrite, hapus jadwal di semester tujuan terlebih dahulu
    if (overwrite) {
      await prisma.jadwalPelajaran.deleteMany({
        where: {
          tahun_pelajaran: toTahun,
          semester: toSemester,
        },
      });
    }

    const newRows = sourceSchedules.map((s) => ({
      kelas_id: s.kelas_id,
      mapel_id: s.mapel_id,
      guru_id: s.guru_id,
      hari: s.hari,
      jam_mulai: s.jam_mulai,
      jam_selesai: s.jam_selesai,
      tahun_pelajaran: toTahun,
      semester: toSemester,
      is_active: true,
    }));

    await prisma.jadwalPelajaran.createMany({
      data: newRows,
    });

    revalidatePath("/admin/schedules");
    revalidatePath("/guru/attendance");

    return {
      success: true,
      count: newRows.length,
      message: `Berhasil menyalin ${newRows.length} jadwal dari ${fromTahun} (Sem ${fromSemester}) ke ${toTahun} (Sem ${toSemester}).`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menyalin jadwal semester.";
    return { success: false, count: 0, error: errorMsg };
  }
}

