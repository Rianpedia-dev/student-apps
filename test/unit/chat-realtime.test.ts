import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOrCreateChatRoom,
  getRoomMessages,
  deleteMessageAction,
} from "@/actions/chat";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SignJWT, jwtVerify } from "jose";

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    chatRoom: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    chatMessage: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $executeRaw: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "alazharsdsecretkey2026modernrebuild_at_least_32_chars_long!!"
);

describe("Suite 5: Obrolan Real-Time & Keamanan Token Socket.IO", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("5.1: Penerbitan & Verifikasi Socket Capability Token", () => {
    it("harus membuat token valid HS256 dengan subject = user ID dan scope = 'socket'", async () => {
      const payload = {
        scope: "socket",
        name: "Ustadz Budi",
        role: "guru",
        rooms: [{ r: "10", o: "101" }],
      };

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("202")
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(SECRET_KEY);

      expect(typeof token).toBe("string");

      const verified = await jwtVerify(token, SECRET_KEY);
      expect(verified.payload.sub).toBe("202");
      expect(verified.payload.scope).toBe("socket");
      expect(verified.payload.role).toBe("guru");
      expect(verified.payload.rooms).toEqual([{ r: "10", o: "101" }]);
    });
  });

  describe("5.2: Boundary Proteksi Hubungan Obrolan (Siswa ↔ Guru Only)", () => {
    it("harus menolak pembuatan ruang obrolan antar sesama siswa (Siswa -> Siswa)", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa A",
        role: "siswa",
      } as any);

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ id: BigInt(101), status: "1" } as any) // Pengguna saat ini: Siswa
        .mockResolvedValueOnce({ id: BigInt(102), name: "Siswa B", status: "1" } as any); // Pengguna target: Siswa

      const result = await getOrCreateChatRoom("102");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Siswa hanya dapat berkomunikasi dengan Guru");
      expect(prisma.chatRoom.create).not.toHaveBeenCalled();
    });

    it("harus mengizinkan pembuatan ruang obrolan antara Siswa dan Guru", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa A",
        role: "siswa",
      } as any);

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ id: BigInt(101), status: "1" } as any) // Siswa
        .mockResolvedValueOnce({ id: BigInt(202), name: "Guru Matematika", status: "2" } as any); // Guru

      vi.mocked(prisma.chatRoom.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.chatRoom.create).mockResolvedValueOnce({
        id: BigInt(55),
        type: "DIRECT",
        user_one_id: BigInt(101),
        user_two_id: BigInt(202),
      } as any);

      const result = await getOrCreateChatRoom("202");

      expect(result.success).toBe(true);
      expect(result.room?.id).toBe("55");
    });

    it("harus menolak pembukaan obrolan dengan diri sendiri", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa A",
        role: "siswa",
      } as any);

      const result = await getOrCreateChatRoom("101");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Tidak dapat membuka ruang obrolan dengan diri sendiri");
    });
  });

  describe("5.3 & 5.4: Soft-Delete Pesan & Anti-Spoofing", () => {
    it("5.4: harus mengubah status pesan menjadi is_deleted = true saat dihapus pengirim", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa A",
        role: "siswa",
      } as any);

      vi.mocked(prisma.chatMessage.findUnique).mockResolvedValueOnce({
        id: BigInt(777),
        room_id: BigInt(55),
        sender_id: BigInt(101),
        is_deleted: false,
      } as any);

      vi.mocked(prisma.chatMessage.findFirst).mockResolvedValueOnce({
        id: BigInt(777),
      } as any);

      vi.mocked(prisma.chatMessage.update).mockResolvedValueOnce({} as any);
      vi.mocked(prisma.chatRoom.update).mockResolvedValueOnce({} as any);

      const res = await deleteMessageAction("777");

      expect(res.success).toBe(true);
      expect(prisma.chatMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(777) },
          data: expect.objectContaining({
            is_deleted: true,
            attachment_url: null,
          }),
        })
      );
    });

    it("harus menolak penghapusan pesan yang dikirim oleh pengguna lain", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101", // Siswa A
        name: "Siswa A",
        role: "siswa",
      } as any);

      vi.mocked(prisma.chatMessage.findUnique).mockResolvedValueOnce({
        id: BigInt(888),
        sender_id: BigInt(202), // Pengirim Guru Budi
      } as any);

      const res = await deleteMessageAction("888");

      expect(res.success).toBe(false);
      expect(res.error).toContain("hanya dapat menghapus pesan yang Anda kirimkan sendiri");
    });

    it("harus menyamarkan teks pesan yang telah dihapus menjadi 'Pesan ini telah dihapus' saat dibaca", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa A",
        role: "siswa",
      } as any);

      vi.mocked(prisma.chatMessage.findMany).mockResolvedValueOnce([
        {
          id: BigInt(1),
          sender_id: BigInt(202),
          message: "Teks rahasia asli yang sudah dihapus",
          is_deleted: true,
          attachment_url: "secret.pdf",
          attachment_type: "pdf",
          sender: { id: BigInt(202), name: "Guru Budi", image: null, gender: "L" },
        },
      ] as any);

      const messages = await getRoomMessages("55");

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe("Pesan ini telah dihapus");
      expect(messages[0].attachmentUrl).toBeNull();
      expect(messages[0].isDeleted).toBe(true);
    });
  });

  describe("5.5: Paginasi Riwayat Pesan (Take/Limit Guard)", () => {
    it("harus membatasi jumlah pesan yang diambil (default 100, max 200) untuk mencegah memory bloat", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa A",
        role: "siswa",
      } as any);

      vi.mocked(prisma.chatMessage.findMany).mockResolvedValueOnce([]);

      // Panggil dengan permintaan limit 500 (di atas batas aman)
      await getRoomMessages("55", 500);

      // Verifikasi argumen take dibatasi maksimal 200
      expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 200,
        })
      );
    });
  });
});
