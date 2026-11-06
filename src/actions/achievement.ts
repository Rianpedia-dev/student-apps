"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { saveUploadedFile } from "@/lib/upload";
import { AchievementService } from "@/services/achievement.service";
import { calculateAchievementPoints } from "@/lib/achievement-points";
import { AchievementFormSchema } from "@/lib/validators/achievement.schema";

export async function createAchievementAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    const id_user = (formData.get("id_user") as string) || "0";
    let nama = (formData.get("nama") as string)?.trim() || "";
    let kelas = (formData.get("kelas") as string)?.trim() || "";
    let kelas_saat_prestasi =
      (formData.get("kelas_saat_prestasi") as string)?.trim() || "";
    let tahun_ajaran =
      (formData.get("tahun_ajaran") as string)?.trim() || "";
    const tingkat = (formData.get("tingkat") as string)?.trim() || "Dalam Sekolah";
    const peringkat = (formData.get("peringkat") as string)?.trim() || "Juara 1";
    const prestasi = (formData.get("prestasi") as string)?.trim() || "";
    const tanggal_prestasi_raw = formData.get("tanggal_prestasi") as string;

    // Otomatis lengkapi data siswa dari database jika id_user ada
    let studentKelas = kelas;
    let studentJenjang = "SD";

    if (id_user && id_user !== "0" && /^\d+$/.test(id_user)) {
      const studentUser = await prisma.user.findUnique({
        where: { id: BigInt(id_user) },
        select: { kelas: true, jenjang: true, name: true },
      });
      if (studentUser) {
        if (!nama) nama = studentUser.name;
        if (!kelas) kelas = studentUser.kelas || "";
        if (!kelas_saat_prestasi) kelas_saat_prestasi = studentUser.kelas || kelas || "Umum";
        studentKelas = studentUser.kelas || kelas;
        studentJenjang = studentUser.jenjang || (/smp|kelas\s*(7|8|9)/i.test(studentKelas) ? "SMP" : "SD");
      }
    }

    if (!kelas_saat_prestasi) {
      kelas_saat_prestasi = studentKelas || "Umum";
    }

    if (!tahun_ajaran) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const month = now.getMonth() + 1;
      tahun_ajaran = month >= 7 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
    }

    // 1. Validasi Schema
    const validated = AchievementFormSchema.safeParse({
      id_user,
      nama,
      kelas: studentKelas,
      kelas_saat_prestasi,
      tingkat,
      peringkat,
      prestasi,
      tahun_ajaran,
    });

    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Data input tidak valid." };
    }

    // 3. Verifikasi Izin RBAC: Super Admin, Admin Jenjang, atau Wali Kelas Siswa Binaan
    AchievementService.verifyManagePermission(
      session,
      {
        id: id_user,
        kelas: studentKelas,
        jenjang: studentJenjang,
        kelas_saat_prestasi,
      },
      "CREATE"
    );

    // 4. Hitung Poin Otomatis (Skala 1 - 16)
    const poin = calculateAchievementPoints(tingkat, peringkat);

    // 5. Tangani Upload Foto Piagam/Dokumentasi
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

    const tanggal_prestasi = tanggal_prestasi_raw ? new Date(tanggal_prestasi_raw) : new Date();

    // 6. Simpan ke database
    await prisma.prestasi.create({
      data: {
        id_user,
        nama,
        kelas: studentKelas,
        kelas_saat_prestasi,
        tahun_ajaran,
        tingkat,
        peringkat,
        poin,
        fotoanak,
        prestasi,
        jenjang: studentJenjang,
        tanggal_prestasi,
        created_at: new Date(),
      },
    });

    revalidatePath("/guru/achievements");
    revalidatePath("/admin/achievements");
    revalidatePath("/admin/students");
    revalidatePath("/guru");
    revalidatePath("/siswa");
    revalidatePath("/siswa/profile");

    return { success: true, message: "Prestasi berhasil dicatat dengan nilai " + poin + " Poin!" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menambahkan prestasi.";
    return { error: errorMsg };
  }
}

