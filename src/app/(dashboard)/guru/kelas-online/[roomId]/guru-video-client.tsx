"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  started_at: string | null;
  active_participants: number;
}

interface GuruVideoCallClientProps {
  room: RoomData;
  token: string;
  userName: string;
}

export function GuruVideoCallClient({
  room,
  token,
  userName,
}: GuruVideoCallClientProps) {
  const router = useRouter();
  const { activeSession, startSession, endSession } = useKelasOnline();
  const [isEnding, setIsEnding] = useState(false);
  const initializedRoomIdRef = useRef<string | null>(null);
  const isEndingRef = useRef(false);

  useEffect(() => {
    if (isEndingRef.current || initializedRoomIdRef.current === room.id) {
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
        role: "guru",
        kelas: room.kelas,
        mataPelajaran: room.mata_pelajaran,
        sessionType: room.session_type,
        topik: room.topik,
        pertemuanKe: room.pertemuan_ke,
        guruName: room.guru_name,
        startedAt: room.started_at,
        activeParticipants: room.active_participants,
      });
    }
  }, [activeSession, room, token, userName, startSession]);

  const handleEndClass = async () => {
    isEndingRef.current = true;
    setIsEnding(true);
    try {
      const res = await fetch("/api/kelas-online/end-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengakhiri kelas");

      toast.success("Kelas online telah berhasil diakhiri.");
      endSession();
      router.replace("/guru/kelas-online");
      router.refresh();
    } catch (err: unknown) {
      isEndingRef.current = false;
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
      setIsEnding(false);
    }
  };

  return (
    <ClassroomRoomFrame
      role="guru"
      onEndClass={handleEndClass}
      isEnding={isEnding}
    />
  );
}
