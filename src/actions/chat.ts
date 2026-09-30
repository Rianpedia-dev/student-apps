"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserProfileImage } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Membuka atau membuat ruang obrolan langsung (1-on-1).
 * Aturan: Hanya Siswa ↔ Guru yang diizinkan.
 */
export async function getOrCreateChatRoom(otherUserIdStr: string | bigint) {
  const session = await getSession();
  if (!session) return { success: false, error: "Akses ditolak.", room: null };

  const otherUserId = BigInt(otherUserIdStr);
  const myId = BigInt(session.id);

  if (myId === otherUserId) {
    return {
      success: false,
      error: "Tidak dapat membuka ruang obrolan dengan diri sendiri.",
      room: null,
    };
  }

  try {
    // Validasi akun pengguna saat ini
    const currentUser = await prisma.user.findUnique({
      where: { id: myId },
      select: { id: true, status: true },
    });

    if (!currentUser) {
      return {
        success: false,
        error: "Sesi akun Anda tidak ditemukan di database. Silakan login ulang.",
        room: null,
      };
    }

    // Validasi peran peserta tujuan
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, status: true },
    });

    if (!otherUser) {
      return {
        success: false,
        error: "Pengguna tujuan tidak ditemukan.",
        room: null,
      };
    }

    const isOtherGuru = ["2", "4"].includes(otherUser.status);
    const isOtherSiswa = otherUser.status === "1";

    // Siswa hanya boleh chat ke Guru
    if (session.role === "siswa" && !isOtherGuru) {
      return {
        success: false,
        error: "Siswa hanya dapat berkomunikasi dengan Guru atau Ustadz/Ustadzah.",
        room: null,
      };
    }

    // Guru hanya boleh chat ke Siswa
    if (session.role === "guru" && !isOtherSiswa) {
      return {
        success: false,
        error: "Guru hanya dapat berkomunikasi dengan Siswa.",
        room: null,
      };
    }

    const [u1, u2] = myId < otherUserId ? [myId, otherUserId] : [otherUserId, myId];

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

/**
 * Mengambil daftar ruang percakapan aktif pengguna.
 * Aturan: Siswa hanya melihat obrolan dengan Guru; Guru hanya melihat obrolan dengan Siswa.
 */
export async function getUserChatRooms() {
  const session = await getSession();
  if (!session) return [];

  const myId = BigInt(session.id);

  try {
    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [{ user_one_id: myId }, { user_two_id: myId }],
      },
      include: {
        userOne: {
          select: {
            id: true,
            name: true,
            image: true,
            gender: true,
            email: true,
            status: true,
            kelas: true,
            guru_bidang: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            image: true,
            gender: true,
            email: true,
            status: true,
            kelas: true,
            guru_bidang: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { last_message_at: "desc" },
    });

    // Filter obrolan sesuai batas kewenangan: Siswa hanya dengan Guru, Guru hanya dengan Siswa
    const validRooms = rooms.filter((r) => {
      const otherUser = r.user_one_id === myId ? r.userTwo : r.userOne;
      const isOtherGuru = ["2", "4"].includes(otherUser.status);
      const isOtherSiswa = otherUser.status === "1";

      if (session.role === "siswa") {
        return isOtherGuru;
      }
      if (session.role === "guru") {
        return isOtherSiswa;
      }
      return true; // Admin dapat melihat semua
    });

    // Hitung unread messages per room
    const mapped = await Promise.all(
      validRooms.map(async (r) => {
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
            image: getUserProfileImage(otherUser.image, otherUser.gender, otherUser.name),
            gender: otherUser.gender,
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

/**
 * Mengambil pesan di dalam satu ruang obrolan.
 */
export async function getRoomMessages(roomIdStr: string | bigint) {
  const session = await getSession();
  if (!session) return [];

  const roomId = BigInt(roomIdStr);
  const myId = BigInt(session.id);

  try {
    // Tandai pesan dari lawan bicara sebagai terbaca
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
          select: { id: true, name: true, image: true, gender: true },
        },
      },
      orderBy: { created_at: "asc" },
    });

    return messages.map((m) => ({
      id: m.id.toString(),
      senderId: m.sender_id.toString(),
      senderName: m.sender.name,
      senderImage: getUserProfileImage(m.sender.image, m.sender.gender, m.sender.name),
      isMe: m.sender_id === myId,
      message: m.is_deleted ? "Pesan ini telah dihapus" : m.message,
      attachmentUrl: m.is_deleted ? null : m.attachment_url,
      attachmentType: m.is_deleted ? null : m.attachment_type,
      isRead: m.is_read,
      isEdited: m.is_edited,
      isDeleted: m.is_deleted,
      editedAt: m.edited_at ? m.edited_at.toISOString() : null,
      createdAt: m.created_at ? m.created_at.toISOString() : "",
    }));
  } catch (err: any) {
    console.error("Gagal mengambil pesan chat:", err);
    return [];
  }
}

/**
 * Mengirim pesan dan lampiran baru.
 * Aturan: Memvalidasi peserta room agar tidak terjadi pengiriman Siswa ↔ Siswa atau Guru ↔ Guru.
 */
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

  const roomId = BigInt(roomIdStr);
  const myId = BigInt(session.id);

  try {
    // Validasi izin room & peserta
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        userOne: { select: { id: true, status: true } },
        userTwo: { select: { id: true, status: true } },
      },
    });

    if (!room) {
      return { success: false, error: "Ruang obrolan tidak ditemukan." };
    }

    if (room.user_one_id !== myId && room.user_two_id !== myId) {
      return { success: false, error: "Anda bukan peserta dalam ruang obrolan ini." };
    }

    const otherUser = room.user_one_id === myId ? room.userTwo : room.userOne;
    const isOtherGuru = ["2", "4"].includes(otherUser.status);
    const isOtherSiswa = otherUser.status === "1";

    if (session.role === "siswa" && !isOtherGuru) {
      return { success: false, error: "Siswa hanya dapat mengirim pesan kepada Guru atau Ustadz/Ustadzah." };
    }

    if (session.role === "guru" && !isOtherSiswa) {
      return { success: false, error: "Guru hanya dapat mengirim pesan kepada Siswa." };
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

    const chat = await prisma.chatMessage.create({
      data: {
        room_id: roomId,
        sender_id: myId,
        message: message || "",
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        is_read: false,
      },
    });

    await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        last_message: message || (attachmentType === "image" ? "📷 Foto" : "📎 Dokumen"),
        last_message_at: new Date(),
      },
    });

    revalidatePath("/siswa/chat");
    revalidatePath("/guru/chat");
    return {
      success: true,
      messageId: chat.id.toString(),
      attachmentUrl,
      attachmentType,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengirim pesan." };
  }
}

