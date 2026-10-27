import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as healthHandler } from "@/app/api/health/route";
import { GET as socketTokenHandler } from "@/app/api/socket-token/route";
import { POST as endRoomHandler } from "@/app/api/kelas-online/end-room/route";
import { saveUploadedFile } from "@/lib/upload";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { jwtVerify } from "jose";

vi.mock("@/lib/prisma", () => ({
  default: {
    $queryRaw: vi.fn(),
    chatRoom: {
      findMany: vi.fn(),
    },
    kelasOnline: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    kelasOnlineAttendance: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/daily", () => ({
  deleteDailyRoom: vi.fn().mockResolvedValue(true),
}));

describe("Suite 8: Rute API Serverless & Proteksi Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("8.1 & 8.2: Endpoint /api/health", () => {
    it("8.1: harus mengembalikan status 200 OK dengan metrik memori, latensi database, dan status cache saat DB sehat", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ 1: 1 }]);

      const res = await healthHandler();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("ok");
      expect(data.database.status).toBe("connected");
      expect(typeof data.database.latencyMs).toBe("number");
      expect(data.memory).toHaveProperty("rssMB");
      expect(data.memory).toHaveProperty("heapUsedMB");
      expect(data.cache).toHaveProperty("activeEntries");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("8.2: harus mengembalikan status 503 dan status 'degraded' saat database mengalami gangguan/koneksi terputus", async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("Connection refused"));

      const res = await healthHandler();
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.status).toBe("degraded");
      expect(data.database.status).toBe("disconnected");
      expect(data.database.latencyMs).toBe(-1);
    });
  });

  describe("8.3: Endpoint /api/socket-token", () => {
    it("harus mengembalikan 401 Unauthorized jika tidak ada sesi pengguna", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const res = await socketTokenHandler();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("harus menerbitkan token JWT HS256 valid dengan TTL 15 menit dan scope 'socket'", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Ahmad Siswa",
        role: "siswa",
        jenjang: "SD",
      } as any);

      vi.mocked(prisma.chatRoom.findMany).mockResolvedValueOnce([
        { id: BigInt(5), user_one_id: BigInt(101), user_two_id: BigInt(202) },
      ] as any);

      const res = await socketTokenHandler();
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty("token");
      expect(data.expiresIn).toBe(900);

      const SECRET_KEY = new TextEncoder().encode(
        process.env.AUTH_SECRET || "alazharsdsecretkey2026modernrebuild_at_least_32_chars_long!!"
      );
      const verified = await jwtVerify(data.token, SECRET_KEY);
      expect(verified.payload.sub).toBe("101");
      expect(verified.payload.scope).toBe("socket");
      expect(verified.payload.role).toBe("siswa");
      expect(verified.payload.rooms).toEqual([{ r: "5", o: "202" }]);
    });
  });

  describe("Endpoint /api/kelas-online/end-room", () => {
    it("harus menolak request dengan 401 jika user bukan role guru", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa Biasa",
        role: "siswa",
        jenjang: "SD",
      } as any);

      const req = new Request("http://localhost/api/kelas-online/end-room", {
        method: "POST",
        body: JSON.stringify({ roomId: "99" }),
      });

      const res = await endRoomHandler(req);
      expect(res.status).toBe(401);
    });

    it("harus menolak 403 Forbidden jika guru yang request bukan pemilik room tersebut", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Guru B",
        role: "guru",
        jenjang: "SD",
      } as any);

      vi.mocked(prisma.kelasOnline.findUnique).mockResolvedValueOnce({
        id: BigInt(99),
        guru_id: BigInt(303),
        status: "active",
      } as any);

      const req = new Request("http://localhost/api/kelas-online/end-room", {
        method: "POST",
        body: JSON.stringify({ roomId: "99" }),
      });

      const res = await endRoomHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Hanya guru yang membuat kelas ini");
    });

    it("harus sukses mengakhiri room dan menutup kehadiran murid yang masih aktif", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "202",
        name: "Guru Pengampu",
        role: "guru",
        jenjang: "SD",
      } as any);

      vi.mocked(prisma.kelasOnline.findUnique).mockResolvedValueOnce({
        id: BigInt(99),
        guru_id: BigInt(202),
        status: "active",
        room_name: "room-abc-123",
      } as any);

      vi.mocked(prisma.kelasOnlineAttendance.findMany).mockResolvedValueOnce([
        {
          id: BigInt(1),
          kelas_online_id: BigInt(99),
          user_id: BigInt(101),
          joined_at: new Date(Date.now() - 30 * 60000),
          left_at: null,
        },
      ] as any);

      const req = new Request("http://localhost/api/kelas-online/end-room", {
        method: "POST",
        body: JSON.stringify({ roomId: "99" }),
      });

      const res = await endRoomHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.kelasOnline.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(99) },
          data: expect.objectContaining({ status: "ended" }),
        })
      );
    });
  });

  describe("8.4: Proteksi Upload Berkas & Validasi Ekstensi Berbahaya", () => {
    it("harus menolak berkas executable (.exe) atau format dilarang", async () => {
      const maliciousFile = new File([Buffer.from("dummy-payload-binary")], "payload.exe", {
        type: "application/x-msdownload",
      });

      const result = await saveUploadedFile(maliciousFile, { category: "attachment" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Format file tidak diizinkan");
    });

    it("harus menolak berkas script dilarang (.php / .sh)", async () => {
      const scriptFile = new File([Buffer.from("disallowed-script-content")], "disallowed.php", {
        type: "application/x-php",
      });

      const result = await saveUploadedFile(scriptFile, { category: "task_worksheet" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Format file tidak diizinkan");
    });

    it("harus menolak berkas yang melebihi batas ukuran maksimum (>10MB untuk avatar)", async () => {
      const oversizedBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: "image/jpeg" });
      const oversizedFile = new File([oversizedBlob], "huge-photo.jpg", { type: "image/jpeg" });

      const result = await saveUploadedFile(oversizedFile, { category: "avatar" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("melebihi batas maksimum");
    });
  });
});
