"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getStatusConfig } from "@/lib/task-status";

interface ReviewHeaderProps {
  tugasId: string;
  mapelNama: string;
  kelasNama: string;
  poinMaksimal: number;
  currentScore: number;
  currentStatus: string;
  totalBenar: number;
  totalSalah: number;
  backHref: string;
  prevSubId?: string | null;
  nextSubId?: string | null;
  submission: {
    submittedAt: string;
    durasiDetik?: number | null;
    siswa: {
      name: string;
      nis?: string | null;
      image?: string | null;
      gender?: string | null;
    };
  };
}

export function ReviewHeader({
  tugasId,
  mapelNama,
  kelasNama,
  poinMaksimal,
  currentScore,
  currentStatus,
  totalBenar,
  totalSalah,
  backHref,
  prevSubId,
  nextSubId,
  submission,
}: ReviewHeaderProps) {
  const statusCfg = getStatusConfig(currentStatus);

  const formatDuration = (secs?: number | null) => {
    if (!secs) return "-";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s} dtk`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-4">
      {/* Top Bar with Speed-Grader Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted px-2.5 py-1.5 rounded-lg border border-transparent hover:border-border transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail Tugas</span>
        </Link>

        {/* Speed-Grader Navigation */}
        <div className="flex items-center gap-2">
          {prevSubId ? (
            <Link href={`/guru/tugas/${tugasId}/review/${prevSubId}`}>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Siswa Sebelumnya</span>
                <span className="sm:hidden">Sebelumnya</span>
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled className="text-xs h-8 gap-1 opacity-50">
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Siswa Sebelumnya</span>
              <span className="sm:hidden">Sebelumnya</span>
            </Button>
          )}

          {nextSubId ? (
            <Link href={`/guru/tugas/${tugasId}/review/${nextSubId}`}>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                <span className="hidden sm:inline">Siswa Berikutnya</span>
                <span className="sm:hidden">Berikutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled className="text-xs h-8 gap-1 opacity-50">
              <span className="hidden sm:inline">Siswa Berikutnya</span>
              <span className="sm:hidden">Berikutnya</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Student Banner Card */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <UserAvatar
              name={submission.siswa.name}
              src={submission.siswa.image}
              gender={submission.siswa.gender}
              className="size-11 sm:size-12 rounded-full ring-2 ring-border"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-foreground">
                  {submission.siswa.name}
                </h2>
                {submission.siswa.nis && (
                  <Badge variant="outline" className="text-[11px] font-normal">
                    NIS: {submission.siswa.nis}
                  </Badge>
                )}
                <Badge variant={statusCfg.variant} className="text-[11px]">
                  {statusCfg.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {mapelNama} • {kelasNama} • Dikumpulkan:{" "}
                {new Date(submission.submittedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Score & Quick Stats */}
          <div className="flex items-center gap-3 sm:gap-4 bg-muted/40 px-3.5 py-2.5 rounded-lg border border-border shrink-0 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Nilai Akhir
              </span>
              <div className="flex items-baseline gap-0.5 text-primary">
                <span className="text-2xl sm:text-3xl font-black">
                  {currentScore}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  /{poinMaksimal}
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-border" />

            <div className="text-left text-xs space-y-0.5">
              <div className="text-primary font-medium">✓ {totalBenar} Benar</div>
              <div className="text-muted-foreground font-medium">✕ {totalSalah} Salah</div>
              <div className="text-muted-foreground text-[11px]">
                ⏱️ {formatDuration(submission.durasiDetik)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
