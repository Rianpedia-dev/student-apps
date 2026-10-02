"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Award,
  User as UserIcon,
  Play,
  RotateCw,
  Calendar,
  AlertCircle,
  HelpCircle,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { startTaskSessionAction } from "@/actions/assignment";
import { toast } from "sonner";
import Link from "next/link";
import { getStatusConfig } from "@/lib/task-status";

interface StudentTaskLobbyCardProps {
  tugasId: string;
  judul: string;
  deskripsi: string;
  mapelNama: string;
  kelasNama: string;
  guruNama: string;
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
  mapelNama,
  kelasNama,
  guruNama,
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
      existingSubmission.status === "menunggu_penilaian");

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
    <Card>
      {/* Header: Subject, Class, Teacher */}
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" size="sm">{mapelNama}</Badge>
          <Badge variant="outline" size="sm">{kelasNama}</Badge>
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold">{judul}</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <UserIcon className="h-3.5 w-3.5" />
          Pengajar: {guruNama}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Instructions */}
        {deskripsi && (
          <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-muted-foreground mb-2">
              <Info className="h-3.5 w-3.5" />
              Petunjuk Pengerjaan
            </div>
            {deskripsi}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InfoPill icon={HelpCircle} label="Jumlah Soal" value={`${totalSoal} Soal`} />
          <InfoPill icon={Clock} label="Durasi" value={durasiMenit ? `${durasiMenit} Menit` : "Bebas"} />
          <InfoPill icon={Award} label="Skor Maks" value={`${poinMaksimal} Poin`} />
          <InfoPill icon={Calendar} label="Deadline" value={deadlineFormatted} truncate />
        </div>
      </CardContent>

      <Separator />

      {/* Action Panel */}
      <CardFooter className="p-5 sm:p-6">
        {isRevisionNeeded ? (
          <div className="w-full space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-semibold text-foreground">Tugas perlu diperbaiki</p>
                {existingSubmission.catatanGuru && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Catatan guru: &quot;{existingSubmission.catatanGuru}&quot;
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Link href={`/siswa/tugas/${tugasId}/kerjakan`}>
                <Button className="gap-2 font-semibold">
                  <RotateCw className="h-4 w-4" />
                  Perbaiki Tugas
                </Button>
              </Link>
            </div>
          </div>
        ) : hasSubmitted ? (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Tugas sudah diselesaikan
              </p>
              <p className="text-xs text-muted-foreground">
                Nilai: <strong className="text-foreground">{existingSubmission?.nilai ?? 0}</strong> / {poinMaksimal}
              </p>
            </div>
            <Link href={`/siswa/tugas/${tugasId}/hasil`}>
              <Button variant="outline" className="font-semibold gap-2">
                Lihat Hasil & Pembahasan
              </Button>
            </Link>
          </div>
        ) : isInProgress ? (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">Pengerjaan sedang berlangsung</p>
              <p className="text-xs text-muted-foreground">Ada draft jawaban yang belum diselesaikan.</p>
            </div>
            <Link href={`/siswa/tugas/${tugasId}/kerjakan`}>
              <Button className="gap-2 font-semibold">
                <RotateCw className="h-4 w-4" />
                Lanjutkan Pengerjaan
              </Button>
            </Link>
          </div>
        ) : isLate ? (
          <div className="w-full flex items-center gap-2 text-destructive text-sm font-medium">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Batas waktu pengerjaan sudah berakhir pada {deadlineFormatted}.
          </div>
        ) : (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">Siap mengerjakan?</p>
              <p className="text-xs text-muted-foreground">Jawaban akan tersimpan otomatis.</p>
            </div>
            <Button
              type="button"
              disabled={isStarting}
              onClick={handleStartTask}
              className="h-11 px-6 font-semibold gap-2"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Membuka Soal...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Mulai Kerjakan
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
  truncate,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <strong className={`text-sm font-bold text-foreground block ${truncate ? "truncate" : ""}`}>
        {value}
      </strong>
    </div>
  );
}
