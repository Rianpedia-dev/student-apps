import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Secret HARUS identik dengan yang dipakai di src/lib/auth.ts (createSessionToken)
// dan yang diverifikasi oleh server/socket-server.cjs.
const authSecret = process.env.AUTH_SECRET;
const SECRET_KEY = new TextEncoder().encode(
  authSecret || "alazharsdsecretkey2026modernrebuild_at_least_32_chars_long!!"
);

/**
 * Menerbitkan "capability token" berumur pendek untuk handshake Socket.IO.
 *
 * Token ini membuktikan identitas pengguna (sub = userId) kepada socket server
 * dan berisi DAFTAR ruang obrolan (rooms) yang boleh diikuti pengguna tersebut.
 * Socket server memverifikasi tanda tangan HS256 token ini — tanpa perlu akses
 * ke database — sehingga join_room & pengiriman pesan dapat diotorisasi dengan aman.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myId = BigInt(session.id);

  try {
    // Ambil seluruh ruang di mana pengguna ini adalah pesertanya, beserta lawan bicaranya.
    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [{ user_one_id: myId }, { user_two_id: myId }],
      },
      select: { id: true, user_one_id: true, user_two_id: true },
    });

    const allowedRooms = rooms.map((r) => {
      const otherId = r.user_one_id === myId ? r.user_two_id : r.user_one_id;
      return { r: r.id.toString(), o: otherId.toString() };
    });

    const token = await new SignJWT({
      scope: "socket",
      name: session.name,
      role: session.role,
      rooms: allowedRooms,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(session.id)
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(SECRET_KEY);

    return NextResponse.json({ token, expiresIn: 900 });
  } catch (err) {
    console.error("Gagal menerbitkan socket token:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
