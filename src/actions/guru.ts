"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession, setSessionCookie } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";
import { AttendanceService } from "@/services/attendance.service";
import { UserService } from "@/services/user.service";
import { formatViolationKeterangan, parseViolationKeterangan } from "@/lib/constants/violations";
import { getActiveSemester } from "@/lib/semester";

async function checkGuruOrAdmin() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    throw new Error("Unauthorized: Akses ditolak.");
  }
  return session;
}

async function checkWaliKelasOrAdmin(targetKelas?: string) {
  const session = await checkGuruOrAdmin();
  if (session.role === "admin") return session;

  if (session.status !== "4") {
    throw new Error("Akses ditolak: Fitur ini khusus untuk Guru & Wali Kelas.");
  }

  if (targetKelas && session.kelas && session.kelas.trim().toLowerCase() !== targetKelas.trim().toLowerCase()) {
    throw new Error(`Akses ditolak: Anda hanya berwenang mengelola kelas binaan Anda (${session.kelas}).`);
  }

  return session;
}

export async function enrollStudentAction(studentIds: string | string[], kelas: string) {
  try {
    await checkWaliKelasOrAdmin(kelas);
    const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
    if (ids.length === 0) {
      return { error: "Pilih setidaknya satu siswa untuk didaftarkan." };
    }

    const count = await UserService.enrollStudentsToClass(ids, kelas);

    revalidatePath("/guru/my-class");
    return {
      success: true,
      message: count === 1
        ? "1 siswa berhasil didaftarkan ke kelas."
        : `${count} siswa berhasil didaftarkan ke kelas.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mendaftarkan siswa.";
    return { error: errorMsg };
  }
}

export async function removeStudentsAction(studentIds: string[]) {
  try {
    const session = await checkWaliKelasOrAdmin();

    if (session.role !== "admin" && session.kelas) {
      const countMismatch = await prisma.user.count({
        where: {
          id: { in: studentIds.map((id) => BigInt(id)) },
          NOT: { kelas: session.kelas },
        },
      });
      if (countMismatch > 0) {
        return { error: "Akses ditolak: Anda hanya dapat mengeluarkan siswa dari kelas binaan Anda." };
      }
    }

    const count = await UserService.removeStudentsFromClass(studentIds);

    revalidatePath("/guru/my-class");
    return { success: true, message: `Berhasil mengeluarkan ${count} siswa dari kelas.` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengeluarkan siswa.";
    return { error: errorMsg };
  }
}

export async function createAttendanceAction(
  date: string,
  kelas: string,
  records: { userId: string; keterangan: string }[]
) {
  try {
    await checkWaliKelasOrAdmin(kelas);
    await AttendanceService.recordAttendance(date, kelas, records);

    revalidatePath("/guru/attendance");
    revalidatePath(`/guru/attendance/${date}`);
    revalidatePath("/guru");
    return { success: true, message: "Data presensi berhasil disimpan." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menyimpan presensi.";
    return { error: errorMsg };
  }
}

export async function deleteAttendanceAction(date: string, kelas: string) {
  try {
    await checkWaliKelasOrAdmin(kelas);
    await AttendanceService.deleteAttendanceByDate(date, kelas);

    revalidatePath("/guru/attendance");
    return { success: true, message: "Data presensi tanggal tersebut berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus data presensi.";
    return { error: errorMsg };
  }
}

export async function createSubjectAttendanceAction(params: {
  date: string;
  kelas: string;
  kelasId?: string;
  mapelId: string;
  jadwalId?: string;
  pertemuanId?: string;
  jamKe?: string;
  records: { userId: string; keterangan: string; catatan?: string }[];
}) {
  try {
    const session = await checkGuruOrAdmin();
    const guruId = session.role === "guru" ? session.id : undefined;

    await AttendanceService.recordSubjectAttendance({
      date: params.date,
      kelas: params.kelas,
      kelasId: params.kelasId,
      mapelId: params.mapelId,
      guruId,
      jadwalId: params.jadwalId,
      pertemuanId: params.pertemuanId,
      jamKe: params.jamKe,
      records: params.records,
    });

    revalidatePath("/guru/attendance");
    revalidatePath("/guru/mapel");
    revalidatePath("/admin/attendance");
    revalidatePath("/siswa/attendance");
    return { success: true, message: "Data presensi mata pelajaran berhasil disimpan." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menyimpan presensi mata pelajaran.";
    return { error: errorMsg };
  }
}

export async function deleteSubjectAttendanceAction(date: string, kelas: string, mapelId?: string) {
  try {
    await checkGuruOrAdmin();
    await AttendanceService.deleteSubjectAttendance(date, kelas, mapelId);

    revalidatePath("/guru/attendance");
    revalidatePath("/admin/attendance");
    revalidatePath("/siswa/attendance");
    return { success: true, message: "Data presensi mata pelajaran berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus data presensi.";
    return { error: errorMsg };
  }
}

export async function applyWaliKelasFullDayAction(params: {
  dateStr: string;
  kelasNama: string;
  studentId: string;
  keterangan: "Sakit" | "Izin" | "Alpha" | "Hadir";
  catatan?: string;
}) {
  try {
    await checkWaliKelasOrAdmin(params.kelasNama);
    await AttendanceService.applyFullDayStatusByWaliKelas(params);

    revalidatePath("/guru/attendance");
    revalidatePath("/admin/attendance");
    revalidatePath("/siswa/attendance");
    return { success: true, message: `Status ${params.keterangan} seharian berhasil diterapkan untuk seluruh mapel.` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menerapkan status presensi seharian.";
    return { error: errorMsg };
  }
}

export async function createViolationAction(formData: FormData) {
  try {
    const session = await checkGuruOrAdmin();

    const user_id = formData.get("user_id") as string;
    const nama = (formData.get("nama") as string) || "";
    const kelas = (formData.get("kelas") as string) || "";
    const kategori = formData.get("kategori") as string;
    const rawKeterangan = formData.get("keterangan") as string;
    const severity = (formData.get("severity") as any) || "RINGAN";
    const points = Number(formData.get("points")) || undefined;
    const tindakan = (formData.get("tindakan") as string) || "";
    const dateStr = formData.get("date") as string;

    if (!user_id || !kategori || !rawKeterangan) {
      return { error: "Siswa, kategori, dan deskripsi pelanggaran wajib diisi." };
    }

    const createdAt = dateStr ? new Date(dateStr) : new Date();

    // 1. Fetch info siswa & tentukan jenjang siswa
    let studentJenjang = "SD";
    let targetStudent: {
      id: bigint;
      name: string;
      kelas: string | null;
      jenjang: string | null;
    } | null = null;

    if (/^\d+$/.test(user_id)) {
      targetStudent = await prisma.user.findUnique({
        where: { id: BigInt(user_id) },
        select: { id: true, name: true, kelas: true, jenjang: true },
      });
    }

    if (targetStudent) {
      if (targetStudent.jenjang) {
        studentJenjang = targetStudent.jenjang;
      } else if (targetStudent.kelas) {
        studentJenjang = /SMP|Kelas (7|8|9)/i.test(targetStudent.kelas) ? "SMP" : "SD";
      }
    } else if (kelas) {
      studentJenjang = /SMP|Kelas (7|8|9)/i.test(kelas) ? "SMP" : "SD";
    }

    // Validasi pembagian jenjang guru:
    // Guru jenjang SD hanya boleh mencatat siswa jenjang SD
    // Guru jenjang SMP hanya boleh mencatat siswa jenjang SMP
    if (session.role !== "admin" && session.jenjang && session.jenjang !== "ALL") {
      if (session.jenjang !== studentJenjang) {
        return {
          error: `Akses ditolak: Anda adalah guru jenjang ${session.jenjang}, hanya dapat mencatat pelanggaran untuk siswa jenjang ${session.jenjang}.`,
        };
      }
    }

    // 2. Semester otomatis saat catatan dibuat
    const activeSemester = await getActiveSemester(createdAt);
    const semester = activeSemester.semester;
    const tahun_pelajaran = activeSemester.tahunPelajaran;

    // 3. Nama guru & Guru ID otomatis dari akun guru pembuat
    const guru_id = /^\d+$/.test(session.id) ? BigInt(session.id) : null;
    const guru_nama = session.name || "Guru";

    // 4. Tingkatan pelanggaran (RINGAN / SEDANG)
    const tingkatan = severity === "SEDANG" ? "SEDANG" : "RINGAN";

    // Format keterangan with structured tags (for backwards compatibility)
    const formattedKeterangan = formatViolationKeterangan({
      keterangan: rawKeterangan,
      severity: tingkatan,
      points,
      tindakan,
    });

    await prisma.pelanggaran.create({
      data: {
        user_id,
        nama: targetStudent?.name || nama,
        kelas: targetStudent?.kelas || kelas,
        kategori,
        keterangan: formattedKeterangan,
        tingkatan,
        semester,
        tahun_pelajaran,
        jenjang: studentJenjang,
        guru_id,
        guru_nama,
        created_at: createdAt,
      },
    });

    revalidatePath("/guru/violations");
    revalidatePath(`/guru/my-class/${user_id}`);
    revalidatePath("/guru/my-class");
    revalidatePath("/siswa/violations");
    revalidatePath("/siswa/profile");
    revalidatePath("/siswa");
    return { success: true, message: "Catatan kedisiplinan siswa berhasil disimpan." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mencatat pelanggaran.";
    return { error: errorMsg };
  }
}

export async function updateViolationStatusAction(
  id: string,
  newStatus: string,
  tindakan?: string
) {
  try {
    await checkGuruOrAdmin();
    revalidatePath("/guru/violations");
    revalidatePath("/siswa/violations");
    return { success: true, message: "Catatan berhasil diperbarui." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui catatan.";
    return { error: errorMsg };
  }
}

function canManageViolationRecord(
  record: { guru_id?: bigint | null; guru_nama?: string | null },
  session: { id: string; name?: string; role?: string }
): boolean {
  if (session.role === "admin") return true;

  // 1. Cek berdasarkan guru_id
  if (record.guru_id != null && String(record.guru_id) === String(session.id)) {
    return true;
  }

  // 2. Fallback untuk data historis berdasarkan guru_nama
  if (record.guru_nama && session.name) {
    if (record.guru_nama.trim().toLowerCase() === session.name.trim().toLowerCase()) {
      return true;
    }
  }

  return false;
}

export async function updateViolationAction(formData: FormData) {
  try {
    const session = await checkGuruOrAdmin();

    const id = formData.get("id") as string;
    const kategori = formData.get("kategori") as string;
    const rawKeterangan = formData.get("keterangan") as string;
    const severity = (formData.get("severity") as any) || "RINGAN";
    const points = Number(formData.get("points")) || undefined;
    const tindakan = (formData.get("tindakan") as string) || "";
    const tingkatan = severity === "SEDANG" ? "SEDANG" : "RINGAN";

    if (!id || !kategori || !rawKeterangan) {
      return { error: "ID, kategori, dan deskripsi pelanggaran wajib diisi." };
    }

    // Validasi kepemilikan catatan: Hanya guru pembuat atau admin yang boleh mengedit
    const existing = await prisma.pelanggaran.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, guru_id: true, guru_nama: true, user_id: true },
    });

    if (!existing) {
      return { error: "Catatan pelanggaran tidak ditemukan." };
    }

    if (!canManageViolationRecord(existing, session)) {
      return {
        error: "Akses ditolak: Hanya guru pembuat catatan ini yang memiliki izin untuk mengubah data.",
      };
    }

    const formattedKeterangan = formatViolationKeterangan({
      keterangan: rawKeterangan,
      severity: tingkatan,
      points,
      tindakan,
    });

    const record = await prisma.pelanggaran.update({
      where: { id: BigInt(id) },
      data: {
        kategori,
        keterangan: formattedKeterangan,
        tingkatan,
      },
    });

    revalidatePath("/guru/violations");
    if (record.user_id) {
      revalidatePath(`/guru/my-class/${record.user_id}`);
    }
    revalidatePath("/guru/my-class");
    revalidatePath("/siswa/violations");
    revalidatePath("/siswa/profile");
    revalidatePath("/siswa");
    return { success: true, message: "Catatan pelanggaran berhasil diperbarui." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui pelanggaran.";
    return { error: errorMsg };
  }
}

export async function deleteViolationAction(id: string, studentId?: string) {
  try {
    const session = await checkGuruOrAdmin();

    if (!id) {
      return { error: "ID catatan pelanggaran wajib disertakan." };
    }

    // Validasi kepemilikan catatan: Hanya guru pembuat atau admin yang boleh menghapus
    const existing = await prisma.pelanggaran.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, guru_id: true, guru_nama: true, user_id: true },
    });

    if (!existing) {
      return { error: "Catatan pelanggaran tidak ditemukan." };
    }

    if (!canManageViolationRecord(existing, session)) {
      return {
        error: "Akses ditolak: Hanya guru pembuat catatan ini yang memiliki izin untuk menghapusnya.",
      };
    }

    const deleted = await prisma.pelanggaran.delete({
      where: { id: BigInt(id) },
    });

    revalidatePath("/guru/violations");
    const targetStudentId = studentId || deleted.user_id;
    if (targetStudentId) {
      revalidatePath(`/guru/my-class/${targetStudentId}`);
    }
    revalidatePath("/guru/my-class");
    revalidatePath("/siswa/violations");
    revalidatePath("/siswa");
    return { success: true, message: "Catatan pelanggaran berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus pelanggaran.";
    return { error: errorMsg };
  }
}

export async function updateNotesAction(studentId: string, notes: string) {
  try {
    const session = await checkGuruOrAdmin();

    if (session.role !== "admin") {
      if (session.status !== "4" || !session.kelas) {
        return { error: "Akses ditolak: Catatan siswa binaan hanya dapat diedit oleh Wali Kelas." };
      }
      const student = await prisma.user.findUnique({
        where: { id: BigInt(studentId) },
        select: { kelas: true },
      });
      if (student?.kelas !== session.kelas) {
        return { error: "Akses ditolak: Anda hanya dapat mengedit catatan siswa di kelas binaan Anda." };
      }
    }

    await prisma.user.update({
      where: { id: BigInt(studentId) },
      data: { notes },
    });

    revalidatePath(`/guru/my-class/${studentId}`);
    return { success: true, message: "Catatan siswa berhasil diperbarui." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui catatan siswa.";
    return { error: errorMsg };
  }
}

import {
  createAchievementAction as handleCreateAch,
  updateAchievementAction as handleUpdateAch,
  deleteAchievementAction as handleDeleteAch,
} from "./achievement";

export async function createAchievementAction(formData: FormData) {
  return handleCreateAch(formData);
}

export async function updateAchievementAction(id: string, formData: FormData) {
  return handleUpdateAch(id, formData);
}

export async function deleteAchievementAction(id: string) {
  return handleDeleteAch(id);
}

export async function updateProfileAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const notes = formData.get("notes") as string;
    const skills = formData.get("skills") as string;
    const nip = formData.get("nip") as string;
    const gender = formData.get("gender") as string;
    const appleid = formData.get("appleid") as string;
    const removeImage = formData.get("remove_image") === "true";

    // CATATAN KEAMANAN: 'kelas', 'status', dan 'guru_bidang' sengaja TIDAK DIPERBOLEHKAN diubah oleh guru
    // melalui form profil. Hak pengaturan status, kelas wali binaan, dan bidang studi (mapel) eksklusif milik Administrator.
    const dataToUpdate: Record<string, unknown> = {};
    if (name) dataToUpdate.name = name;
    if (address !== undefined) dataToUpdate.address = address || null;
    if (notes !== undefined) dataToUpdate.notes = notes || null;
    if (skills !== undefined) dataToUpdate.skills = skills || null;
    if (nip !== undefined) dataToUpdate.nip = nip ? nip.trim() : null;
    if (gender && (gender === "L" || gender === "P")) dataToUpdate.gender = gender;
    if (appleid !== undefined) dataToUpdate.appleid = appleid ? appleid.trim() : null;

    if (removeImage) {
      dataToUpdate.image = null;
    } else {
      const rawFile = formData.get("image") || formData.get("photo");
      if (rawFile && typeof rawFile === "object" && "size" in rawFile && (rawFile as Blob).size > 0) {
        const uploadRes = await saveUploadedFile(rawFile as Blob, { category: "avatar" });
        if (!uploadRes.success) {
          return { success: false, error: uploadRes.error || "Gagal mengunggah foto profil." };
        }
        if (uploadRes.filePath) {
          dataToUpdate.image = uploadRes.filePath;
        }
      }
    }

    const isNum = /^\d+$/.test(session.id);
    if (isNum) {
      await UserService.updateUser({
        id: session.id,
        ...dataToUpdate,
      });
    }

    const newImage = dataToUpdate.image !== undefined ? (dataToUpdate.image as string | null) : session.image;
    const newName = dataToUpdate.name ? (dataToUpdate.name as string) : session.name;

    // Jika guru mengganti namanya dan saat ini berstatus Wali Kelas, sinkronkan nama baru ke tbl_kelas
    if (newName && session.status === "4" && session.kelas) {
      try {
        await prisma.kelas.updateMany({
          where: { nama_kelas: session.kelas },
          data: { wali_kelas: newName },
        });
      } catch (err) {
        console.error("Gagal sinkronisasi nama wali_kelas ke tbl_kelas:", err);
      }
    }

    await setSessionCookie({
      ...session,
      name: newName,
      image: newImage,
    });

    revalidatePath("/", "layout");
    revalidatePath("/guru/profile");
    revalidatePath("/guru");
    return { success: true, message: "Profil berhasil diperbarui.", image: newImage };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui profil.";
    return { success: false, error: errorMsg };
  }
}

export const updateGuruProfile = updateProfileAction;

export async function uploadPhotoAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const rawFile = formData.get("image") || formData.get("photo") || formData.get("file");
    if (!rawFile || typeof rawFile !== "object" || !("size" in rawFile) || (rawFile as Blob).size === 0) {
      return { success: false, error: "Silakan pilih file foto terlebih dahulu." };
    }

    const uploadRes = await saveUploadedFile(rawFile as Blob, { category: "avatar" });
    if (!uploadRes.success) {
      return { success: false, error: uploadRes.error };
    }

    const isNum = /^\d+$/.test(session.id);
    if (isNum) {
      await UserService.updateUser({
        id: session.id,
        image: uploadRes.filePath,
      });
    }

    await setSessionCookie({
      ...session,
      image: uploadRes.filePath,
    });

    revalidatePath("/", "layout");
    revalidatePath("/guru/profile");
    revalidatePath("/guru");
    return { success: true, filePath: uploadRes.filePath, message: "Foto profil berhasil diperbarui." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengunggah foto profil.";
    return { success: false, error: errorMsg };
  }
}

export async function downloadAttendancePdfAction(kelas: string, month: number, year: number) {
  try {
    await checkGuruOrAdmin();
    const recap = await AttendanceService.getAttendanceRecap(kelas, month, year);

    return {
      success: true,
      ...recap,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengunduh data rekap presensi.";
    return { success: false, error: errorMsg };
  }
}
