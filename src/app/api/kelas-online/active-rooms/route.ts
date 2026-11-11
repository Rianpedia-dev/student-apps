import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { KelasOnlineService } from "@/services/kelas-online.service";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await KelasOnlineService.cleanupExpiredRooms();

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    const whereClause: Record<string, unknown> = {
      status: "active",
    };

    if (session.role === "siswa") {
      const studentData = await KelasOnlineService.getStudentKelasOnlineData(
        session.id,
        session.kelas
      );
      return NextResponse.json(studentData.activeRooms);
    }

    if (session.role === "guru") {
      if (scope === "wali" && /^\d+$/.test(session.id)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: BigInt(session.id) },
          select: { status: true, kelas: true },
        });
        if (dbUser?.status === "4" && dbUser.kelas) {
          const waliKelas = await prisma.kelas.findFirst({
            where: { nama_kelas: dbUser.kelas },
            select: { id: true, nama_kelas: true },
          });
          whereClause.OR = waliKelas
            ? [{ kelas_id: waliKelas.id }, { kelas_id: null, kelas: waliKelas.nama_kelas }]
            : [{ kelas: dbUser.kelas }];
        } else {
          whereClause.guru_id = BigInt(session.id);
        }
      } else {
        whereClause.guru_id = BigInt(session.id);
      }
    } else if (session.role === "admin") {
      const activeJenjang = await getActiveJenjang(session);
      if (activeJenjang !== "ALL") {
        const allowed = await prisma.kelas.findMany({
          where: { jenjang: activeJenjang },
          select: { id: true, nama_kelas: true },
        });
        whereClause.OR = [
          { kelas_id: { in: allowed.map((k) => k.id) } },
          { kelas_id: null, kelas: { in: allowed.map((k) => k.nama_kelas) } },
        ];
      }
    }

    const rooms = await prisma.kelasOnline.findMany({
      where: whereClause,
      include: {
        pertemuan: { select: { pertemuan_ke: true, judul: true } },
        attendance: {
          where: { left_at: null },
          select: { id: true },
        },
      },
      orderBy: { started_at: "desc" },
    });

    const serialized = rooms.map((room) => ({
      id: room.id.toString(),
      room_name: room.room_name,
      room_url: room.room_url,
      guru_id: room.guru_id.toString(),
      guru_name: room.guru_name,
      kelas: room.kelas,
      kelas_id: room.kelas_id ? room.kelas_id.toString() : null,
      mata_pelajaran: room.mata_pelajaran,
      mapel_id: room.mapel_id ? room.mapel_id.toString() : null,
      pertemuan_id: room.pertemuan_id ? room.pertemuan_id.toString() : null,
      pertemuan_ke: room.pertemuan?.pertemuan_ke ?? null,
      pertemuan_judul: room.pertemuan?.judul ?? null,
      session_type: room.session_type,
      topik: room.topik,
      status: room.status,
      started_at: room.started_at?.toISOString() || null,
      max_participants: room.max_participants,
      active_participants: room.attendance.length,
    }));

    return NextResponse.json(serialized);
  } catch (error: unknown) {
    console.error("Error fetching active rooms:", error);
    return NextResponse.json([], { status: 200 });
  }
}
