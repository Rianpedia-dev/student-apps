import prisma from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serializer";
import type { CreateInteractiveTaskInput } from "@/types/assignment";

export class AssignmentService {
  /**
   * Mengambil detail tugas interaktif untuk siswa (dengan opsi & status submission siswa)
   */
  static async getTaskForStudent(tugasId: string | bigint, studentId: string | bigint) {
    const tId = BigInt(tugasId);
    const sId = BigInt(studentId);

    const tugas = await prisma.tugas.findUnique({
      where: { id: tId },
      include: {
        kelas: true,
        mapel: true,
        guru: {
          select: { id: true, name: true, image: true, email: true },
        },
        soal: {
          orderBy: { nomor_urut: "asc" },
          include: {
            opsi: {
              orderBy: { nomor_urut: "asc" },
              select: {
                id: true,
                label: true,
                teks_opsi: true,
                gambar_opsi: true,
                // Kunci jawaban (is_benar) disembunyikan agar aman di sisi siswa
              },
            },
          },
        },
        submissions: {
          where: { siswa_id: sId },
          include: {
            jawaban: true,
          },
        },
      },
    });

    return tugas ? serializeBigInt(tugas) : null;
  }

  /**
   * Mengambil detail tugas lengkap untuk guru (termasuk kunci jawaban & opsi benar)
   */
  static async getTaskDetail(tugasId: string | bigint) {
    const tId = BigInt(tugasId);

    const tugas = await prisma.tugas.findUnique({
      where: { id: tId },
      include: {
        kelas: true,
        mapel: true,
        guru: {
          select: { id: true, name: true, image: true, email: true },
        },
        soal: {
          orderBy: { nomor_urut: "asc" },
          include: {
            opsi: {
              orderBy: { nomor_urut: "asc" },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    return tugas ? serializeBigInt(tugas) : null;
  }

  /**
   * Mengambil daftar tugas untuk guru
   */
  static async getTeacherTaskList(guruId: string | bigint, kelasId?: string | bigint) {
    const gId = BigInt(guruId);
    const whereClause: any = { guru_id: gId };
    if (kelasId) {
      whereClause.kelas_id = BigInt(kelasId);
    }

    const list = await prisma.tugas.findMany({
      where: whereClause,
      include: {
        kelas: true,
        mapel: true,
        _count: {
          select: {
            soal: true,
            submissions: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return serializeBigInt(list);
  }

  /**
   * Mengambil daftar tugas untuk siswa
   */
  static async getStudentTaskList(studentId: string | bigint, kelasName: string) {
    const sId = BigInt(studentId);

    const kelas = await prisma.kelas.findFirst({
      where: { nama_kelas: kelasName },
    });

    if (!kelas) return [];

    const list = await prisma.tugas.findMany({
      where: {
        kelas_id: kelas.id,
        status: { in: ["PUBLISHED", "CLOSED"] },
      },
      include: {
        mapel: true,
        guru: {
          select: { id: true, name: true, image: true },
        },
        submissions: {
          where: { siswa_id: sId },
        },
        _count: {
          select: { soal: true },
        },
      },
      orderBy: { deadline: "asc" },
    });

    return serializeBigInt(list);
  }

  /**
   * Membuat tugas interaktif baru dengan butir soal dan opsi
   */
  static async createInteractiveTask(guruId: string | bigint, payload: CreateInteractiveTaskInput) {
    const {
      judul,
      deskripsi,
      kelas_id,
      mapel_id,
      pertemuan_id,
      deadline,
      durasi_menit,
      acak_soal = false,
      acak_opsi = false,
      tampilkan_nilai_instan = true,
      soal = [],
    } = payload;

    const totalPoin = soal.reduce((acc, curr) => acc + (Number(curr.bobot_poin) || 10), 0);
    const poinMaksimal = payload.poin_maksimal || Math.max(10, Math.round(totalPoin));
    const parsedPertemuanId = pertemuan_id && /^\d+$/.test(pertemuan_id) ? BigInt(pertemuan_id) : null;

    const created = await prisma.$transaction(async (tx) => {
      const t = await tx.tugas.create({
        data: {
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          kelas_id: BigInt(kelas_id),
          mapel_id: BigInt(mapel_id),
          guru_id: BigInt(guruId),
          pertemuan_id: parsedPertemuanId,
          deadline: new Date(deadline),
          tipe_pengerjaan: "INTERAKTIF",
          status: "aktif",
          durasi_menit: durasi_menit ? Number(durasi_menit) : null,
          acak_soal: Boolean(acak_soal),
          acak_opsi: Boolean(acak_opsi),
          tampilkan_nilai_instan: Boolean(tampilkan_nilai_instan),
          poin_maksimal: poinMaksimal,
        },
      });

      for (let i = 0; i < soal.length; i++) {
        const item = soal[i];
        const correctOpsi = item.opsi?.find((o) => o.is_benar);
        const derivedKey = item.kunci_jawaban || correctOpsi?.label || null;

        const createdSoal = await tx.tugasSoal.create({
          data: {
            tugas_id: t.id,
            nomor_urut: i + 1,
            tipe_soal: item.tipe_soal,
            pertanyaan: item.pertanyaan.trim(),
            gambar_soal: item.gambar_soal || null,
            bobot_poin: Number(item.bobot_poin) || 10,
            kunci_jawaban: derivedKey,
            pembahasan: item.pembahasan?.trim() || null,
          },
        });

        if (item.tipe_soal === "PILIHAN_GANDA" || item.tipe_soal === "PILIHAN_GAMBAR") {
          for (let j = 0; j < (item.opsi || []).length; j++) {
            const op = item.opsi[j];
            await tx.tugasSoalOpsi.create({
              data: {
                soal_id: createdSoal.id,
                label: op.label || String.fromCharCode(65 + j),
                teks_opsi: op.teks_opsi?.trim() || null,
                gambar_opsi: op.gambar_opsi || null,
                is_benar: Boolean(op.is_benar),
                nomor_urut: j + 1,
              },
            });
          }
        }
      }

      return t;
    });

    return serializeBigInt(created);
  }

  /**
   * Menghapus tugas interaktif beserta soal dan submissionnya
   */
  static async deleteTask(tugasId: string | bigint) {
    return await prisma.tugas.delete({
      where: { id: BigInt(tugasId) },
    });
  }

  /**
   * Mengambil daftar submission tugas untuk guru
   */
  static async getSubmissions(tugasId: string | bigint) {
    const list = await prisma.tugasSubmission.findMany({
      where: { tugas_id: BigInt(tugasId) },
      include: {
        siswa: {
          select: { id: true, name: true, image: true, nis: true, email: true },
        },
        jawaban: {
          include: {
            soal: true,
          },
        },
      },
      orderBy: { submitted_at: "desc" },
    });

    return serializeBigInt(list);
  }

  /**
   * Penilaian submission oleh guru
   */
  static async gradeSubmission(submissionId: string | bigint, nilai: number, catatan?: string) {
    const updated = await prisma.tugasSubmission.update({
      where: { id: BigInt(submissionId) },
      data: {
        nilai,
        catatan_guru: catatan || null,
        status: "SUDAH_DINILAI",
      },
    });

    return serializeBigInt(updated);
  }
}
