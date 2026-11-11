"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RoomCard } from "@/components/features/kelas-online/room-card";
import type { OnlineClassRoomItem } from "@/types/kelas-online";

interface SiswaRoomListProps {
  rooms: OnlineClassRoomItem[];
}

export function SiswaRoomList({ rooms }: SiswaRoomListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleJoin = async (roomId: string) => {
    setLoadingId(roomId);
    try {
      const res = await fetch("/api/kelas-online/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal bergabung ke kelas");

      router.push(`/siswa/kelas-online/${roomId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          variant="active"
          role="siswa"
          onJoin={() => handleJoin(room.id)}
          isLoading={loadingId === room.id}
        />
      ))}
    </div>
  );
}