export async function updateAchievementAction(id: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    const existing = await prisma.prestasi.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return { error: "Catatan prestasi tidak ditemukan." };
    }

    // Lookup profil kelas siswa saat ini untuk verifikasi keabsahan binaan
    let currentStudentClass = existing.kelas;
    if (existing.id_user && existing.id_user !== "0" && /^\d+$/.test(existing.id_user)) {
      const studentUser = await prisma.user.findUnique({
        where: { id: BigInt(existing.id_user) },
        select: { kelas: true, jenjang: true },
      });
      if (studentUser?.kelas) {
        currentStudentClass = studentUser.kelas;
      }
    }

    // Verifikasi izin akses pada record lama (Cegah modifikasi arsip kelas sebelumnya / kelas lain)
    AchievementService.verifyManagePermission(
      session,
      {
        id: existing.id_user,
        kelas: currentStudentClass,
        jenjang: existing.jenjang,
        kelas_saat_prestasi: existing.kelas_saat_prestasi,
      },
      "UPDATE"
    );

    const id_user = (formData.get("id_user") as string) || existing.id_user;
    const nama = (formData.get("nama") as string)?.trim() || existing.nama;
    const kelas = (formData.get("kelas") as string)?.trim() || existing.kelas;
    const kelas_saat_prestasi =
      (formData.get("kelas_saat_prestasi") as string)?.trim() || existing.kelas_saat_prestasi || kelas;
    const tahun_ajaran =
      (formData.get("tahun_ajaran") as string)?.trim() || existing.tahun_ajaran || "2025/2026";
    const tingkat = (formData.get("tingkat") as string)?.trim() || existing.tingkat;
    const peringkat = (formData.get("peringkat") as string)?.trim() || existing.peringkat;
    const prestasi = (formData.get("prestasi") as string)?.trim() || existing.prestasi;
    const tanggal_prestasi_raw = formData.get("tanggal_prestasi") as string;

    const poin = calculateAchievementPoints(tingkat, peringkat);

    let fotoanak = existing.fotoanak;
    const rawFile = formData.get("foto_upload") || formData.get("fotoanak");
    if (rawFile && typeof rawFile === "object" && "size" in rawFile && (rawFile as Blob).size > 0) {
      const uploadRes = await saveUploadedFile(rawFile as Blob, { category: "achievement" });
      if (!uploadRes.success) {
        return { error: uploadRes.error };
      }
      fotoanak = uploadRes.filePath || existing.fotoanak;
    } else if (typeof rawFile === "string" && rawFile.trim().length > 0) {
      fotoanak = rawFile.trim();
    }

    const tanggal_prestasi = tanggal_prestasi_raw
      ? new Date(tanggal_prestasi_raw)
      : existing.tanggal_prestasi;

    await prisma.prestasi.update({
      where: { id: BigInt(id) },
      data: {
        id_user,
        nama,
        kelas,
        kelas_saat_prestasi,
        tahun_ajaran,
        tingkat,
        peringkat,
        poin,
        fotoanak,
        prestasi,
        tanggal_prestasi,
        updated_at: new Date(),
      },
    });

    revalidatePath("/guru/achievements");
    revalidatePath("/admin/achievements");
    revalidatePath("/admin/students");
    revalidatePath("/guru");
    revalidatePath("/siswa");
    revalidatePath("/siswa/profile");

    return { success: true, message: "Prestasi berhasil diperbarui!" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui prestasi.";
    return { error: errorMsg };
  }
}

export async function deleteAchievementAction(id: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    const existing = await prisma.prestasi.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return { error: "Prestasi tidak ditemukan." };
    }

    // Lookup profil kelas siswa saat ini untuk verifikasi keabsahan binaan
    let currentStudentClass = existing.kelas;
    if (existing.id_user && existing.id_user !== "0" && /^\d+$/.test(existing.id_user)) {
      const studentUser = await prisma.user.findUnique({
        where: { id: BigInt(existing.id_user) },
        select: { kelas: true, jenjang: true },
      });
      if (studentUser?.kelas) {
        currentStudentClass = studentUser.kelas;
      }
    }

    // Verifikasi izin akses (Cegah penghapusan arsip kelas sebelumnya / kelas lain)
    AchievementService.verifyManagePermission(
      session,
      {
        id: existing.id_user,
        kelas: currentStudentClass,
        jenjang: existing.jenjang,
        kelas_saat_prestasi: existing.kelas_saat_prestasi,
      },
      "DELETE"
    );

    await prisma.prestasi.delete({
      where: { id: BigInt(id) },
    });

    revalidatePath("/guru/achievements");
    revalidatePath("/admin/achievements");
    revalidatePath("/admin/students");
    revalidatePath("/guru");
    revalidatePath("/siswa");
    revalidatePath("/siswa/profile");

    return { success: true, message: "Prestasi berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menghapus prestasi.";
    return { error: errorMsg };
  }
}

