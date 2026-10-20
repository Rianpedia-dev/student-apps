"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { AttendanceService } from "@/services/attendance.service";

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized: Akses khusus Administrator.");
  }
  return session;
}

export async function getAdminAttendanceDataAction(
  dateStr: string,
  filters?: { jenjang?: string; tingkat?: number; kelas?: string }
) {
  try {
    await checkAdmin();
    const data = await AttendanceService.getAdminAttendanceDashboard(dateStr, filters);
    return { success: true, data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memuat data audit presensi.";
    return { success: false, error: errorMsg, data: null };
  }
}

export async function updateSingleAttendanceAction(params: {
  id: string;
  keterangan: "Hadir" | "Sakit" | "Izin" | "Alpha";
  catatan?: string;
}) {
  try {
    await checkAdmin();
    const idBigInt = BigInt(params.id);

    await prisma.absen.update({
      where: { id: idBigInt },
      data: {
        keterangan: params.keterangan,
        catatan: params.catatan !== undefined ? params.catatan : undefined,
      },
    });

    revalidatePath("/admin/attendance");
    revalidatePath("/guru/attendance");
    revalidatePath("/siswa/attendance");
    return { success: true, message: "Catatan presensi berhasil diperbarui oleh Administrator." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui catatan presensi.";
    return { error: errorMsg };
  }
}
