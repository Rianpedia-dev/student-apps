import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { createKelasOnlineRoomSchema } from "@/lib/validators/kelas-online.schema";
import { KelasOnlineService } from "@/services/kelas-online.service";
import { POST as createRoomHandler } from "@/app/api/kelas-online/create-room/route";
import { POST as joinRoomHandler } from "@/app/api/kelas-online/join-room/route";

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    kelas: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    mataPelajaran: {
      findMany: vi.fn(),
    },
    jadwalPelajaran: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    pertemuan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    kelasOnline: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    kelasOnlineAttendance: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/jenjang", () => ({
  getActiveJenjang: vi.fn(),
}));

vi.mock("@/lib/daily", () => ({
  createDailyRoom: vi.fn().mockResolvedValue({
    id: "daily-room-1",
    name: "alazhar-kelas-4-123",
    url: "https://alazhar.daily.co/alazhar-kelas-4-123",
    config: { max_participants: 50 },
  }),
  createMeetingToken: vi.fn().mockResolvedValue({ token: "mock-daily-token" }),
  deleteDailyRoom: vi.fn().mockResolvedValue(undefined),
  generateRoomName: vi.fn().mockReturnValue("alazhar-kelas-4-123"),
}));

describe("MODUL KELAS ONLINE: Validasi, Pengampu, Anti-Duplikat, & Auto-Cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.kelasOnline.findMany).mockResolvedValue([]);
  });

  describe("1. Validasi Skema Zod", () => {
    it("menerima payload pembuatan room MAPEL dan WALI_KELAS yang valid", () => {
      expect(
        createKelasOnlineRoomSchema.safeParse({
          sessionType: "MAPEL",
          kelasId: "1",
          mapelId: "2",
          pertemuanId: "5",
          topik: "Pembahasan Bab 1",
        }).success
      ).toBe(true);

      expect(
        createKelasOnlineRoomSchema.safeParse({
          sessionType: "WALI_KELAS",
          topik: "Pembinaan Pagi",
        }).success
      ).toBe(true);
    });

    it("menolak sessionType di luar MAPEL atau WALI_KELAS", () => {
      expect(
        createKelasOnlineRoomSchema.safeParse({
          sessionType: "LAINNYA",
        }).success
      ).toBe(false);
    });
  });

  describe("2. Resolusi Konteks Pengampu (Guru Mapel vs Wali Kelas vs Fallback)", () => {
    it("Guru Mapel (status=2, kelas=null) mendapat daftar kelas & mapel dari JadwalPelajaran", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: BigInt(10),
        name: "Ustadzah Nurul",
        status: "2",
        kelas: null,
        guru_bidang: "Matematika",
        jenjang: "SD",
      } as never);

      vi.mocked(prisma.jadwalPelajaran.findMany).mockResolvedValueOnce([
        {
          id: BigInt(100),
          kelas_id: BigInt(1),
          mapel_id: BigInt(5),
          hari: "Senin",
          jam_mulai: "07:30",
          jam_selesai: "08:30",
          kelas: { id: BigInt(1), nama_kelas: "Kelas 4 - Mehmed", jenjang: "SD", tingkat: 4 },
          mapel: { id: BigInt(5), kode_mapel: "MTK", nama_mapel: "Matematika", warna: "emerald" },
        },
        {
          id: BigInt(101),
          kelas_id: BigInt(2),
          mapel_id: BigInt(5),
          hari: "Selasa",
          jam_mulai: "09:00",
          jam_selesai: "10:00",
          kelas: { id: BigInt(2), nama_kelas: "Kelas 5 - Fatih", jenjang: "SD", tingkat: 5 },
          mapel: { id: BigInt(5), kode_mapel: "MTK", nama_mapel: "Matematika", warna: "emerald" },
        },
      ] as never);

      vi.mocked(prisma.pertemuan.findMany).mockResolvedValueOnce([]);

      const ctx = await KelasOnlineService.getTeacherOnlineClassContext("10", "SD");

      expect(ctx.isWaliKelas).toBe(false);
      expect(ctx.waliKelas).toBeNull();
      expect(ctx.hasScheduleMapping).toBe(true);
      expect(ctx.classes).toHaveLength(2);
      expect(ctx.subjectsByClass["1"]).toHaveLength(1);
      expect(ctx.subjectsByClass["1"][0].namaMapel).toBe("Matematika");
    });

    it("Guru Mapel tanpa JadwalPelajaran mendapat fallback seluruh kelas & mapel di jenjang aktif", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: BigInt(11),
        name: "Ustadz Baru",
        status: "2",
        kelas: null,
        guru_bidang: "IPAS",
        jenjang: "SD",
      } as never);

      vi.mocked(prisma.jadwalPelajaran.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.kelas.findMany).mockResolvedValueOnce([
        { id: BigInt(1), nama_kelas: "Kelas 4 - Mehmed", jenjang: "SD", tingkat: 4 },
      ] as never);
      vi.mocked(prisma.mataPelajaran.findMany).mockResolvedValueOnce([
        { id: BigInt(6), kode_mapel: "IPA", nama_mapel: "IPAS", warna: "teal" },
      ] as never);
      vi.mocked(prisma.pertemuan.findMany).mockResolvedValueOnce([]);

      const ctx = await KelasOnlineService.getTeacherOnlineClassContext("11", "SD");

      expect(ctx.hasScheduleMapping).toBe(false);
      expect(ctx.classes).toHaveLength(1);
      expect(ctx.subjectsByClass["1"][0].namaMapel).toBe("IPAS");
    });

    it("Wali Kelas (status=4) mendapat info waliKelas dan jadwal mengajarnya", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: BigInt(12),
        name: "Ustadzah Fatimah",
        status: "4",
        kelas: "Kelas 4 - Mehmed",
        guru_bidang: "PAI",
        jenjang: "SD",
      } as never);

      vi.mocked(prisma.kelas.findFirst).mockResolvedValueOnce({
        id: BigInt(1),
        nama_kelas: "Kelas 4 - Mehmed",
        jenjang: "SD",
        tingkat: 4,
      } as never);

      vi.mocked(prisma.jadwalPelajaran.findMany).mockResolvedValueOnce([
        {
          id: BigInt(102),
          kelas_id: BigInt(1),
          mapel_id: BigInt(7),
          hari: "Rabu",
          jam_mulai: "08:00",
          jam_selesai: "09:00",
          kelas: { id: BigInt(1), nama_kelas: "Kelas 4 - Mehmed", jenjang: "SD", tingkat: 4 },
          mapel: { id: BigInt(7), kode_mapel: "PAI", nama_mapel: "PAI", warna: "emerald" },
        },
      ] as never);
      vi.mocked(prisma.pertemuan.findMany).mockResolvedValueOnce([]);

      const ctx = await KelasOnlineService.getTeacherOnlineClassContext("12", "SD");

      expect(ctx.isWaliKelas).toBe(true);
      expect(ctx.waliKelas?.namaKelas).toBe("Kelas 4 - Mehmed");
      expect(ctx.hasScheduleMapping).toBe(true);
    });
  });

  describe("3. API /api/kelas-online/create-room & /join-room", () => {
    it("Guru Mapel (kelas=null) berhasil membuat room MAPEL dan mengembalikan roomId & token", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "10",
        name: "Ustadzah Nurul",
        role: "guru",
        status: "2",
        kelas: null,
        jenjang: "SD",
      } as never);
      vi.mocked(getActiveJenjang).mockResolvedValueOnce("SD");

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: BigInt(10),
        name: "Ustadzah Nurul",
        status: "2",
        kelas: null,
        guru_bidang: "Matematika",
        jenjang: "SD",
      } as never);
      vi.mocked(prisma.jadwalPelajaran.findMany).mockResolvedValueOnce([
        {
          id: BigInt(100),
          kelas_id: BigInt(1),
          mapel_id: BigInt(5),
          hari: "Senin",
          jam_mulai: "07:30",
          jam_selesai: "08:30",
          kelas: { id: BigInt(1), nama_kelas: "Kelas 4 - Mehmed", jenjang: "SD", tingkat: 4 },
          mapel: { id: BigInt(5), kode_mapel: "MTK", nama_mapel: "Matematika", warna: "emerald" },
        },
      ] as never);
      vi.mocked(prisma.pertemuan.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.kelasOnline.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.kelasOnline.create).mockResolvedValueOnce({
        id: BigInt(555),
        room_name: "alazhar-kelas-4-123",
      } as never);

      const req = new Request("http://localhost/api/kelas-online/create-room", {
        method: "POST",
        body: JSON.stringify({
          sessionType: "MAPEL",
          kelasId: "1",
          mapelId: "5",
          topik: "Pecahan Senilai",
        }),
      });

      const res = await createRoomHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.roomId).toBe("555");
      expect(data.token).toBe("mock-daily-token");
      expect(prisma.kelasOnline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kelas_id: BigInt(1),
            mapel_id: BigInt(5),
            session_type: "MAPEL",
            topik: "Pecahan Senilai",
          }),
        })
      );
    });

    it("mengembalikan 409 Conflict beserta existingRoom jika sudah ada room aktif di kelas & mapel sama", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "10",
        name: "Ustadzah Nurul",
        role: "guru",
        status: "2",
        kelas: null,
        jenjang: "SD",
      } as never);
      vi.mocked(getActiveJenjang).mockResolvedValueOnce("SD");

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: BigInt(10),
        name: "Ustadzah Nurul",
        status: "2",
        kelas: null,
        guru_bidang: "Matematika",
        jenjang: "SD",
      } as never);
      vi.mocked(prisma.jadwalPelajaran.findMany).mockResolvedValueOnce([
        {
          id: BigInt(100),
          kelas_id: BigInt(1),
          mapel_id: BigInt(5),
          hari: "Senin",
          jam_mulai: "07:30",
          jam_selesai: "08:30",
          kelas: { id: BigInt(1), nama_kelas: "Kelas 4 - Mehmed", jenjang: "SD", tingkat: 4 },
          mapel: { id: BigInt(5), kode_mapel: "MTK", nama_mapel: "Matematika", warna: "emerald" },
        },
      ] as never);
      vi.mocked(prisma.pertemuan.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.kelasOnline.findFirst).mockResolvedValueOnce({
        id: BigInt(777),
        room_name: "existing-room",
        guru_id: BigInt(10),
        guru_name: "Ustadzah Nurul",
        kelas: "Kelas 4 - Mehmed",
        mata_pelajaran: "Matematika",
      } as never);

      const req = new Request("http://localhost/api/kelas-online/create-room", {
        method: "POST",
        body: JSON.stringify({
          sessionType: "MAPEL",
          kelasId: "1",
          mapelId: "5",
        }),
      });

      const res = await createRoomHandler(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.existingRoom.id).toBe("777");
      expect(data.existingRoom.isOwner).toBe(true);
    });

    it("menolak siswa dari kelas berbeda (403) dan mencegah duplikasi absensi saat refresh", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "201",
        name: "Rayhan",
        role: "siswa",
        kelas: "Kelas 5 - Fatih",
      } as never);
      vi.mocked(prisma.kelasOnline.findUnique).mockResolvedValueOnce({
        id: BigInt(88),
        room_name: "room-88",
        room_url: "https://alazhar.daily.co/room-88",
        kelas: "Kelas 4 - Mehmed",
        kelas_id: BigInt(1),
        status: "active",
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        kelas: "Kelas 5 - Fatih",
      } as never);
      vi.mocked(prisma.kelas.findFirst).mockResolvedValueOnce({
        id: BigInt(2),
      } as never);

      const deniedRes = await joinRoomHandler(
        new Request("http://localhost/api/kelas-online/join-room", {
          method: "POST",
          body: JSON.stringify({ roomId: "88" }),
        })
      );
      expect(deniedRes.status).toBe(403);

      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Zahra",
        role: "siswa",
        kelas: "Kelas 4 - Mehmed",
      } as never);
      vi.mocked(prisma.kelasOnline.findUnique).mockResolvedValueOnce({
        id: BigInt(88),
        room_name: "room-88",
        room_url: "https://alazhar.daily.co/room-88",
        kelas: "Kelas 4 - Mehmed",
        kelas_id: BigInt(1),
        status: "active",
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        kelas: "Kelas 4 - Mehmed",
      } as never);
      vi.mocked(prisma.kelas.findFirst).mockResolvedValueOnce({
        id: BigInt(1),
      } as never);
      vi.mocked(prisma.kelasOnlineAttendance.findFirst).mockResolvedValueOnce({
        id: BigInt(999),
      } as never);

      const okRes = await joinRoomHandler(
        new Request("http://localhost/api/kelas-online/join-room", {
          method: "POST",
          body: JSON.stringify({ roomId: "88" }),
        })
      );
      const okData = await okRes.json();

      expect(okRes.status).toBe(200);
      expect(okData.attendanceId).toBe("999");
      expect(prisma.kelasOnlineAttendance.create).not.toHaveBeenCalled();
    });
  });

  describe("4. Auto-Cleanup Room Kedaluwarsa", () => {
    it("menutup room aktif yang berumur > 4 jam beserta attendance yang masih menggantung", async () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      vi.mocked(prisma.kelasOnline.findMany).mockResolvedValueOnce([
        {
          id: BigInt(301),
          room_name: "expired-room",
          started_at: fiveHoursAgo,
          created_at: fiveHoursAgo,
        },
      ] as never);
      vi.mocked(prisma.kelasOnlineAttendance.findMany).mockResolvedValueOnce([
        {
          id: BigInt(401),
          joined_at: fiveHoursAgo,
        },
      ] as never);

      const closedCount = await KelasOnlineService.cleanupExpiredRooms();

      expect(closedCount).toBe(1);
      expect(prisma.kelasOnline.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(301) },
          data: expect.objectContaining({ status: "ended" }),
        })
      );
      expect(prisma.kelasOnlineAttendance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(401) },
          data: expect.objectContaining({ duration_minutes: 240 }),
        })
      );
    });
  });
});
