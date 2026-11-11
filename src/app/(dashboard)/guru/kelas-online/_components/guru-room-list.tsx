"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Video, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FolderCard } from "@/components/ui/folder-card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { OnlineClassRoomItem } from "@/types/kelas-online";

interface GuruRoomListProps {
  rooms: OnlineClassRoomItem[];
  variant: "active" | "ended";
}

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function getTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  return `${hours}j ${minutes % 60}m lalu`;
}

function formatStartClock(dateStr: string | null): string {
  if (!dateStr) return "Aktif";
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function GuruRoomList({ rooms, variant }: GuruRoomListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmEndRoom, setConfirmEndRoom] = useState<OnlineClassRoomItem | null>(null);
  const isMounted = useIsMounted();
  const isActive = variant === "active";

  const handleJoin = (roomId: string) => {
    router.push(`/guru/kelas-online/${roomId}`);
  };

  const handleConfirmEnd = async () => {
    if (!confirmEndRoom) return;
    const targetRoom = confirmEndRoom;
    setLoadingId(targetRoom.id);

    try {
      const res = await fetch("/api/kelas-online/end-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: targetRoom.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengakhiri kelas");

      setConfirmEndRoom(null);
      toast.success("Kelas online telah diakhiri.");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {rooms.map((room) => {
          const isWaliSession = room.session_type === "WALI_KELAS";
          const title = isWaliSession
            ? "Sesi Wali Kelas"
            : room.mata_pelajaran || "Kelas Online";

          const subtitleParts = [room.kelas];
          if (room.pertemuan_ke) subtitleParts.push(`Pertemuan ${room.pertemuan_ke}`);
          if (room.topik) subtitleParts.push(room.topik);

          const timeMeta = isActive
            ? isMounted
              ? getTimeAgo(room.started_at)
              : `${formatStartClock(room.started_at)} WIB`
            : "Selesai";

          return (
            <FolderCard
              key={room.id}
              className="h-full"
              title={title}
              subtitle={subtitleParts.join(" • ")}
              count={room.active_participants ?? 0}
              countLabel="Peserta"
              meta={timeMeta}
              coverBadge={
                isActive ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-black/50 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white/90 ring-1 ring-white/20">
                      {isWaliSession ? "Wali Kelas" : "Mapel"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-300 ring-1 ring-emerald-400/40">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                      </span>
                      AKTIF
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-medium text-white/90 ring-1 ring-white/20">
                    Selesai
                  </span>
                )
              }
              footer={
                isActive ? (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      onClick={() => handleJoin(room.id)}
                      disabled={loadingId === room.id}
                      variant="emerald"
                      size="sm"
                      className="rounded-xl"
                    >
                      <Video className="h-3.5 w-3.5 shrink-0" />
                      <span>Masuk Kelas</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Button>
                    <Button
                      onClick={() => setConfirmEndRoom(room)}
                      disabled={loadingId === room.id}
                      variant="destructive"
                      size="sm"
                      className="rounded-xl shrink-0"
                    >
                      {loadingId === room.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Akhiri"
                      )}
                    </Button>
                  </div>
                ) : undefined
              }
            />
          );
        })}
      </div>

      {/* Konfirmasi Akhiri Kelas menggunakan AlertDialog dari components/ui */}
      <AlertDialog
        open={Boolean(confirmEndRoom)}
        onOpenChange={(open) => {
          if (!open && !loadingId) setConfirmEndRoom(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Akhiri Kelas Online?</AlertDialogTitle>
            <AlertDialogDescription>
              Sesi{" "}
              <strong>
                {confirmEndRoom?.session_type === "WALI_KELAS"
                  ? "Sesi Wali Kelas"
                  : confirmEndRoom?.mata_pelajaran || "Kelas Online"}
              </strong>{" "}
              ({confirmEndRoom?.kelas}) akan ditutup untuk semua peserta dan rekap kehadiran
              akan tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(loadingId)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={Boolean(loadingId)}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmEnd();
              }}
            >
              {loadingId ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Mengakhiri...
                </>
              ) : (
                "Ya, Akhiri Kelas"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