export async function getStudentAchievementHistoryAction(params: {
  userId?: string;
  userName?: string;
}) {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    const { userId, userName } = params;
    if (!userId && !userName) {
      return { error: "Identitas siswa tidak valid." };
    }

    let studentUser: {
      id: bigint;
      name: string;
      nis: string | null;
      kelas: string | null;
      jenjang: string | null;
      image: string | null;
      gender: string | null;
    } | null = null;

    const validBigIntId =
      userId && userId !== "0" && /^\d+$/.test(userId) ? BigInt(userId) : null;

    if (validBigIntId) {
      studentUser = await prisma.user.findUnique({
        where: { id: validBigIntId },
        select: {
          id: true,
          name: true,
          nis: true,
          kelas: true,
          jenjang: true,
          image: true,
          gender: true,
        },
      });
    }

    if (!studentUser && userName) {
      studentUser = await prisma.user.findFirst({
        where: { name: userName.trim() },
        select: {
          id: true,
          name: true,
          nis: true,
          kelas: true,
          jenjang: true,
          image: true,
          gender: true,
        },
      });
    }

    // Bangun filter query pencarian seluruh prestasi
    const orFilters: any[] = [];
    if (userId && userId !== "0") {
      orFilters.push({ id_user: userId });
    }
    if (studentUser) {
      orFilters.push({ id_user: studentUser.id.toString() });
      orFilters.push({ nama: studentUser.name });
    } else if (userName) {
      orFilters.push({ nama: userName.trim() });
    }

    if (orFilters.length === 0) {
      return { error: "Siswa tidak ditemukan." };
    }

    const achievements = await prisma.prestasi.findMany({
      where: {
        OR: orFilters,
      },
      orderBy: [
        { tahun_ajaran: "desc" },
        { tanggal_prestasi: "desc" },
        { created_at: "desc" },
      ],
    });

    // Deduplikasi jika terdapat record kembar berdasarkan ID
    const uniqueMap = new Map<string, (typeof achievements)[0]>();
    for (const item of achievements) {
      const idStr = item.id.toString();
      if (!uniqueMap.has(idStr)) {
        uniqueMap.set(idStr, item);
      }
    }
    const uniqueAchievements = Array.from(uniqueMap.values());

    const totalPoints = uniqueAchievements.reduce((sum, item) => {
      const p = item.poin ?? calculateAchievementPoints(item.tingkat, item.peringkat);
      return sum + p;
    }, 0);

    const studentInfo = {
      id: studentUser ? studentUser.id.toString() : userId || "0",
      name: studentUser ? studentUser.name : userName || (uniqueAchievements[0]?.nama ?? "Siswa"),
      nis: studentUser?.nis || "",
      kelas: studentUser?.kelas || uniqueAchievements[0]?.kelas || "",
      jenjang: studentUser?.jenjang || uniqueAchievements[0]?.jenjang || "SD",
      image: studentUser?.image || null,
      gender: studentUser?.gender || null,
    };

    return {
      success: true,
      student: studentInfo,
      totalPoints,
      totalAchievements: uniqueAchievements.length,
      achievements: uniqueAchievements.map((a) => ({
        id: a.id.toString(),
        id_user: a.id_user,
        nama: a.nama,
        kelas: a.kelas,
        kelas_saat_prestasi: a.kelas_saat_prestasi || a.kelas,
        tahun_ajaran: a.tahun_ajaran || "",
        tingkat: a.tingkat || "Dalam Sekolah",
        peringkat: a.peringkat || "Juara 1",
        poin: a.poin ?? calculateAchievementPoints(a.tingkat, a.peringkat),
        fotoanak: a.fotoanak || "",
        prestasi: a.prestasi,
        tanggal_prestasi: a.tanggal_prestasi ? a.tanggal_prestasi.toISOString() : null,
        created_at: a.created_at ? a.created_at.toISOString() : null,
      })),
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Gagal memuat riwayat prestasi siswa.";
    return { error: errorMsg };
  }
}


