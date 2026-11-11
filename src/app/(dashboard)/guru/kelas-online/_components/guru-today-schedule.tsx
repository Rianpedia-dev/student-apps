"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  Clock,
  Loader2,
  Play,
  School,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  TeacherClassOption,
  TeacherTodayScheduleItem,
} from "@/types/kelas-online";

interface GuruTodayScheduleProps {
  todaySchedules: TeacherTodayScheduleItem[];
  isWaliKelas: boolean;
  waliKelas: TeacherClassOption | null;
  activeWaliRoomId?: string | null;
}

export function GuruTodaySchedule({
  todaySchedules,
  isWaliKelas,
  waliKelas,
  activeWaliRoomId,
}: GuruTodayScheduleProps) {
  const router = useRouter();
  const [startingKey, setStartingKey] = useState<string | null>(null);

  const hasWaliShortcut = isWaliKelas && Boolean(waliKelas);
  if (todaySchedules.length === 0 && !hasWaliShortcut) {
    return null;
  }

  const handleQuickStartSchedule = async (item: TeacherTodayScheduleItem) => {
    if (item.activeRoomId) {
      router.push(`/guru/kelas-online/${item.activeRoomId}`);
      return;
    }

    setStartingKey(item.jadwalId);
    try {
      const res = await fetch("/api/kelas-online/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType: "MAPEL",
          kelasId: item.kelasId,
          mapelId: item.mapelId,
          jadwalId: item.jadwalId,
        }),
      });

      const data = await res.json();
      if (res.status === 409 && data.existingRoom?.isOwner) {
        toast.info("Room sudah aktif, mengarahkan ke ruang kelas...");
        router.push(`/guru/kelas-online/${data.existingRoom.id}`);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Gagal memulai kelas online.");
      }

      toast.success(`Kelas ${item.mapelNama} (${item.kelasNama}) dimulai!`);
      router.push(`/guru/kelas-online/${data.roomId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
      setStartingKey(null);
    }
  };

  const handleQuickStartWali = async () => {
    if (!waliKelas) return;
    if (activeWaliRoomId) {
      router.push(`/guru/kelas-online/${activeWaliRoomId}`);
      return;
    }

    setStartingKey("wali-kelas");
    try {
      const res = await fetch("/api/kelas-online/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType: "WALI_KELAS",
          topik: `Pembinaan Wali Kelas ${waliKelas.namaKelas}`,
        }),
      });

      const data = await res.json();
      if (res.status === 409 && data.existingRoom?.isOwner) {
        toast.info("Sesi Wali Kelas sudah aktif, masuk ke ruang kelas...");
        router.push(`/guru/kelas-online/${data.existingRoom.id}`);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Gagal memulai sesi wali kelas.");
      }

      toast.success(`Sesi Pembinaan ${waliKelas.namaKelas} dimulai!`);
      router.push(`/guru/kelas-online/${data.roomId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
      setStartingKey(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span>Pintasan Mulai Cepat Hari Ini</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {hasWaliShortcut && waliKelas && (
          <Card variant="purple" elevationSize="sm" enableHover>
            <CardContent className="p-4 flex flex-col justify-between gap-3 h-full">
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                  Sesi Pembinaan Wali Kelas
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{waliKelas.namaKelas}</span>
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant={activeWaliRoomId ? "emerald" : "default"}
                disabled={startingKey !== null}
                onClick={handleQuickStartWali}
                className="w-full sm:w-fit sm:ml-auto rounded-xl text-xs"
              >
                {startingKey === "wali-kelas" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Memulai...
                  </>
                ) : activeWaliRoomId ? (
                  <>
                    <Video className="h-3.5 w-3.5" />
                    Masuk Sesi Aktif
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Mulai Kelas Wali
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {todaySchedules.map((sch) => {
          const isBusy = startingKey === sch.jadwalId;
          const isLive = Boolean(sch.activeRoomId);

          return (
            <Card
              key={sch.jadwalId}
              variant={isLive ? "emerald" : "default"}
              elevationSize="sm"
              enableHover
            >
              <CardContent className="p-4 flex flex-col justify-between gap-3 h-full">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      {sch.jamMulai} - {sch.jamSelesai} WIB
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug line-clamp-1">
                    {sch.mapelNama}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sch.kelasNama}</span>
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={isLive ? "emerald" : "outline"}
                  disabled={startingKey !== null}
                  onClick={() => handleQuickStartSchedule(sch)}
                  className="w-full sm:w-fit sm:ml-auto rounded-xl text-xs"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Memulai Kelas...
                    </>
                  ) : isLive ? (
                    <>
                      <Video className="h-3.5 w-3.5" />
                      Masuk Kelas Aktif
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Mulai Sekarang
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

