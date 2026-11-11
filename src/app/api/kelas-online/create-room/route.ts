import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { AppError } from "@/lib/errors";
import { createDailyRoom, createMeetingToken, generateRoomName } from "@/lib/daily";
import { createKelasOnlineRoomSchema } from "@/lib/validators/kelas-online.schema";
import { KelasOnlineService } from "@/services/kelas-online.service";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "guru") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.json().catch(() => ({}));
    const parsed = createKelasOnlineRoomSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstErr = parsed.error.issues[0]?.message || "Data pembuatan kelas tidak valid.";
      return NextResponse.json({ error: firstErr }, { status: 400 });
    }

    const activeJenjang = await getActiveJenjang(session);

    // Bersihkan room yang sudah kedaluwarsa sebelum cek duplikat
    await KelasOnlineService.cleanupExpiredRooms();

    const authorized = await KelasOnlineService.validateTeacherCreateAuthorization({
      userId: session.id,
      activeJenjang,
      sessionType: parsed.data.sessionType,
      kelasId: parsed.data.kelasId,
      mapelId: parsed.data.mapelId,
      jadwalId: parsed.data.jadwalId,
      pertemuanId: parsed.data.pertemuanId,
    });

    // Cek room aktif duplikat pada kelas + mapel (atau sesi wali kelas) yang sama
    const duplicate = await KelasOnlineService.findDuplicateActiveRoom({
      sessionType: authorized.sessionType,
      kelasId: authorized.kelasId,
      mapelId: authorized.mapelId,
    });

    if (duplicate) {
      const isOwner = duplicate.guru_id.toString() === session.id;
      return NextResponse.json(
        {
          error: isOwner
            ? `Anda sudah memiliki kelas online aktif untuk ${authorized.mapelNama} di ${authorized.kelasNama}.`
            : `Sedang berlangsung kelas online ${authorized.mapelNama} di ${authorized.kelasNama} oleh ${duplicate.guru_name}.`,
          existingRoom: {
            id: duplicate.id.toString(),
            room_name: duplicate.room_name,
            kelas: duplicate.kelas,
            mata_pelajaran: duplicate.mata_pelajaran,
            guru_name: duplicate.guru_name,
            isOwner,
          },
        },
        { status: 409 }
      );
    }

    // Buat room Daily.co (berlaku 4 jam)
    const roomSlugBase =
      authorized.sessionType === "WALI_KELAS"
        ? `${authorized.kelasNama}-wali`
        : `${authorized.kelasNama}-${authorized.mapelNama}`;
    const roomName = generateRoomName(roomSlugBase);
    const expTimestamp = Math.floor(Date.now() / 1000) + 60 * 60 * 4;

    const dailyRoom = await createDailyRoom(roomName, {
      privacy: "private",
      exp: expTimestamp,
    });

    const tokenResponse = await createMeetingToken({
      room_name: dailyRoom.name,
      user_name: authorized.context.guruName,
      is_owner: true,
      exp: expTimestamp,
    });

    const now = new Date();
    const kelasOnline = await prisma.kelasOnline.create({
      data: {
        room_name: dailyRoom.name,
        room_url: dailyRoom.url,
        daily_room_id: dailyRoom.id,
        guru_id: BigInt(session.id),
        guru_name: authorized.context.guruName,
        kelas: authorized.kelasNama,
        mata_pelajaran: authorized.mapelNama,
        kelas_id: authorized.kelasId,
        mapel_id: authorized.mapelId,
        jadwal_id: authorized.jadwalId,
        pertemuan_id: authorized.pertemuanId,
        session_type: authorized.sessionType,
        topik: parsed.data.topik || null,
        status: "active",
        started_at: now,
        max_participants: dailyRoom.config?.max_participants ?? 50,
        created_at: now,
      },
    });

    await prisma.kelasOnlineAttendance.create({
      data: {
        kelas_online_id: kelasOnline.id,
        user_id: BigInt(session.id),
        user_name: authorized.context.guruName,
        user_role: "guru",
        joined_at: now,
        created_at: now,
      },
    });

    return NextResponse.json({
      roomId: kelasOnline.id.toString(),
      roomUrl: dailyRoom.url,
      roomName: dailyRoom.name,
      token: tokenResponse.token,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error creating room:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat kelas online.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