/**
 * Mengambil daftar kontak yang diizinkan untuk diajak obrolan:
 * - Siswa HANYA melihat Guru (Wali Kelas & Guru Mapel).
 * - Guru HANYA melihat Siswa (di kelas binaan dan kelas ajar).
 */
export async function getContactsForCurrentUser() {
  const session = await getSession();
  if (!session) return [];

  const myId = BigInt(session.id);

  try {
    if (session.role === "siswa") {
      // Siswa HANYA mengambil kontak Guru: Wali Kelas dan Guru Mata Pelajaran
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
          gender: true,
          email: true,
          guru_bidang: true,
          kelas: true,
        },
        orderBy: [{ kelas: "desc" }, { name: "asc" }],
      });

      return teachers.map((t) => ({
        id: t.id.toString(),
        name: t.name,
        image: getUserProfileImage(t.image, t.gender, t.name),
        gender: t.gender,
        email: t.email,
        subtitle: t.guru_bidang || `Wali ${t.kelas}`,
        badge: t.kelas === studentClass ? "Wali Kelas" : "Guru Mapel",
        category: "guru" as const,
      }));
    } else if (session.role === "guru") {
      // Guru HANYA mengambil kontak siswa di kelasnya atau kelas yang dia ajar
      const guruClass = session.kelas || "";
      const jadwal = await prisma.jadwalPelajaran.findMany({
        where: { guru_id: myId },
        select: { kelas: { select: { nama_kelas: true } } },
      });
      const taughtClasses = Array.from(
        new Set([guruClass, ...jadwal.map((j) => j.kelas.nama_kelas)])
      ).filter(Boolean);

      const students = await prisma.user.findMany({
        where: {
          status: "1",
          kelas: { in: taughtClasses },
        },
        select: {
          id: true,
          name: true,
          image: true,
          gender: true,
          email: true,
          kelas: true,
          nis: true,
        },
        orderBy: [{ kelas: "asc" }, { name: "asc" }],
        take: 100,
      });

      return students.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        image: getUserProfileImage(s.image, s.gender, s.name),
        gender: s.gender,
        email: s.email,
        subtitle: `${s.kelas} • NIS: ${s.nis || "-"}`,
        badge: s.kelas === guruClass ? "Wali Kelas" : (s.kelas || "Siswa"),
        category: "siswa" as const,
      }));
    }

    return [];
  } catch (err: any) {
    console.error("Gagal mengambil kontak:", err);
    return [];
  }
}

