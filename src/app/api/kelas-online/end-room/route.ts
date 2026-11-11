import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { deleteDailyRoom } from "@/lib/daily";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "guru") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (room.guru_id.toString() !== session.id) {
      return NextResponse.json(
        { error: "Hanya guru yang membuat kelas ini yang dapat mengakhirinya." },
        { status: 403 }
      );
    }

    if (room.status === "ended") {
      return NextResponse.json({ error: "Kelas sudah berakhir sebelumnya." }, { status: 400 });
    }

    const now = new Date();

    await prisma.kelasOnline.update({
      where: { id: BigInt(roomId) },
      data: {
        status: "ended",
        ended_at: now,
      },
    });

    const openAttendances = await prisma.kelasOnlineAttendance.findMany({
      where: {
        kelas_online_id: BigInt(roomId),
        left_at: null,
      },
    });

    for (const att of openAttendances) {
      const joinedAt = att.joined_at || now;
      const durationMs = Math.max(0, now.getTime() - joinedAt.getTime());
      const durationMinutes = Math.round(durationMs / 60000);

      await prisma.kelasOnlineAttendance.update({
        where: { id: att.id },
        data: {
          left_at: now,
          duration_minutes: durationMinutes,
        },
      });
    }

    try {
      await deleteDailyRoom(room.room_name);
    } catch (e) {
      console.warn("Failed to delete Daily room (non-critical):", e);
    }

    return NextResponse.json({
      success: true,
      roomId: room.id.toString(),
    });
  } catch (error: unknown) {
    console.error("Error ending room:", error);
    const message = error instanceof Error ? error.message : "Gagal mengakhiri kelas online.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
