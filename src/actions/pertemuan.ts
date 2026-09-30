"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { saveUploadedFile } from "@/lib/upload";
import path from "path";

/**
 * Mengambil daftar pertemuan untuk satu mata pelajaran di satu kelas
 */
export async function getPertemuanList(
  kelasId: string | bigint,
  mapelId: string | bigint,
  options?: { onlyPublished?: boolean; studentId?: bigint }
) {
  try {
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

    return {
      success: true,
      data: pertemuanList.map((p) => ({
        id: p.id.toString(),
        kelasId: p.kelas_id.toString(),
        mapelId: p.mapel_id.toString(),
        guruId: p.guru_id.toString(),
        guruName: p.guru.name,
        guruImage: p.guru.image,
        pertemuanKe: p.pertemuan_ke,
        judul: p.judul,
        deskripsi: p.deskripsi,
        tanggal: p.tanggal.toISOString(),
        fileUrl: p.file_url,
        fileName: p.file_name,
        fileSize: p.file_size,
        fileType: p.file_type,
        videoUrl: p.video_url,
        linkEksternal: p.link_eksternal,
        isPublished: p.is_published,
        tugas: p.tugas.map((t) => ({
          id: t.id.toString(),
          judul: t.judul,
          deskripsi: t.deskripsi,
          deadline: t.deadline.toISOString(),
          poinMaksimal: t.poin_maksimal,
          submission: t.submissions?.[0]
            ? {
                id: t.submissions[0].id.toString(),
                status: t.submissions[0].status,
                nilai: t.submissions[0].nilai,
              }
            : null,
        })),
        isCompleted: p.progressSiswa?.[0]?.is_completed || false,
      })),
    };
  } catch (error) {
    console.error("Gagal mengambil daftar pertemuan:", error);
    return { success: false, error: "Gagal memuat pertemuan pembelajaran." };
  }
}

/**
 * Membuat data pertemuan baru oleh guru / admin
 */
export async function createPertemuanAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Hanya guru atau admin yang berhak membuat materi pertemuan." };
  }

  const kelas_id = formData.get("kelas_id") as string;
  const mapel_id = formData.get("mapel_id") as string;
  const pertemuan_ke = parseInt(formData.get("pertemuan_ke") as string) || 1;
  const judul = (formData.get("judul") as string)?.trim();
  const deskripsi = (formData.get("deskripsi") as string)?.trim() || null;
  const tanggalStr = formData.get("tanggal") as string;
  const video_url = (formData.get("video_url") as string)?.trim() || null;
  const link_eksternal = (formData.get("link_eksternal") as string)?.trim() || null;
  const is_published = formData.get("is_published") === "true";
  const file = formData.get("file_materi") as File | null;
  const linkedTugasId = formData.get("tugas_id") as string | null;

  if (!kelas_id || !mapel_id || !judul || !tanggalStr) {
    return { success: false, error: "Mohon lengkapi judul, kelas, mata pelajaran, dan tanggal pertemuan." };
  }

  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let fileType: string | null = null;

  if (file && file.size > 0) {
    const uploadRes = await saveUploadedFile(file, { category: "material" });
    if (!uploadRes.success) {
      return { success: false, error: uploadRes.error || "Gagal mengunggah berkas materi." };
    }
    fileUrl = uploadRes.filePath || null;
    fileName = file.name;
    fileSize = file.size;
    fileType = path.extname(file.name).toLowerCase().replace(".", "");
  }

  try {
    const pertemuan = await prisma.pertemuan.create({
      data: {
        kelas_id: BigInt(kelas_id),
        mapel_id: BigInt(mapel_id),
        guru_id: BigInt(session.id),
        pertemuan_ke,
        judul,
        deskripsi,
        tanggal: new Date(tanggalStr),
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        video_url,
        link_eksternal,
        is_published,
      },
    });

    // Jika ada tugas yang ditautkan ke pertemuan ini
    if (linkedTugasId && linkedTugasId !== "none") {
      await prisma.tugas.update({
        where: { id: BigInt(linkedTugasId) },
        data: { pertemuan_id: pertemuan.id },
      });
    }

    revalidatePath(`/guru/mapel`);
    revalidatePath(`/guru/mapel/${mapel_id}`);
    revalidatePath(`/siswa/mapel`);
    revalidatePath(`/siswa/mapel/${mapel_id}`);

    return {
      success: true,
      message: `Pertemuan ${pertemuan_ke} berhasil dibuat!`,
      data: { id: pertemuan.id.toString() },
    };
  } catch (err: any) {
    console.error("Gagal membuat pertemuan:", err);
    return { success: false, error: err?.message || "Terjadi kesalahan saat menyimpan data pertemuan." };
  }
}

