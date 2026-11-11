"use client";

import React, { useEffect, useRef } from "react";
import { ClassroomRoomFrame } from "@/components/features/kelas-online/classroom-top-bar";
import { useKelasOnline } from "@/components/features/kelas-online/kelas-online-context";

interface RoomData {
  id: string;
  room_name: string;
  room_url: string;
  guru_name: string;
  kelas: string;
  mata_pelajaran: string | null;
  session_type?: "MAPEL" | "WALI_KELAS";
  topik?: string | null;
  pertemuan_ke?: number | null;
}

interface SiswaVideoCallClientProps {
  room: RoomData;
  token: string;
  userName: string;
  attendanceId: string;
}

export function SiswaVideoCallClient({
  room,
  token,
  userName,
  attendanceId,
}: SiswaVideoCallClientProps) {
  const { activeSession, startSession } = useKelasOnline();
  const initializedRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initializedRoomIdRef.current === room.id) {
      return;
    }
    initializedRoomIdRef.current = room.id;

    if (!activeSession || activeSession.roomId !== room.id) {
      startSession({
        roomId: room.id,
        roomName: room.room_name,
        roomUrl: room.room_url,
        token: token,
        userName: userName,
        role: "siswa",
        kelas: room.kelas,
        mataPelajaran: room.mata_pelajaran,
        sessionType: room.session_type,
        topik: room.topik,
        pertemuanKe: room.pertemuan_ke,
        guruName: room.guru_name,
        attendanceId: attendanceId,
      });
    }
  }, [activeSession, room, token, userName, attendanceId, startSession]);

  return <ClassroomRoomFrame role="siswa" />;
}