/**
 * Mengedit pesan yang sudah terkirim.
 * Aturan: Hanya pengirim pesan yang boleh mengedit dan hanya dalam batas 12 jam setelah terkirim.
 */
export async function editMessageAction(messageIdStr: string, newMessage: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Akses ditolak." };

  const trimmed = (newMessage || "").trim();
  if (!trimmed) {
    return { success: false, error: "Pesan tidak boleh kosong." };
  }

  const messageId = BigInt(messageIdStr);
  const myId = BigInt(session.id);

  try {
    const msg = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { room: true },
    });

    if (!msg) {
      return { success: false, error: "Pesan tidak ditemukan." };
    }

    if (msg.sender_id !== myId) {
      return {
        success: false,
        error: "Anda hanya dapat mengedit pesan yang Anda kirimkan sendiri.",
      };
    }

    if (msg.is_deleted) {
      return {
        success: false,
        error: "Pesan yang telah dihapus tidak dapat diedit.",
      };
    }

    // Validasi batas waktu 12 jam (12 * 60 * 60 * 1000 ms)
    if (msg.created_at) {
      const diffHours =
        (Date.now() - new Date(msg.created_at).getTime()) / (1000 * 60 * 60);
      if (diffHours > 12) {
        return {
          success: false,
          error: "Batas waktu pengeditan pesan (12 jam) telah berakhir.",
        };
      }
    }

    const now = new Date();
    try {
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          message: trimmed,
          is_edited: true,
          edited_at: now,
        },
      });
    } catch (updateErr: any) {
      console.warn("Prisma update failed, attempting raw query fallback:", updateErr?.message);
      await prisma.$executeRaw`
        UPDATE tbl_chat_messages 
        SET message = ${trimmed}, is_edited = 1, edited_at = ${now} 
        WHERE id = ${messageId}
      `;
    }

    // Jika pesan ini adalah pesan terakhir di room, update preview last_message
    const latestMessage = await prisma.chatMessage.findFirst({
      where: { room_id: msg.room_id },
      orderBy: { created_at: "desc" },
    });

    if (latestMessage && latestMessage.id === msg.id) {
      await prisma.chatRoom.update({
        where: { id: msg.room_id },
        data: {
          last_message: trimmed,
        },
      });
    }

    return {
      success: true,
      messageId: messageIdStr,
      newMessage: trimmed,
      editedAt: now.toISOString(),
      roomId: msg.room_id.toString(),
    };
  } catch (err: any) {
    console.error("Gagal mengedit pesan:", err);
    return { success: false, error: "Terjadi kesalahan saat mengedit pesan." };
  }
}

/**
 * Menghapus pesan (Delete for Everyone).
 * Pesan ditandai sebagai is_deleted dan teksnya menjadi "Pesan ini telah dihapus".
 */
export async function deleteMessageAction(messageIdStr: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Akses ditolak." };

  const messageId = BigInt(messageIdStr);
  const myId = BigInt(session.id);

  try {
    const msg = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { room: true },
    });

    if (!msg) {
      return { success: false, error: "Pesan tidak ditemukan." };
    }

    if (msg.sender_id !== myId) {
      return {
        success: false,
        error: "Anda hanya dapat menghapus pesan yang Anda kirimkan sendiri.",
      };
    }

    const now = new Date();
    try {
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          is_deleted: true,
          deleted_at: now,
          attachment_url: null,
          attachment_type: null,
        },
      });
    } catch (deleteErr: any) {
      console.warn("Prisma update failed, attempting raw query fallback:", deleteErr?.message);
      await prisma.$executeRaw`
        UPDATE tbl_chat_messages 
        SET is_deleted = 1, deleted_at = ${now}, attachment_url = NULL, attachment_type = NULL 
        WHERE id = ${messageId}
      `;
    }

    // Update last_message di chat room jika ini pesan terakhir
    const latestMessage = await prisma.chatMessage.findFirst({
      where: { room_id: msg.room_id },
      orderBy: { created_at: "desc" },
    });

    if (latestMessage && latestMessage.id === msg.id) {
      await prisma.chatRoom.update({
        where: { id: msg.room_id },
        data: {
          last_message: "🚫 Pesan ini telah dihapus",
        },
      });
    }

    return {
      success: true,
      messageId: messageIdStr,
      roomId: msg.room_id.toString(),
    };
  } catch (err: any) {
    console.error("Gagal menghapus pesan:", err);
    return { success: false, error: "Terjadi kesalahan saat menghapus pesan." };
  }
}
