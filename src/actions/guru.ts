"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession, setSessionCookie } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";
import { getDefaultProfileImage } from "@/lib/utils";
import { AttendanceService } from "@/services/attendance.service";
import { UserService } from "@/services/user.service";

async function checkGuruOrAdmin() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    throw new Error("Unauthorized: Akses ditolak.");
  }
  return session;
}

export async function enrollStudentAction(studentId: string, kelas: string) {
  try {
    await checkGuruOrAdmin();
    await UserService.enrollStudentToClass(studentId, kelas);

    revalidatePath("/guru/my-class");
    return { success: true, message: "Siswa berhasil didaftarkan ke kelas." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mendaftarkan siswa.";
    return { error: errorMsg };
  }
}

export async function removeStudentsAction(studentIds: string[]) {
  try {
    await checkGuruOrAdmin();
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
    await checkGuruOrAdmin();
    await AttendanceService.recordAttendance(date, kelas, records);

    revalidatePath("/guru/attendance");
    revalidatePath(`/guru/attendance/${date}`);
    revalidatePath("/guru");
    return { success: true, message: "Data absensi berhasil disimpan." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menyimpan absensi.";
    return { error: errorMsg };
  }
}

export async function deleteAttendanceAction(date: string, kelas: string) {
  try {
    await checkGuruOrAdmin();
    await AttendanceService.deleteAttendanceByDate(date, kelas);

    revalidatePath("/guru/attendance");
    return { success: true, message: "Data absensi tanggal tersebut berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus data absensi.";
    return { error: errorMsg };
  }
}

export async function createViolationAction(formData: FormData) {
  try {
    await checkGuruOrAdmin();

    const user_id = formData.get("user_id") as string;
    const nama = formData.get("nama") as string;
    const kelas = formData.get("kelas") as string;
    const kategori = formData.get("kategori") as string;
    const keterangan = formData.get("keterangan") as string;

    if (!user_id || !kategori || !keterangan) {
      return { error: "Kategori dan keterangan pelanggaran wajib diisi." };
    }

    await prisma.pelanggaran.create({
      data: {
        user_id,
        nama,
        kelas,
        kategori,
        keterangan,
      },
    });

    revalidatePath(`/guru/my-class/${user_id}`);
    revalidatePath("/siswa/violations");
    return { success: true, message: "Pelanggaran berhasil dicatat." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mencatat pelanggaran.";
    return { error: errorMsg };
  }
}

export async function deleteViolationAction(id: string, studentId: string) {
  try {
    await checkGuruOrAdmin();

    await prisma.pelanggaran.delete({
      where: { id: BigInt(id) },
    });

    revalidatePath(`/guru/my-class/${studentId}`);
    revalidatePath("/siswa/violations");
    return { success: true, message: "Pelanggaran berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus pelanggaran.";
    return { error: errorMsg };
  }
}

export async function updateNotesAction(studentId: string, notes: string) {
  try {
    await checkGuruOrAdmin();

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

export async function createAchievementAction(formData: FormData) {
  try {
    await checkGuruOrAdmin();

    const id_user = (formData.get("id_user") as string) || "0";
    const nama = formData.get("nama") as string;
    const kelas = (formData.get("kelas") as string) || "";
    const prestasi = formData.get("prestasi") as string;

    if (!nama || !prestasi) {
      return { error: "Nama dan deskripsi prestasi wajib diisi." };
    }

    let fotoanak = "/images/trophy.png";
    const rawFile = formData.get("foto_upload") || formData.get("fotoanak");
    if (rawFile && typeof rawFile === "object" && "size" in rawFile && (rawFile as Blob).size > 0) {
      const uploadRes = await saveUploadedFile(rawFile as Blob, { category: "achievement" });
      if (!uploadRes.success) {
        return { error: uploadRes.error };
      }
      fotoanak = uploadRes.filePath || "/images/trophy.png";
    } else if (typeof rawFile === "string" && rawFile.trim().length > 0) {
      fotoanak = rawFile.trim();
    }

    await prisma.prestasi.create({
      data: {
        id_user,
        nama,
        kelas,
        fotoanak,
        prestasi,
      },
    });

    revalidatePath("/guru/achievements");
    revalidatePath("/guru");
    revalidatePath("/siswa");
    return { success: true, message: "Prestasi berhasil ditambahkan." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menambahkan prestasi.";
    return { error: errorMsg };
  }
}

export async function deleteAchievementAction(id: string) {
  try {
    await checkGuruOrAdmin();

    await prisma.prestasi.delete({
      where: { id: BigInt(id) },
    });

    revalidatePath("/guru/achievements");
    return { success: true, message: "Prestasi berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus prestasi.";
    return { error: errorMsg };
  }
}

export async function updateProfileAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const kelas = formData.get("kelas") as string;
    const guru_bidang = formData.get("guru_bidang") as string;
    const notes = formData.get("notes") as string;
    const skills = formData.get("skills") as string;
    const removeImage = formData.get("remove_image") === "true";

    const dataToUpdate: Record<string, unknown> = {};
    if (name) dataToUpdate.name = name;
    if (address !== undefined) dataToUpdate.address = address || null;
    if (kelas !== undefined) dataToUpdate.kelas = kelas || null;
    if (guru_bidang !== undefined) dataToUpdate.guru_bidang = guru_bidang || null;
    if (notes !== undefined) dataToUpdate.notes = notes || null;
    if (skills !== undefined) dataToUpdate.skills = skills || null;

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
    const newKelas = dataToUpdate.kelas !== undefined ? (dataToUpdate.kelas as string | null) : session.kelas;

    // Sync wali_kelas in tbl_kelas jika guru membina kelas ini
    if (newKelas) {
      try {
        await prisma.kelas.updateMany({
          where: { nama_kelas: newKelas },
          data: { wali_kelas: newName },
        });
      } catch (err) {
        console.error("Gagal sinkronisasi wali_kelas ke tbl_kelas:", err);
      }
    }

    await setSessionCookie({
      ...session,
      name: newName,
      image: newImage,
      kelas: newKelas,
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
    const errorMsg = err instanceof Error ? err.message : "Gagal mengunduh data rekap absensi.";
    return { success: false, error: errorMsg };
  }
}
