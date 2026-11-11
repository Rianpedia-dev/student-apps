import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createMeetingToken } from "@/lib/daily";
import { KelasOnlineService } from "@/services/kelas-online.service";
import { SiswaVideoCallClient } from "./siswa-video-client";

export const dynamic = "force-dynamic";

export default async function SiswaVideoCallPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const { roomId } = await params;
  if (!/^\d+$/.test(roomId)) {
    redirect("/siswa/kelas-online");
  }

  await KelasOnlineService.cleanupExpiredRooms();

  const room = await prisma.kelasOnline.findUnique({
    where: { id: BigInt(roomId) },
    include: {
      pertemuan: { select: { pertemuan_ke: true } },
    },
  });

  if (!room || room.status !== "active") {
    redirect("/siswa/kelas-online");
  }

  // Resolusi kelas siswa & validasi berbasis kelas_id (fallback string kelas untuk record lama)
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
    redirect("/siswa/kelas-online");
  }

  let token = "";
  let attendanceId = "";
  try {
    const expTimestamp = Math.floor(Date.now() / 1000) + 60 * 60 * 4;
    const tokenResponse = await createMeetingToken({
      room_name: room.room_name,
      user_name: session.name,
      is_owner: false,
      exp: expTimestamp,
    });
    token = tokenResponse.token;

    let attendance = await prisma.kelasOnlineAttendance.findFirst({
      where: {
        kelas_online_id: room.id,
        user_id: BigInt(session.id),
        left_at: null,
      },
      orderBy: { joined_at: "desc" },
    });

    if (!attendance) {
      attendance = await prisma.kelasOnlineAttendance.create({
        data: {
          kelas_online_id: room.id,
          user_id: BigInt(session.id),
          user_name: session.name,
          user_role: "siswa",
          joined_at: new Date(),
          created_at: new Date(),
        },
      });
    }
    attendanceId = attendance.id.toString();
  } catch (e) {
    console.error("Error creating token/attendance:", e);
    redirect("/siswa/kelas-online");
  }

  const roomData = {
    id: room.id.toString(),
    room_name: room.room_name,
    room_url: room.room_url,
    guru_name: room.guru_name,
    kelas: room.kelas,
    mata_pelajaran:
      room.session_type === "WALI_KELAS" ? "Sesi Wali Kelas" : room.mata_pelajaran,
    session_type: (room.session_type === "WALI_KELAS" ? "WALI_KELAS" : "MAPEL") as
      | "MAPEL"
      | "WALI_KELAS",
    topik: room.topik,
    pertemuan_ke: room.pertemuan?.pertemuan_ke ?? null,
  };

  return (
    <SiswaVideoCallClient
      room={roomData}
      token={token}
      userName={session.name}
      attendanceId={attendanceId}
    />
  );
}