/**
 * Mengupdate data pertemuan
 */
export async function updatePertemuanAction(id: string, formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Hanya guru atau admin yang berhak memperbarui materi." };
  }

  const pertemuanId = BigInt(id);
  const existing = await prisma.pertemuan.findUnique({
    where: { id: pertemuanId },
  });

  if (!existing) {
    return { success: false, error: "Data pertemuan tidak ditemukan." };
  }

  // Jika bukan admin dan bukan pembuat
  if (session.role !== "admin" && existing.guru_id !== BigInt(session.id)) {
    return { success: false, error: "Anda tidak berhak mengedit pertemuan yang diampu guru lain." };
  }

  const pertemuan_ke = parseInt(formData.get("pertemuan_ke") as string) || existing.pertemuan_ke;
  const judul = (formData.get("judul") as string)?.trim() || existing.judul;
  const deskripsi = (formData.get("deskripsi") as string)?.trim() ?? existing.deskripsi;
  const tanggalStr = formData.get("tanggal") as string;
  const video_url = (formData.get("video_url") as string)?.trim() ?? existing.video_url;
  const link_eksternal = (formData.get("link_eksternal") as string)?.trim() ?? existing.link_eksternal;
  const is_published = formData.has("is_published")
    ? formData.get("is_published") === "true"
    : existing.is_published;
  const file = formData.get("file_materi") as File | null;
  const linkedTugasId = formData.get("tugas_id") as string | null;

  let fileUrl = existing.file_url;
  let fileName = existing.file_name;
  let fileSize = existing.file_size;
  let fileType = existing.file_type;

  if (file && file.size > 0) {
    const uploadRes = await saveUploadedFile(file, { category: "material" });
    if (!uploadRes.success) {
      return { success: false, error: uploadRes.error || "Gagal mengunggah berkas materi baru." };
    }
    fileUrl = uploadRes.filePath || null;
    fileName = file.name;
    fileSize = file.size;
    fileType = path.extname(file.name).toLowerCase().replace(".", "");
  }

  try {
    const updated = await prisma.pertemuan.update({
      where: { id: pertemuanId },
      data: {
        pertemuan_ke,
        judul,
        deskripsi,
        tanggal: tanggalStr ? new Date(tanggalStr) : existing.tanggal,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        video_url,
        link_eksternal,
        is_published,
      },
    });

    // Perbarui tugas terkait
    if (linkedTugasId !== null) {
      // Lepaskan tautan tugas lama yang sebelumnya merujuk ke pertemuan ini
      await prisma.tugas.updateMany({
        where: { pertemuan_id: pertemuanId },
        data: { pertemuan_id: null },
      });

      if (linkedTugasId !== "none" && linkedTugasId !== "") {
        await prisma.tugas.update({
          where: { id: BigInt(linkedTugasId) },
          data: { pertemuan_id: pertemuanId },
        });
      }
    }

    revalidatePath(`/guru/mapel`);
    revalidatePath(`/guru/mapel/${existing.mapel_id}`);
    revalidatePath(`/siswa/mapel`);
    revalidatePath(`/siswa/mapel/${existing.mapel_id}`);

    return {
      success: true,
      message: `Pertemuan ${pertemuan_ke} berhasil diperbarui!`,
    };
  } catch (err: any) {
    console.error("Gagal memperbarui pertemuan:", err);
    return { success: false, error: err?.message || "Terjadi kesalahan saat memperbarui data pertemuan." };
  }
}

/**
 * Menghapus data pertemuan
 */
export async function deletePertemuanAction(id: string) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Hanya guru atau admin yang berhak menghapus pertemuan." };
  }

  try {
    const pertemuanId = BigInt(id);
    const existing = await prisma.pertemuan.findUnique({
      where: { id: pertemuanId },
    });

    if (!existing) {
      return { success: false, error: "Pertemuan tidak ditemukan." };
    }

    // Lepas relasi tugas agar tugas tidak terhapus
    await prisma.tugas.updateMany({
      where: { pertemuan_id: pertemuanId },
      data: { pertemuan_id: null },
    });

    await prisma.pertemuan.delete({
      where: { id: pertemuanId },
    });

    revalidatePath(`/guru/mapel`);
    revalidatePath(`/guru/mapel/${existing.mapel_id}`);
    revalidatePath(`/siswa/mapel`);
    revalidatePath(`/siswa/mapel/${existing.mapel_id}`);

    return { success: true, message: "Pertemuan berhasil dihapus." };
  } catch (err: any) {
    console.error("Gagal menghapus pertemuan:", err);
    return { success: false, error: "Gagal menghapus pertemuan." };
  }
}

