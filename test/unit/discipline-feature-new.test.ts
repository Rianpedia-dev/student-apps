import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createViolationAction,
  updateViolationAction,
  deleteViolationAction,
} from "@/actions/guru";
import {
  parseViolationKeterangan,
  VIOLATION_SEVERITY_OPTIONS,
} from "@/lib/constants/violations";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveSemester } from "@/lib/semester";

vi.mock("@/lib/prisma", () => ({
  default: {
    pelanggaran: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    tahunAjar: {
      findFirst: vi.fn(),
    },
    kelas: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("New Discipline Violation Features (Jenjang, Auto-fields, Wali Kelas, Siswa Filter)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Validasi Hak Akses Jenjang (SD & SMP)", () => {
    it("Guru SD HANYA boleh mencatat pelanggaran siswa jenjang SD", async () => {
      // Guru SD
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "201",
        name: "Ustadzah Fatimah, S.Pd",
        role: "guru",
        jenjang: "SD",
      } as any);

      // Siswa target SD
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: BigInt(301),
        name: "Rayhan SD",
        kelas: "Kelas 4 - Mehmed Al Fatih",
        jenjang: "SD",
      } as any);

      vi.mocked(prisma.tahunAjar.findFirst).mockResolvedValueOnce({
        id: BigInt(1),
        semester: "1",
        tahun: "2026/2027",
      } as any);

      vi.mocked(prisma.pelanggaran.create).mockResolvedValueOnce({
        id: BigInt(10),
      } as any);

      const formData = new FormData();
      formData.set("user_id", "301");
      formData.set("nama", "Rayhan SD");
      formData.set("kelas", "Kelas 4 - Mehmed Al Fatih");
      formData.set("kategori", "Kedisiplinan");
      formData.set("keterangan", "Lupa membawa sajadah");
      formData.set("severity", "RINGAN");

      const result = await createViolationAction(formData);
      expect(result.success).toBe(true);
      expect(prisma.pelanggaran.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jenjang: "SD",
            guru_nama: "Ustadzah Fatimah, S.Pd",
            tingkatan: "RINGAN",
          }),
        })
      );
    });

    it("Guru SD DITOLAK saat mencoba mencatat pelanggaran siswa jenjang SMP", async () => {
      // Guru SD
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "201",
        name: "Ustadzah Fatimah, S.Pd",
        role: "guru",
        jenjang: "SD",
      } as any);

      // Siswa target SMP
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: BigInt(401),
        name: "Haidar SMP",
        kelas: "Kelas 7 - Ibnu Sina",
        jenjang: "SMP",
      } as any);

      const formData = new FormData();
      formData.set("user_id", "401");
      formData.set("nama", "Haidar SMP");
      formData.set("kelas", "Kelas 7 - Ibnu Sina");
      formData.set("kategori", "Kedisiplinan");
      formData.set("keterangan", "Tidak membawa iPad");
      formData.set("severity", "SEDANG");

      const result = await createViolationAction(formData);
      expect(result.error).toContain("Akses ditolak: Anda adalah guru jenjang SD");
      expect(prisma.pelanggaran.create).not.toHaveBeenCalled();
    });

    it("Guru SMP HANYA boleh mencatat pelanggaran siswa jenjang SMP", async () => {
      // Guru SMP
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Ustadz Farhan, S.Pd",
        role: "guru",
        jenjang: "SMP",
      } as any);

      // Siswa target SMP
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: BigInt(401),
        name: "Haidar SMP",
        kelas: "Kelas 7 - Ibnu Sina",
        jenjang: "SMP",
      } as any);

      vi.mocked(prisma.pelanggaran.create).mockResolvedValueOnce({
        id: BigInt(11),
      } as any);

      const formData = new FormData();
      formData.set("user_id", "401");
      formData.set("kategori", "Kedisiplinan");
      formData.set("keterangan", "Bermain game di jam KBM");
      formData.set("severity", "SEDANG");

      const result = await createViolationAction(formData);
      expect(result.success).toBe(true);
      expect(prisma.pelanggaran.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jenjang: "SMP",
            guru_nama: "Ustadz Farhan, S.Pd",
            tingkatan: "SEDANG",
          }),
        })
      );
    });

    it("Guru Lintas Jenjang (jenjang=ALL) BISA mencatat untuk siswa SD maupun SMP", async () => {
      // Guru Lintas
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "203",
        name: "Ustadz Ahmad (Guru Lintas)",
        role: "guru",
        jenjang: "ALL",
      } as any);

      // Siswa target SMP
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: BigInt(401),
        name: "Haidar SMP",
        kelas: "Kelas 7 - Ibnu Sina",
        jenjang: "SMP",
      } as any);

      vi.mocked(prisma.pelanggaran.create).mockResolvedValueOnce({
        id: BigInt(12),
      } as any);

      const formData = new FormData();
      formData.set("user_id", "401");
      formData.set("kategori", "Ibadah");
      formData.set("keterangan", "Terlambat sholat berjamaah");
      formData.set("severity", "RINGAN");

      const result = await createViolationAction(formData);
      expect(result.success).toBe(true);
    });
  });

  describe("2. Otomatisasi Field & Format", () => {
    it("Otomatis menyematkan semester berjalan dan nama guru pembuat", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "555",
        name: "Ustadzah Nurul",
        role: "guru",
        jenjang: "SD",
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: BigInt(666),
        name: "Siswa Cilik",
        kelas: "Kelas 2 - Tariq bin Ziyad",
        jenjang: "SD",
      } as any);

      vi.mocked(prisma.tahunAjar.findFirst).mockResolvedValueOnce({
        id: BigInt(1),
        semester: "1",
        tahun: "2026/2027",
      } as any);

      vi.mocked(prisma.pelanggaran.create).mockResolvedValueOnce({
        id: BigInt(13),
      } as any);

      const formData = new FormData();
      formData.set("user_id", "666");
      formData.set("kategori", "Ketertiban");
      formData.set("keterangan", "Tidak memakai atribut upacara lengkap");
      formData.set("severity", "RINGAN");

      const result = await createViolationAction(formData);
      expect(result.success).toBe(true);
      expect(prisma.pelanggaran.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            guru_id: BigInt(555),
            guru_nama: "Ustadzah Nurul",
            semester: "Semester 1 - 2026/2027",
            tahun_pelajaran: "2026/2027",
            tingkatan: "RINGAN",
          }),
        })
      );
    });

    it("Opsi tingkatan pelanggaran harus dibatasi pada RINGAN dan SEDANG", () => {
      expect(VIOLATION_SEVERITY_OPTIONS).toEqual(["RINGAN", "SEDANG"]);
    });

    it("Parser pelanggaran harus memprioritaskan kolom database tingkatan jika tersedia", () => {
      const parsedWithDbField = parseViolationKeterangan(
        "Deskripsi biasa tanpa tag",
        "SEDANG"
      );
      expect(parsedWithDbField.severity).toBe("SEDANG");
      expect(parsedWithDbField.points).toBe(15);
    });
  });

  describe("3. Helper Semester Aktif", () => {
    it("harus mengembalikan semester dari database jika tabel TahunAjar terisi", async () => {
      vi.mocked(prisma.tahunAjar.findFirst).mockResolvedValueOnce({
        id: BigInt(1),
        semester: "2",
        tahun: "2025/2026",
      } as any);

      const sem = await getActiveSemester();
      expect(sem.semester).toBe("Semester 2 - 2025/2026");
      expect(sem.tahunPelajaran).toBe("2025/2026");
      expect(sem.semesterNum).toBe(2);
    });

    it("harus fallback ke kalkulasi otomatis jika tabel TahunAjar kosong", async () => {
      vi.mocked(prisma.tahunAjar.findFirst).mockResolvedValueOnce(null);

      // Testing with a specific date in August (Semester 1)
      const augDate = new Date("2026-08-15");
      const sem = await getActiveSemester(augDate);
      expect(sem.semester).toBe("Semester 1 - 2026/2027");
      expect(sem.tahunPelajaran).toBe("2026/2027");
      expect(sem.semesterNum).toBe(1);
    });
  });

  describe("4. Otorisasi Kepemilikan Catatan (Hanya Pembuat yang Boleh Edit & Hapus)", () => {
    it("Guru A (author) berhasil mengedit catatan miliknya sendiri", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "201",
        name: "Ustadzah Fatimah, S.Pd",
        role: "guru",
      } as any);

      vi.mocked(prisma.pelanggaran.findUnique).mockResolvedValueOnce({
        id: BigInt(88),
        guru_id: BigInt(201),
        guru_nama: "Ustadzah Fatimah, S.Pd",
        user_id: "301",
      } as any);

      vi.mocked(prisma.pelanggaran.update).mockResolvedValueOnce({
        id: BigInt(88),
        user_id: "301",
      } as any);

      const formData = new FormData();
      formData.set("id", "88");
      formData.set("kategori", "Ketertiban");
      formData.set("keterangan", "Deskripsi yang telah dikoreksi");
      formData.set("severity", "SEDANG");

      const result = await updateViolationAction(formData);
      expect(result.success).toBe(true);
      expect(prisma.pelanggaran.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(88) },
          data: expect.objectContaining({
            kategori: "Ketertiban",
            tingkatan: "SEDANG",
          }),
        })
      );
    });

    it("Guru B (bukan pembuat) DITOLAK saat mencoba mengedit catatan milik Guru A", async () => {
      // Guru B mencoba mengedit
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Ustadz Ahmad, S.Pd",
        role: "guru",
      } as any);

      // Catatan dibuat oleh Guru A (id: 201)
      vi.mocked(prisma.pelanggaran.findUnique).mockResolvedValueOnce({
        id: BigInt(88),
        guru_id: BigInt(201),
        guru_nama: "Ustadzah Fatimah, S.Pd",
        user_id: "301",
      } as any);

      const formData = new FormData();
      formData.set("id", "88");
      formData.set("kategori", "Ketertiban");
      formData.set("keterangan", "Coba ubah tanpa izin");
      formData.set("severity", "RINGAN");

      const result = await updateViolationAction(formData);
      expect(result.error).toMatch(/Hanya guru pembuat catatan/i);
      expect(prisma.pelanggaran.update).not.toHaveBeenCalled();
    });

    it("Guru B (bukan pembuat) DITOLAK saat mencoba menghapus catatan milik Guru A", async () => {
      // Guru B mencoba menghapus
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Ustadz Ahmad, S.Pd",
        role: "guru",
      } as any);

      // Catatan dibuat oleh Guru A (id: 201)
      vi.mocked(prisma.pelanggaran.findUnique).mockResolvedValueOnce({
        id: BigInt(88),
        guru_id: BigInt(201),
        guru_nama: "Ustadzah Fatimah, S.Pd",
        user_id: "301",
      } as any);

      const result = await deleteViolationAction("88");
      expect(result.error).toMatch(/Hanya guru pembuat catatan/i);
      expect(prisma.pelanggaran.delete).not.toHaveBeenCalled();
    });

    it("Guru A (author) berhasil menghapus catatan miliknya sendiri", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "201",
        name: "Ustadzah Fatimah, S.Pd",
        role: "guru",
      } as any);

      vi.mocked(prisma.pelanggaran.findUnique).mockResolvedValueOnce({
        id: BigInt(88),
        guru_id: BigInt(201),
        guru_nama: "Ustadzah Fatimah, S.Pd",
        user_id: "301",
      } as any);

      vi.mocked(prisma.pelanggaran.delete).mockResolvedValueOnce({
        id: BigInt(88),
        user_id: "301",
      } as any);

      const result = await deleteViolationAction("88");
      expect(result.success).toBe(true);
      expect(prisma.pelanggaran.delete).toHaveBeenCalledWith({
        where: { id: BigInt(88) },
      });
    });

    it("Admin diizinkan mengedit dan menghapus catatan milik guru manapun", async () => {
      // Sesi Admin
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "1",
        name: "Super Admin",
        role: "admin",
      } as any);

      // Catatan milik Guru A
      vi.mocked(prisma.pelanggaran.findUnique).mockResolvedValueOnce({
        id: BigInt(99),
        guru_id: BigInt(201),
        guru_nama: "Ustadzah Fatimah, S.Pd",
        user_id: "301",
      } as any);

      vi.mocked(prisma.pelanggaran.delete).mockResolvedValueOnce({
        id: BigInt(99),
        user_id: "301",
      } as any);

      const result = await deleteViolationAction("99");
      expect(result.success).toBe(true);
      expect(prisma.pelanggaran.delete).toHaveBeenCalledWith({
        where: { id: BigInt(99) },
      });
    });
  });
});

