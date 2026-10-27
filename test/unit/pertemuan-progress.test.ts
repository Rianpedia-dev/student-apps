import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPertemuanList,
  toggleMarkAsStudiedAction,
  duplicatePertemuanToKelasAction,
  togglePublishPertemuanAction,
} from "@/actions/pertemuan";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

vi.mock("@/lib/prisma", () => ({
  default: {
    pertemuan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    pertemuanProgress: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    tugas: {
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Suite 6: Pertemuan Belajar & Progres Kelulusan Materi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("6.1: Toggle Kelulusan Materi (toggleMarkAsStudiedAction)", () => {
    it("harus menandai siswa telah menyelesaikan materi dan mencatat completed_at saat pertama kali dipelajari", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Ahmad Siswa",
        role: "siswa",
      } as any);

      vi.mocked(prisma.pertemuanProgress.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.pertemuanProgress.create).mockResolvedValueOnce({
        id: BigInt(1),
        pertemuan_id: BigInt(5),
        siswa_id: BigInt(101),
        is_completed: true,
        completed_at: new Date(),
      } as any);

      vi.mocked(prisma.pertemuan.findUnique).mockResolvedValueOnce({
        id: BigInt(5),
        mapel_id: BigInt(10),
      } as any);

      const result = await toggleMarkAsStudiedAction("5");

      expect(result.success).toBe(true);
      expect(result.isCompleted).toBe(true);
      expect(prisma.pertemuanProgress.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pertemuan_id: BigInt(5),
            siswa_id: BigInt(101),
            is_completed: true,
          }),
        })
      );
    });

    it("harus membatalkan status kelulusan (uncheck) jika materi sebelumnya sudah ditandai selesai", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Ahmad Siswa",
        role: "siswa",
      } as any);

      vi.mocked(prisma.pertemuanProgress.findUnique).mockResolvedValueOnce({
        id: BigInt(1),
        is_completed: true,
      } as any);

      vi.mocked(prisma.pertemuanProgress.update).mockResolvedValueOnce({} as any);
      vi.mocked(prisma.pertemuan.findUnique).mockResolvedValueOnce({
        id: BigInt(5),
        mapel_id: BigInt(10),
      } as any);

      const result = await toggleMarkAsStudiedAction("5");

      expect(result.success).toBe(true);
      expect(result.isCompleted).toBe(false);
      expect(prisma.pertemuanProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(1) },
          data: expect.objectContaining({
            is_completed: false,
            completed_at: null,
          }),
        })
      );
    });

    it("harus menolak aksi jika dilakukan oleh selain siswa", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Guru Pengampu",
        role: "guru",
      } as any);

      const result = await toggleMarkAsStudiedAction("5");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Hanya siswa yang dapat menandai progress belajar");
    });
  });

  describe("6.2: Filter Materi Terpublikasi (is_published)", () => {
    it("harus menyaring hanya materi is_published = true untuk tampilan siswa", async () => {
      vi.mocked(prisma.pertemuan.findMany).mockResolvedValueOnce([
        {
          id: BigInt(1),
          kelas_id: BigInt(1),
          mapel_id: BigInt(10),
          guru_id: BigInt(202),
          guru: { id: BigInt(202), name: "Guru Budi", image: null },
          pertemuan_ke: 1,
          judul: "Pengantar Aljabar",
          deskripsi: null,
          tanggal: new Date("2026-10-01"),
          file_url: null,
          fileName: null,
          fileSize: null,
          fileType: null,
          video_url: null,
          link_eksternal: null,
          is_published: true,
          tugas: [],
          progressSiswa: [],
        },
      ] as any);

      const result = await getPertemuanList("1", "10", {
        onlyPublished: true,
        studentId: BigInt(101),
      });

      expect(result.success).toBe(true);
      expect(prisma.pertemuan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            kelas_id: BigInt(1),
            mapel_id: BigInt(10),
            is_published: true,
          }),
        })
      );
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].judul).toBe("Pengantar Aljabar");
    });

    it("harus dapat mengubah status publikasi materi (Draft <-> Terbit) oleh guru", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Guru Pengampu",
        role: "guru",
      } as any);

      vi.mocked(prisma.pertemuan.findUnique).mockResolvedValueOnce({
        id: BigInt(9),
        mapel_id: BigInt(10),
        is_published: false,
      } as any);

      vi.mocked(prisma.pertemuan.update).mockResolvedValueOnce({} as any);

      const result = await togglePublishPertemuanAction("9");

      expect(result.success).toBe(true);
      expect(result.isPublished).toBe(true);
      expect(prisma.pertemuan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(9) },
          data: { is_published: true },
        })
      );
    });
  });

  describe("6.3: Penggandaan Materi ke Rombel Kelas Paralel (duplicatePertemuanToKelasAction)", () => {
    it("harus menyalin data pertemuan ke kelas target tanpa merusak foreign key mapel dan guru", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Guru Pengampu",
        role: "guru",
      } as any);

      const sourceMeeting = {
        id: BigInt(10),
        kelas_id: BigInt(1), // Kelas 4 Abu Bakar
        mapel_id: BigInt(10),
        guru_id: BigInt(202),
        pertemuan_ke: 3,
        judul: "Operasi Pecahan Campuran",
        deskripsi: "Pelajari bab pecahan halaman 45",
        tanggal: new Date("2026-10-20"),
        file_url: "/uploads/materials/pecahan.pdf",
        file_name: "pecahan.pdf",
        file_size: 1048576,
        file_type: "pdf",
        video_url: "https://youtube.com/watch?v=123",
        link_eksternal: null,
        is_published: true,
      };

      vi.mocked(prisma.pertemuan.findUnique).mockResolvedValueOnce(sourceMeeting as any);
      vi.mocked(prisma.pertemuan.create).mockResolvedValue({ id: BigInt(11) } as any);

      // Duplikasi ke 4 Umar (kelasId: "2") dan 4 Utsman (kelasId: "3")
      const result = await duplicatePertemuanToKelasAction("10", ["2", "3"]);

      expect(result.success).toBe(true);
      expect(prisma.pertemuan.create).toHaveBeenCalledTimes(2);
      expect(prisma.pertemuan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kelas_id: BigInt(2),
            mapel_id: BigInt(10),
            guru_id: BigInt(202),
            judul: "Operasi Pecahan Campuran",
          }),
        })
      );
      expect(prisma.pertemuan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kelas_id: BigInt(3),
            mapel_id: BigInt(10),
            guru_id: BigInt(202),
            judul: "Operasi Pecahan Campuran",
          }),
        })
      );
    });

    it("tidak boleh menyalin ke kelas sumber itu sendiri jika tidak sengaja disertakan", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Guru Pengampu",
        role: "guru",
      } as any);

      vi.mocked(prisma.pertemuan.findUnique).mockResolvedValueOnce({
        id: BigInt(10),
        kelas_id: BigInt(1), // Kelas 1
        mapel_id: BigInt(10),
        pertemuan_ke: 1,
        judul: "Materi 1",
        tanggal: new Date(),
        is_published: true,
      } as any);

      // Kirim target "1" (kelas sumber) dan "2" (kelas target)
      await duplicatePertemuanToKelasAction("10", ["1", "2"]);

      // Hanya boleh dipanggil 1 kali untuk kelas 2
      expect(prisma.pertemuan.create).toHaveBeenCalledTimes(1);
      expect(prisma.pertemuan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kelas_id: BigInt(2),
          }),
        })
      );
    });
  });
});
