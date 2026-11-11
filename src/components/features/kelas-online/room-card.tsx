"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KelasOnlineSessionType } from "@/types/kelas-online";

interface RoomData {
  id: string;
  room_name: string;
  guru_name: string;
  kelas: string;
  mata_pelajaran: string | null;
  session_type?: KelasOnlineSessionType;
  topik?: string | null;
  pertemuan_ke?: number | null;
  status: string;
  started_at: string | null;
  active_participants?: number;
  ended_at?: string | null;
  duration_minutes?: number | null;
  total_attendance?: number;
}

interface RoomCardProps {
  room: RoomData;
  variant: "active" | "ended";
  role: "guru" | "siswa" | "admin";
  onJoin?: () => void;
  onEnd?: () => void;
  isLoading?: boolean;
}

function getTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  return `${hours}j ${minutes % 60}m lalu`;
}

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "-";
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h} jam`;
}

export function RoomCard({
  room,
  variant,
  role,
  onJoin,
  onEnd,
  isLoading,
}: RoomCardProps) {
  const isActive = variant === "active";
  const isWaliSession = room.session_type === "WALI_KELAS";
  const displayTitle = isWaliSession
    ? "Pertemuan Wali Kelas"
    : room.mata_pelajaran || "Kelas Online";

  return (
    <Card
      className={`relative overflow-hidden rounded-2xl py-0 gap-0 h-full transition-all duration-200 ${
        isActive
          ? "border border-emerald-500/40 bg-gradient-to-br from-emerald-50/90 via-card/95 to-teal-50/50 shadow-md hover:shadow-lg dark:from-emerald-950/40 dark:via-slate-900/85 dark:to-teal-950/25 dark:border-emerald-600/40"
          : "border border-border/70 bg-card shadow-sm"
      }`}
    >
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600" />
      )}

      <CardContent className="p-4 sm:p-4.5 flex flex-col justify-between gap-3.5 h-full">
        <div className="space-y-3">
          {/* Status & Metadata Badges */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {isActive ? (
                <Badge variant="success" size="xs" className="gap-1.5 font-semibold tracking-wide">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                  </span>
                  AKTIF
                </Badge>
              ) : (
                <Badge variant="secondary" size="xs">
                  Selesai
                </Badge>
              )}

              <Badge variant={isWaliSession ? "violet" : "indigo"} size="xs">
                {isWaliSession ? "Wali Kelas" : "Mapel"}
              </Badge>

              {room.pertemuan_ke && (
                <Badge variant="outline" size="xs">
                  Pert. {room.pertemuan_ke}
                </Badge>
              )}
            </div>

            {isActive && room.active_participants !== undefined && (
              <Badge variant="sky" size="xs" className="font-semibold">
                {room.active_participants} hadir
              </Badge>
            )}
          </div>

          {/* Room Title & Topic */}
          <div className="min-w-0 space-y-0.5">
            <h3 className="font-bold text-sm sm:text-[15px] text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
              {displayTitle}
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              {room.kelas}
            </p>
            {room.topik && (
              <p className="text-[11px] sm:text-xs text-foreground/80 pt-0.5 line-clamp-2">
                Topik: <span className="font-medium">{room.topik}</span>
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Teacher & Time Info */}
          <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
            <span className="truncate">{room.guru_name}</span>
            <span className="shrink-0">
              {isActive
                ? `Mulai ${getTimeAgo(room.started_at)}`
                : formatDuration(room.duration_minutes)}
            </span>
          </div>

          {!isActive && room.total_attendance !== undefined && (
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              {room.total_attendance} siswa tercatat hadir
            </p>
          )}

          {/* Action Buttons */}
          {isActive && (onJoin || (onEnd && role === "guru")) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              {onJoin && (
                <Button
                  onClick={onJoin}
                  disabled={isLoading}
                  variant={role === "siswa" ? "launch" : "emerald"}
                  size="sm"
                  className="w-full sm:w-fit h-9 px-4 rounded-xl text-xs sm:text-[13px] font-semibold shadow-xs"
                >
                  {isLoading
                    ? "Menghubungkan..."
                    : role === "siswa"
                      ? "Mulai Belajar"
                      : "Masuk Kelas"}
                </Button>
              )}

              {onEnd && role === "guru" && (
                <Button
                  onClick={onEnd}
                  disabled={isLoading}
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-fit h-9 px-4 rounded-xl text-xs sm:text-[13px] font-semibold shrink-0"
                >
                  Akhiri
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
