"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Award,
  Play,
  RotateCw,
  Calendar,
  AlertCircle,
  HelpCircle,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { startTaskSessionAction } from "@/actions/assignment";
import { toast } from "sonner";
import Link from "next/link";

interface StudentTaskLobbyCardProps {
  tugasId: string;
  judul: string;
  deskripsi: string;
  mapelNama?: string;
  kelasNama?: string;
  guruNama?: string;
  deadlineFormatted: string;
  isLate: boolean;
  totalSoal: number;
  durasiMenit?: number | null;
  poinMaksimal: number;
  existingSubmission?: {
    id: string;
    status: string;
    nilai: number | null;
    catatanGuru?: string | null;
    totalBenar: number;
    totalSalah: number;
    submittedAt: string;
  } | null;
}

export function StudentTaskLobbyCard({
  tugasId,
  judul,
  deskripsi,
  deadlineFormatted,
  isLate,
  totalSoal,
  durasiMenit,
  poinMaksimal,
  existingSubmission,
}: StudentTaskLobbyCardProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const hasSubmitted =
    existingSubmission &&
    (existingSubmission.status === "sudah_dinilai" ||
      existingSubmission.status === "selesai" ||
      existingSubmission.status === "menunggu_penilaian" ||
      existingSubmission.status === "dikumpulkan" ||
      existingSubmission.status === "terlambat");

  const isInProgress =
    existingSubmission && existingSubmission.status === "sedang_mengerjakan";

  const isRevisionNeeded =
    existingSubmission && existingSubmission.status === "perlu_revisi";

  const handleStartTask = async () => {
    setIsStarting(true);
    try {
      const res = await startTaskSessionAction(tugasId);
      if (res.success) {
        router.push(`/siswa/tugas/${tugasId}/kerjakan`);
      } else {
        toast.error(res.error || "Gagal memulai tugas.");
        setIsStarting(false);
      }
    } catch {
      toast.error("Terjadi kendala jaringan saat memulai tugas.");
      setIsStarting(false);
    }
  };

  return (
    <Card className="rounded-2xl sm:rounded-3xl card-elevation shadow-2xl">
      {/* Header: Judul Tugas */}
      <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold leading-snug break-words">
          {judul}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-5">
        {/* Instructions */}
        {deskripsi && (
          <div className="p-3.5 sm:p-4 rounded-2xl glass-subpanel text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-muted-foreground mb-1.5 sm:mb-2">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Petunjuk Pengerjaan</span>
            </div>
            {deskripsi}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <InfoPill icon={HelpCircle} label="Jumlah Soal" value={`${totalSoal} Soal`} />
          <InfoPill icon={Clock} label="Durasi" value={durasiMenit ? `${durasiMenit} Menit` : "Bebas"} />
          <InfoPill icon={Award} label="Skor Maks" value={`${poinMaksimal} Poin`} />
          <InfoPill icon={Calendar} label="Deadline" value={deadlineFormatted} />
        </div>
      </CardContent>

      <Separator />

      {/* Action Panel */}
      <CardFooter className="p-4 sm:p-6">
        {isRevisionNeeded ? (
          <div className="w-full space-y-3">
            <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-destructive/10 border border-destructive/20 backdrop-blur-md">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Tugas perlu diperbaiki</p>
                {existingSubmission.catatanGuru && (
                  <p className="text-xs text-muted-foreground leading-relaxed break-words">
                    Catatan guru: &quot;{existingSubmission.catatanGuru}&quot;
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Link href={`/siswa/tugas/${tugasId}/kerjakan`} className="w-full sm:w-auto block">
                <Button className="w-full sm:w-auto h-10 sm:h-9 rounded-xl gap-2 font-semibold">
                  <RotateCw className="h-4 w-4" />
                  <span>Perbaiki Tugas</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : hasSubmitted ? (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Tugas sudah diselesaikan
              </p>
              <p className="text-xs text-muted-foreground">
                Nilai:{" "}
                <strong className="text-foreground">
                  {existingSubmission?.nilai !== null && existingSubmission?.nilai !== undefined
                    ? `${existingSubmission.nilai} / ${poinMaksimal}`
                    : "Menunggu Penilaian"}
                </strong>
              </p>
            </div>
            <Link href={`/siswa/tugas/${tugasId}/hasil`} className="w-full sm:w-auto block shrink-0">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-10 sm:h-9 rounded-xl font-semibold gap-2 justify-center"
              >
                Lihat Hasil & Pembahasan
              </Button>
            </Link>
          </div>
        ) : isInProgress ? (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">Pengerjaan sedang berlangsung</p>
              <p className="text-xs text-muted-foreground">Ada draft jawaban yang belum diselesaikan.</p>
            </div>
            <Link href={`/siswa/tugas/${tugasId}/kerjakan`} className="w-full sm:w-auto block shrink-0">
              <Button className="w-full sm:w-auto h-10 sm:h-9 rounded-xl gap-2 font-semibold justify-center">
                <RotateCw className="h-4 w-4" />
                <span>Lanjutkan Pengerjaan</span>
              </Button>
            </Link>
          </div>
        ) : isLate ? (
          <div className="w-full flex items-start sm:items-center gap-2 text-destructive text-xs sm:text-sm font-medium leading-relaxed">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 sm:mt-0" />
            <span>Batas waktu pengerjaan sudah berakhir pada {deadlineFormatted}.</span>
          </div>
        ) : (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">Siap mengerjakan?</p>
              <p className="text-xs text-muted-foreground">Jawaban akan tersimpan otomatis.</p>
            </div>
            <Button
              type="button"
              disabled={isStarting}
              onClick={handleStartTask}
              className="w-full sm:w-auto h-11 px-6 rounded-xl font-semibold gap-2 shrink-0"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Membuka Soal...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Mulai Kerjakan</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

/** Small info pill sub-component */
function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl glass-subpanel space-y-1 min-w-0">
      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <strong className="text-xs sm:text-sm font-bold text-foreground block leading-snug break-words">
        {value}
      </strong>
    </div>
  );
}
