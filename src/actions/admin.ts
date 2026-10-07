"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";
import { UserService } from "@/services/user.service";
import { ClassService } from "@/services/class.service";
import { AnnouncementService } from "@/services/announcement.service";

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized: Hanya Administrator yang berhak melakukan tindakan ini.");
  }
  return session;
}

export async function createUserAction(formData: FormData) {
  try {
    await checkAdmin();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = (formData.get("role") as string) || "1"; // 1=siswa, 2=guru, 4=wali
    const kelas = formData.get("kelas") as string;
    const appleid = (formData.get("appleid") as string) || null;
    const passwordappleid = (formData.get("passwordappleid") as string) || null;
    const gender = (formData.get("gender") as string) || "L";
    const nis = (formData.get("nis") as string) || null;
    const nip = (formData.get("nip") as string) || null;
    const guru_bidang = (formData.get("guru_bidang") as string) || null;

    if (!email || !password || !name) {
      return { error: "Nama, email, dan password wajib diisi." };
    }

    await UserService.createUser({
      name,
      email,
      password,
      role,
      kelas,
      appleid,
      passwordappleid,
      gender,
      nis,
      nip,
      guru_bidang,
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/teachers");
    return { success: true, message: "Pengguna berhasil ditambahkan." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menambahkan pengguna.";
    return { error: errorMsg };
  }
}

export async function updateUserAction(id: string, formData: FormData) {
  try {
    await checkAdmin();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const kelas = formData.get("kelas") as string;
    const appleid = formData.get("appleid") as string;
    const passwordappleid = formData.get("passwordappleid") as string;
    const ctt_iPad = formData.get("ctt_iPad") as string;
    const password = formData.get("password") as string;

    await UserService.updateUser({
      id,
      name,
      email,
      kelas: kelas || null,
      appleid: appleid || null,
      passwordappleid: passwordappleid || null,
      ctt_iPad: ctt_iPad || null,
      password: password || undefined,
    });

    revalidatePath(`/admin/students/${id}`);
    revalidatePath("/admin/students");
    return { success: true, message: "Data pengguna berhasil diperbarui." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui data pengguna.";
    return { error: errorMsg };
  }
}

export async function deleteUserAction(id: string) {
  try {
    await checkAdmin();

    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: { name: true, kelas: true },
    });
    if (user?.kelas) {
      await prisma.kelas.updateMany({
        where: { nama_kelas: user.kelas, wali_kelas: user.name },
        data: { wali_kelas: null },
      });
    }

    await UserService.deleteUser(id);

    revalidatePath("/admin/students");
    revalidatePath("/admin/teachers");
    revalidatePath("/admin/classes");
    return { success: true, message: "Pengguna berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus pengguna.";
    return { error: errorMsg };
  }
}

export async function deleteUsersAction(ids: string[]) {
  try {
    await checkAdmin();
    if (!ids || ids.length === 0) {
      return { error: "Tidak ada akun yang dipilih untuk dihapus." };
    }

    const users = await prisma.user.findMany({
      where: { id: { in: ids.map((id) => BigInt(id)) } },
      select: { name: true, kelas: true },
    });
    for (const u of users) {
      if (u.kelas) {
        await prisma.kelas.updateMany({
          where: { nama_kelas: u.kelas, wali_kelas: u.name },
          data: { wali_kelas: null },
        });
      }
    }

    const count = await UserService.deleteUsers(ids);

    revalidatePath("/admin/students");
    revalidatePath("/admin/teachers");
    revalidatePath("/admin/classes");
    return { success: true, count, message: `Berhasil menghapus ${count} akun guru.` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus akun terpilih.";
    return { error: errorMsg };
  }
}

export async function verifyUserAction(id: string, status: string) {
  try {
    await checkAdmin();

    const teacher = await prisma.user.findUnique({
      where: { id: BigInt(id) },
    });

    if (teacher?.kelas) {
      if (status === "4") {
        await prisma.kelas.updateMany({
          where: { nama_kelas: teacher.kelas },
          data: { wali_kelas: teacher.name },
        });
      } else if (status === "2") {
        await prisma.kelas.updateMany({
          where: { nama_kelas: teacher.kelas, wali_kelas: teacher.name },
          data: { wali_kelas: null },
        });
      }
    }

    await UserService.verifyUser(id, status);

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/students");
    revalidatePath("/admin/classes");
    return { success: true, message: "Status pengguna berhasil diperbarui." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui status pengguna.";
    return { error: errorMsg };
  }
}

export async function importStudentsAction(fileBufferBase64: string) {
  try {
    await checkAdmin();
    const importedCount = await UserService.importStudentsFromBase64(fileBufferBase64);

    revalidatePath("/admin/students");
    return { success: true, count: importedCount, message: `Berhasil mengimpor ${importedCount} siswa.` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengimpor file Excel";
    return { error: errorMsg };
  }
}

export const importUsersAction = importStudentsAction;

export async function createTeacherAction(formData: FormData) {
  try {
    await checkAdmin();

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = (formData.get("password") as string)?.trim();
    const role = (formData.get("role") as string) || "2"; // 2 = Guru, 4 = Wali Kelas
    const nip = (formData.get("nip") as string)?.trim() || null;
    const guru_bidang = (formData.get("guru_bidang") as string)?.trim() || null;
    const kelas = (formData.get("kelas") as string)?.trim() || null;
    const gender = (formData.get("gender") as string) || "L";
    const appleid = (formData.get("appleid") as string)?.trim() || null;
    const passwordappleid = (formData.get("passwordappleid") as string)?.trim() || null;

    if (!name || !email || !password) {
      return { error: "Nama lengkap, email login, dan password wajib diisi." };
    }

    if (password.length < 6) {
      return { error: "Password minimal 6 karakter." };
    }

    if (role === "4" && !kelas) {
      return { error: "Untuk peran Guru & Wali Kelas, wajib memilih Kelas Wali binaan." };
    }

    await UserService.createUser({
      name,
      email,
      password,
      role,
      nip,
      guru_bidang,
      kelas: role === "4" ? kelas : (kelas || null),
      gender,
      appleid,
      passwordappleid,
    });

    if (role === "4" && kelas) {
      await prisma.kelas.updateMany({
        where: { nama_kelas: kelas },
        data: { wali_kelas: name },
      });
    }

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/classes");
    return { success: true, message: `Akun guru ${name} berhasil ditambahkan.` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menambahkan data guru.";
    return { error: errorMsg };
  }
}

export async function importTeachersAction(fileBufferBase64: string) {
  try {
    await checkAdmin();
    const importedCount = await UserService.importTeachersFromBase64(fileBufferBase64);

    revalidatePath("/admin/teachers");
    return { success: true, count: importedCount, message: `Berhasil mengimpor ${importedCount} data guru.` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengimpor file Excel dewan guru.";
    return { error: errorMsg };
  }
}

export async function updateTeacherAction(id: string, formData: FormData) {
  try {
    await checkAdmin();

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const nip = (formData.get("nip") as string)?.trim() || null;
    const gender = (formData.get("gender") as string) || "L";
    const guru_bidang = (formData.get("guru_bidang") as string)?.trim() || null;
    const role = (formData.get("role") as string) || "2";
    const kelas = (formData.get("kelas") as string)?.trim() || null;
    const appleid = (formData.get("appleid") as string)?.trim() || null;
    const passwordappleid = (formData.get("passwordappleid") as string)?.trim() || null;
    const password = (formData.get("password") as string)?.trim();

    if (!name || !email) {
      return { error: "Nama lengkap dan email wajib diisi." };
    }

    if (password && password.length < 6) {
      return { error: "Password minimal 6 karakter jika ingin diubah." };
    }

    if (role === "4" && !kelas) {
      return { error: "Untuk peran Guru & Wali Kelas, wajib memilih Kelas Wali binaan." };
    }

    // Cek apakah email sudah dipakai pengguna lain
    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: BigInt(id) },
      },
    });

    if (existing) {
      return { error: "Email sudah digunakan oleh pengguna lain." };
    }

    const currentTeacher = await prisma.user.findUnique({
      where: { id: BigInt(id) },
    });

    // Sinkronisasi wali kelas di database rombel (tbl_kelas)
    if (role === "4" && kelas) {
      if (currentTeacher?.kelas && currentTeacher.kelas !== kelas) {
        await prisma.kelas.updateMany({
          where: {
            nama_kelas: currentTeacher.kelas,
            wali_kelas: currentTeacher.name,
          },
          data: { wali_kelas: null },
        });
      }
      await prisma.kelas.updateMany({
        where: { nama_kelas: kelas },
        data: { wali_kelas: name },
      });
    } else {
      if (currentTeacher?.kelas) {
        await prisma.kelas.updateMany({
          where: {
            nama_kelas: currentTeacher.kelas,
            wali_kelas: currentTeacher.name,
          },
          data: { wali_kelas: null },
        });
      }
    }

    await UserService.updateUser({
      id,
      name,
      email,
      nip,
      gender,
      guru_bidang,
      status: role,
      kelas: role === "4" ? kelas : (kelas || null),
      appleid,
      passwordappleid,
      password: password || undefined,
    });

    revalidatePath("/admin/teachers");
    revalidatePath(`/admin/teachers/${id}`);
    revalidatePath("/admin/classes");
    return { success: true, message: `Data guru ${name} berhasil diperbarui.` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui data guru.";
    return { error: errorMsg };
  }
}



export async function createClassAction(formData: FormData) {
  try {
    await checkAdmin();

    const nama_kelas = formData.get("nama_kelas") as string;
    const jenjang = (formData.get("jenjang") as string) || undefined;
    const tingkat = formData.get("tingkat") ? parseInt(formData.get("tingkat") as string, 10) : undefined;
    const wali_kelas = formData.get("wali_kelas") as string;
    const jumlah_siswa = formData.get("jumlah_siswa") as string;
    const code_restrict = formData.get("code_restrict") as string;

    await ClassService.createClass({
      nama_kelas,
      jenjang,
      tingkat,
      wali_kelas,
      jumlah_siswa,
      code_restrict,
    });

    revalidatePath("/admin/classes");
    return { success: true, message: "Kelas berhasil ditambahkan." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menambahkan kelas.";
    return { error: errorMsg };
  }
}

export async function updateClassAction(id: string, formData: FormData) {
  try {
    await checkAdmin();

    const nama_kelas = formData.get("nama_kelas") as string;
    const wali_kelas = formData.get("wali_kelas") as string;
    const jumlah_siswa = formData.get("jumlah_siswa") as string;
    const code_restrict = formData.get("code_restrict") as string;

    await ClassService.updateClass({
      id,
      nama_kelas,
      wali_kelas,
      jumlah_siswa,
      code_restrict,
    });

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${id}`);
    return { success: true, message: "Data kelas dan wali kelas berhasil diperbarui." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui kelas.";
    return { error: errorMsg };
  }
}

export async function deleteClassAction(id: string) {
  try {
    await checkAdmin();
    await ClassService.deleteClass(id);

    revalidatePath("/admin/classes");
    return { success: true, message: "Kelas berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus kelas.";
    return { error: errorMsg };
  }
}

export async function updateRestrictAction(id: string, code_restrict: string) {
  try {
    await checkAdmin();
    await ClassService.updateRestrictCode(id, code_restrict);

    revalidatePath("/admin");
    return { success: true, message: "Kode restrict berhasil diperbarui." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui kode restrict.";
    return { error: errorMsg };
  }
}

export async function deleteAnnouncementAction(id: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "guru")) {
      throw new Error("Unauthorized");
    }

    await AnnouncementService.deleteAnnouncement(id);

    revalidatePath("/admin");
    revalidatePath("/guru");
    revalidatePath("/siswa");
    revalidatePath("/admin/announcements");
    revalidatePath("/guru/announcements");
    return { success: true, message: "Pengumuman berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus pengumuman.";
    return { error: errorMsg };
  }
}

export async function createAnnouncementAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "guru")) {
      throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;
    const from = (formData.get("from") as string) || (session.role === "admin" ? "IT" : session.kelas || "Guru");
    const pengumuman = formData.get("pengumuman") as string;

    const fileUpload = formData.get("file_upload") as File | null;
    const fileUrl = formData.get("file") as string | null;

    let filePath: string | null = null;
    if (fileUpload && typeof fileUpload === "object" && fileUpload.size > 0) {
      const uploadRes = await saveUploadedFile(fileUpload, { category: "attachment" });
      if (!uploadRes.success) {
        return { error: uploadRes.error };
      }
      filePath = uploadRes.filePath || null;
    } else if (typeof fileUrl === "string" && fileUrl.trim().length > 0) {
      filePath = fileUrl.trim();
    }

    if (!title || !pengumuman) {
      return { error: "Judul dan konten pengumuman wajib diisi." };
    }

    await AnnouncementService.createAnnouncement({
      title,
      from,
      pengumuman,
      file: filePath,
    });

    revalidatePath("/admin");
    revalidatePath("/guru");
    revalidatePath("/siswa");
    revalidatePath("/admin/announcements");
    revalidatePath("/guru/announcements");
    return { success: true, message: "Pengumuman berhasil dipublikasikan." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mempublikasikan pengumuman.";
    return { error: errorMsg };
  }
}

export async function updateAnnouncementAction(id: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "guru")) {
      throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;
    const from = formData.get("from") as string;
    const pengumuman = formData.get("pengumuman") as string;

    const dataToUpdate: Record<string, unknown> = {};
    if (title) dataToUpdate.title = title;
    if (from) dataToUpdate.from = from;
    if (pengumuman) dataToUpdate.pengumuman = pengumuman;

    const fileUpload = formData.get("file_upload") as File | null;
    const fileUrl = formData.get("file") as string | null;

    if (fileUpload && typeof fileUpload === "object" && fileUpload.size > 0) {
      const uploadRes = await saveUploadedFile(fileUpload, { category: "attachment" });
      if (!uploadRes.success) {
        return { error: uploadRes.error };
      }
      dataToUpdate.file = uploadRes.filePath;
    } else if (typeof fileUrl === "string") {
      dataToUpdate.file = fileUrl.trim() || null;
    }

    await AnnouncementService.updateAnnouncement({
      id,
      ...dataToUpdate,
    });

    revalidatePath("/admin");
    revalidatePath("/guru");
    revalidatePath("/siswa");
    revalidatePath("/admin/announcements");
    revalidatePath(`/admin/announcements/${id}`);
    revalidatePath("/guru/announcements");
    revalidatePath(`/guru/announcements/${id}`);
    return { success: true, message: "Pengumuman berhasil diperbarui." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui pengumuman.";
    return { error: errorMsg };
  }
}

export async function createEventAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "guru")) {
      throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;
    const kelas = (formData.get("kelas") as string) || "Semua Kelas";
    const startStr = formData.get("start") as string;
    const endStr = (formData.get("end") as string) || null;
    const deskripsi = (formData.get("deskripsi") as string) || null;
    const backgroundColor = (formData.get("backgroundColor") as string) || "#0284c7";

    if (!title || !startStr) {
      return { error: "Judul dan tanggal mulai wajib diisi." };
    }

    await prisma.event.create({
      data: {
        title,
        kelas,
        from: session.role === "admin" ? "admin" : session.name,
        start: new Date(startStr),
        end: endStr ? new Date(endStr) : null,
        deskripsi,
        backgroundColor,
      },
    });

    revalidatePath("/admin/calendar");
    revalidatePath("/guru/calendar");
    revalidatePath("/siswa/calendar");
    return { success: true, message: "Event berhasil ditambahkan." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menambahkan event.";
    return { error: errorMsg };
  }
}

export async function deleteEventAction(id: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "guru")) {
      throw new Error("Unauthorized");
    }

    await prisma.event.delete({
      where: { id: BigInt(id) },
    });

    revalidatePath("/admin/calendar");
    revalidatePath("/guru/calendar");
    revalidatePath("/siswa/calendar");
    return { success: true, message: "Event berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus event.";
    return { error: errorMsg };
  }
}

export async function createAchievementAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "guru")) {
      throw new Error("Unauthorized");
    }

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
    revalidatePath("/admin/students");
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
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "guru")) {
      throw new Error("Unauthorized");
    }

    await prisma.prestasi.delete({
      where: { id: BigInt(id) },
    });

    revalidatePath("/guru/achievements");
    revalidatePath("/admin/students");
    return { success: true, message: "Prestasi berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus prestasi.";
    return { error: errorMsg };
  }
}
