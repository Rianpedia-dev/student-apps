import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createMeetingToken } from "@/lib/daily";
import { KelasOnlineService } from "@/services/kelas-online.service";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await KelasOnlineService.cleanupExpiredRooms();

    const body = (await request.json().catch(() => ({}))) as { roomId?: string };
    const roomId = body.roomId;

    if (!roomId || !/^\d+$/.test(roomId)) {
      return NextResponse.json({ error: "roomId tidak valid." }, { status: 400 });
    }

    const room = await prisma.kelasOnline.findUnique({
      where: { id: BigInt(roomId) },
    });

    if (!room) {
      return NextResponse.json({ error: "Kelas online tidak ditemukan." }, { status: 404 });
    }

    if (room.status !== "active") {
      return NextResponse.json({ error: "Kelas online sudah berakhir." }, { status: 400 });
    }

    // Validasi akses per peran
    if (session.role === "siswa") {
      let studentClassName = session.kelas || "";
      if (/^\d+$/.test(session.id)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: BigInt(session.id) },
          select: { kelas: true },
        });
        if (dbUser?.kelas) studentClassName = dbUser.kelas;
      }

      const studentKelas = studentClassName
        ? await prisma.kelas.findFirst({
            where: { nama_kelas: studentClassName },
            select: { id: true },
          })
        : null;

      const isAllowed =
        room.kelas_id && studentKelas
          ? room.kelas_id === studentKelas.id
          : studentClassName === room.kelas;

      if (!isAllowed) {
        return NextResponse.json(
          { error: "Anda tidak dapat bergabung ke kelas ini." },
          { status: 403 }
        );
      }
    } else if (session.role === "guru" && room.guru_id.toString() !== session.id) {
      return NextResponse.json(
        { error: "Hanya guru pembuat sesi yang dapat masuk sebagai pengampu room ini." },
        { status: 403 }
      );
    }

    const isOwner = session.role === "guru" && room.guru_id.toString() === session.id;
    const expTimestamp = Math.floor(Date.now() / 1000) + 60 * 60 * 4;

    const tokenResponse = await createMeetingToken({
      room_name: room.room_name,
      user_name: session.name,
      is_owner: isOwner,
      exp: expTimestamp,
    });

    // Hindari duplikasi record kehadiran saat user refresh/re-join sebelum left_at tertutup
    let attendance = await prisma.kelasOnlineAttendance.findFirst({
      where: {
        kelas_online_id: room.id,
        user_id: BigInt(session.id),
        left_at: null,
      },
      orderBy: { joined_at: "desc" },
    });

    if (!attendance) {
      const now = new Date();
      attendance = await prisma.kelasOnlineAttendance.create({
        data: {
          kelas_online_id: room.id,
          user_id: BigInt(session.id),
          user_name: session.name,
          user_role: session.role,
          joined_at: now,
          created_at: now,
        },
      });
    }

    return NextResponse.json({
      roomUrl: room.room_url,
      roomName: room.room_name,
      token: tokenResponse.token,
      attendanceId: attendance.id.toString(),
    });
  } catch (error: unknown) {
    console.error("Error joining room:", error);
    const message = error instanceof Error ? error.message : "Gagal bergabung ke kelas online.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
