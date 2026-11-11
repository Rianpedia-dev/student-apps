"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OnlineClassRoomItem } from "@/types/kelas-online";

interface StudentLiveClassBannerProps {
  room: OnlineClassRoomItem;
}

export function StudentLiveClassBanner({ room }: StudentLiveClassBannerProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const res = await fetch("/api/kelas-online/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal bergabung ke kelas online.");
      }

      router.push(`/siswa/kelas-online/${room.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
      setIsJoining(false);
    }
  };

  return (
    <Card variant="emerald" elevationSize="sm" className="border-2 border-emerald-500/40">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" size="sm" className="gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              LIVE NOW
            </Badge>
            {room.pertemuan_ke && (
              <Badge variant="outline" size="xs">
                Pertemuan ke-{room.pertemuan_ke}
              </Badge>
            )}
            <Badge variant="sky" size="xs" className="gap-1">
              <Users className="h-3 w-3" />
              {room.active_participants ?? 1} Peserta
            </Badge>
          </div>

          <p className="text-sm sm:text-base font-bold text-foreground">
            Kelas Online Sedang Berlangsung bersama {room.guru_name}
          </p>
          {room.topik && (
            <p className="text-xs text-muted-foreground">
              Topik: <strong>{room.topik}</strong>
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="emerald"
          size="sm"
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full sm:w-fit h-9 px-4 rounded-xl text-xs sm:text-[13px] font-semibold shrink-0"
        >
          {isJoining ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Menghubungkan...
            </>
          ) : (
            <>
              <Video className="h-3.5 w-3.5" />
              Gabung Kelas
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