/**
 * Toggle Status Publikasi (Draft vs Terbit)
 */
export async function togglePublishPertemuanAction(id: string) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Tidak memiliki hak akses." };
  }

  try {
    const pId = BigInt(id);
    const existing = await prisma.pertemuan.findUnique({ where: { id: pId } });
    if (!existing) return { success: false, error: "Pertemuan tidak ditemukan." };

    const newStatus = !existing.is_published;
    await prisma.pertemuan.update({
      where: { id: pId },
      data: { is_published: newStatus },
    });

    revalidatePath(`/guru/mapel`);
    revalidatePath(`/guru/mapel/${existing.mapel_id}`);
    revalidatePath(`/siswa/mapel`);
    revalidatePath(`/siswa/mapel/${existing.mapel_id}`);

    return {
      success: true,
      isPublished: newStatus,
      message: newStatus ? "Pertemuan diterbitkan untuk siswa!" : "Pertemuan dialihkan ke status Draft.",
    };
  } catch (err) {
    return { success: false, error: "Gagal mengubah status publikasi." };
  }
}

/**
 * Aksi Siswa: Menandai Materi Sudah Dipelajari
 */
export async function toggleMarkAsStudiedAction(pertemuanId: string) {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    return { success: false, error: "Hanya siswa yang dapat menandai progress belajar." };
  }

  try {
    const pId = BigInt(pertemuanId);
    const siswaId = BigInt(session.id);

    const existingProgress = await prisma.pertemuanProgress.findUnique({
      where: {
        pertemuan_id_siswa_id: {
          pertemuan_id: pId,
          siswa_id: siswaId,
        },
      },
    });

    let newStatus = true;
    if (existingProgress) {
      newStatus = !existingProgress.is_completed;
      await prisma.pertemuanProgress.update({
        where: { id: existingProgress.id },
        data: {
          is_completed: newStatus,
          completed_at: newStatus ? new Date() : null,
        },
      });
    } else {
      await prisma.pertemuanProgress.create({
        data: {
          pertemuan_id: pId,
          siswa_id: siswaId,
          is_completed: true,
          completed_at: new Date(),
        },
      });
    }

    const pertemuan = await prisma.pertemuan.findUnique({
      where: { id: pId },
      select: { mapel_id: true },
    });

    if (pertemuan) {
      revalidatePath(`/siswa/mapel/${pertemuan.mapel_id}`);
    }

    return {
      success: true,
      isCompleted: newStatus,
      message: newStatus
        ? "Alhamdulillah! Pertemuan ini telah kamu selesaikan ⭐"
        : "Status belajar dibatalkan.",
    };
  } catch (err) {
    console.error("Gagal menandai materi:", err);
    return { success: false, error: "Gagal memperbarui status belajar." };
  }
}

/**
 * Guru: Duplikasi Materi ke Kelas Lain (Misal dari 4A ke 4B dan 4C)
 */
export async function duplicatePertemuanToKelasAction(
  sourcePertemuanId: string,
  targetKelasIds: string[]
) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Hanya guru atau admin yang berhak menyalin materi." };
  }

  try {
    const pId = BigInt(sourcePertemuanId);
    const source = await prisma.pertemuan.findUnique({ where: { id: pId } });

    if (!source) {
      return { success: false, error: "Pertemuan sumber tidak ditemukan." };
    }

    for (const targetId of targetKelasIds) {
      const tKelasId = BigInt(targetId);
      // Jangan duplikasi ke kelas yang sama
      if (tKelasId === source.kelas_id) continue;

      await prisma.pertemuan.create({
        data: {
          kelas_id: tKelasId,
          mapel_id: source.mapel_id,
          guru_id: BigInt(session.id),
          pertemuan_ke: source.pertemuan_ke,
          judul: source.judul,
          deskripsi: source.deskripsi,
          tanggal: source.tanggal,
          file_url: source.file_url,
          file_name: source.file_name,
          file_size: source.file_size,
          file_type: source.file_type,
          video_url: source.video_url,
          link_eksternal: source.link_eksternal,
          is_published: source.is_published,
        },
      });
    }

    revalidatePath(`/guru/mapel`);
    revalidatePath(`/guru/mapel/${source.mapel_id}`);

    return {
      success: true,
      message: `Materi berhasil disalin ke ${targetKelasIds.length} kelas paralel!`,
    };
  } catch (err) {
    console.error("Gagal menyalin pertemuan:", err);
    return { success: false, error: "Gagal menduplikasi pertemuan ke kelas lain." };
  }
}
