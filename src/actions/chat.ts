"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function getOrCreateChatRoom(otherUserIdStr: string | bigint) {
  const session = await getSession();
  if (!session) return { success: false, error: "Akses ditolak.", room: null };

  const otherUserId = BigInt(otherUserIdStr);
  const myId = BigInt(session.id);

  if (myId === otherUserId) {
    return { success: false, error: "Tidak dapat membuka ruang obrolan dengan diri sendiri.", room: null };
  }

  const [u1, u2] = myId < otherUserId ? [myId, otherUserId] : [otherUserId, myId];

  try {
    let room = await prisma.chatRoom.findUnique({
      where: {
        user_one_id_user_two_id: {
          user_one_id: u1,
          user_two_id: u2,
        },
      },
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          type: "DIRECT",
          user_one_id: u1,
          user_two_id: u2,
        },
      });
    }

    return { success: true, room: { id: room.id.toString() } };
  } catch (err: any) {
    return { success: false, error: err.message, room: null };
  }
}

export async function getUserChatRooms() {
  const session = await getSession();
  if (!session) return [];

  const myId = BigInt(session.id);

  try {
    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { user_one_id: myId },
          { user_two_id: myId },
        ],
      },
      include: {
        userOne: {
          select: { id: true, name: true, image: true, email: true, status: true, kelas: true, guru_bidang: true },
        },
        userTwo: {
          select: { id: true, name: true, image: true, email: true, status: true, kelas: true, guru_bidang: true },
        },
        messages: {
          take: 1,
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { last_message_at: "desc" },
    });

    // Hitung unread messages per room
    const mapped = await Promise.all(
      rooms.map(async (r) => {
        const otherUser = r.user_one_id === myId ? r.userTwo : r.userOne;
        const unreadCount = await prisma.chatMessage.count({
          where: {
            room_id: r.id,
            sender_id: { not: myId },
            is_read: false,
          },
        });

        return {
          id: r.id.toString(),
          otherUser: {
            id: otherUser.id.toString(),
            name: otherUser.name,
            image: otherUser.image,
            email: otherUser.email,
            role: otherUser.status === "1" ? "Siswa" : "Guru",
            kelas: otherUser.kelas,
            guru_bidang: otherUser.guru_bidang,
          },
          lastMessage: r.last_message || "",
          lastMessageAt: r.last_message_at ? r.last_message_at.toISOString() : null,
          unreadCount,
        };
      })
    );

    return mapped;
  } catch (err: any) {
    console.error("Gagal mengambil daftar percakapan:", err);
    return [];
  }
}

export async function getRoomMessages(roomIdStr: string | bigint) {
  const session = await getSession();
  if (!session) return [];

  const roomId = BigInt(roomIdStr);
  const myId = BigInt(session.id);

  try {
    // Tandai pesan sebagai terbaca
    await prisma.chatMessage.updateMany({
      where: {
        room_id: roomId,
        sender_id: { not: myId },
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    const messages = await prisma.chatMessage.findMany({
      where: { room_id: roomId },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { created_at: "asc" },
    });

    return messages.map((m) => ({
      id: m.id.toString(),
      senderId: m.sender_id.toString(),
      senderName: m.sender.name,
      senderImage: m.sender.image,
      isMe: m.sender_id === myId,
      message: m.message,
      attachmentUrl: m.attachment_url,
      attachmentType: m.attachment_type,
      isRead: m.is_read,
      createdAt: m.created_at ? m.created_at.toISOString() : "",
    }));
  } catch (err: any) {
    console.error("Gagal mengambil pesan chat:", err);
    return [];
  }
}

export async function sendMessageAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Akses ditolak." };

  const roomIdStr = formData.get("room_id") as string;
  const message = ((formData.get("message") as string) || "").trim();
  const file = formData.get("attachment") as File | null;

  if (!roomIdStr) return { success: false, error: "Room ID tidak valid." };
  if (!message && (!file || file.size === 0)) {
    return { success: false, error: "Pesan atau lampiran file tidak boleh kosong." };
  }

  let attachmentUrl: string | null = null;
  let attachmentType: string | null = null;

  if (file && file.size > 0) {
    try {
      const ext = path.extname(file.name).toLowerCase();
      const safeName = `chat-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "chat");
      await mkdir(uploadDir, { recursive: true });
      const bytes = await file.arrayBuffer();
      await writeFile(path.join(uploadDir, safeName), Buffer.from(bytes));
      attachmentUrl = `/uploads/chat/${safeName}`;
      attachmentType = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? "image" : "file";
    } catch (e) {
      console.error("Gagal mengunggah lampiran chat:", e);
    }
  }

  const roomId = BigInt(roomIdStr);
  const myId = BigInt(session.id);

  try {
    const chat = await prisma.chatMessage.create({
      data: {
        room_id: roomId,
        sender_id: myId,
        message: message || "Mengirim lampiran",
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        is_read: false,
      },
    });

    await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        last_message: message || "📎 Lampiran file",
        last_message_at: new Date(),
      },
    });

    revalidatePath("/siswa/chat");
    revalidatePath("/guru/chat");
    return { success: true, messageId: chat.id.toString() };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengirim pesan." };
  }
}

export async function getContactsForCurrentUser() {
  const session = await getSession();
  if (!session) return [];

  const myId = BigInt(session.id);

  try {
    if (session.role === "siswa") {
      // Siswa mengambil kontak guru: Wali Kelas dan Guru Mata Pelajaran
      const studentClass = session.kelas || "";
      const kelas = await prisma.kelas.findFirst({ where: { nama_kelas: studentClass } });

      let guruIds: bigint[] = [];
      if (kelas) {
        const jadwal = await prisma.jadwalPelajaran.findMany({
          where: { kelas_id: kelas.id },
          select: { guru_id: true },
        });
        guruIds = jadwal.map((j) => j.guru_id);
      }

      const teachers = await prisma.user.findMany({
        where: {
          status: { in: ["2", "4"] },
          OR: [
            ...(studentClass ? [{ kelas: studentClass }] : []),
            ...(guruIds.length > 0 ? [{ id: { in: guruIds } }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          guru_bidang: true,
          kelas: true,
        },
      });

      return teachers.map((t) => ({
        id: t.id.toString(),
        name: t.name,
        image: t.image,
        email: t.email,
        subtitle: t.guru_bidang || `Wali ${t.kelas}`,
        badge: t.kelas === studentClass ? "Wali Kelas" : "Guru Mapel",
      }));
    } else if (session.role === "guru") {
      // Guru mengambil kontak siswa di kelasnya atau kelas yang dia ajar
      const guruClass = session.kelas || "";
      const jadwal = await prisma.jadwalPelajaran.findMany({
        where: { guru_id: myId },
        select: { kelas: { select: { nama_kelas: true } } },
      });
      const taughtClasses = Array.from(new Set([guruClass, ...jadwal.map((j) => j.kelas.nama_kelas)])).filter(Boolean);

      const students = await prisma.user.findMany({
        where: {
          status: "1",
          kelas: { in: taughtClasses },
        },
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          kelas: true,
          nis: true,
        },
        orderBy: [{ kelas: "asc" }, { name: "asc" }],
        take: 50,
      });

      return students.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        image: s.image,
        email: s.email,
        subtitle: `${s.kelas} • NIS: ${s.nis || "-"}`,
        badge: s.kelas,
      }));
    }

    return [];
  } catch (err: any) {
    console.error("Gagal mengambil kontak:", err);
    return [];
  }
}
