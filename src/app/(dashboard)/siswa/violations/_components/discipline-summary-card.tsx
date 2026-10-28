"use client";

import React from "react";
import {
  ShieldCheck,
  TrendingDown,
  FileText,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  IslamicMosaicPattern,
  IslamicStarGeometricPattern,
  AlAzharCornerMosaic,
  AlAzharMosaicStrip,
} from "@/components/shared/alazhar-patterns";

export interface DisciplineSummaryCardProps {
  score: number;
  studentName?: string;
  studentNis?: string | null;
  studentKelas?: string | null;
  studentImage?: string | null;
  studentGender?: string | null;
  totalViolations: number;
  totalDeductedPoints: number;
}

export function DisciplineSummaryCard({
  score,
  studentName,
  studentNis,
  studentKelas,
  studentImage,
  studentGender,
  totalViolations,
  totalDeductedPoints,
}: DisciplineSummaryCardProps) {
  // Predikat Karakter & Kedisiplinan
  const getGrade = (pts: number) => {
    if (pts >= 90) {
      return {
        label: "Mumtaz (Sangat Baik)",
        shortLabel: "Mumtaz",
        variant: "emerald" as const,
        description:
          "Alhamdulillah, Anda senantiasa menjaga ketertiban ibadah, etika iPad, dan adab mulia di lingkungan sekolah.",
        colorClass: "text-emerald-400",
        progressColor: "bg-emerald-400",
      };
    }
    if (pts >= 75) {
      return {
        label: "Jayyid Jiddan (Baik)",
        shortLabel: "Jayyid Jiddan",
        variant: "purple" as const,
        description:
          "Catatan kedisiplinan baik. Senantiasa pertahankan ketertiban dan tingkatkan adab belajar sehari-hari.",
        colorClass: "text-purple-400",
        progressColor: "bg-purple-400",
      };
    }
    if (pts >= 60) {
      return {
        label: "Maqbul (Cukup)",
        shortLabel: "Maqbul",
        variant: "amber" as const,
        description:
          "Perlu meningkatkan kepatuhan tata tertib sekolah dan memanfaatkan bimbingan ustadz/ustadzah.",
        colorClass: "text-amber-400",
        progressColor: "bg-amber-400",
      };
    }
    return {
      label: "Perlu Pendampingan",
      shortLabel: "Bimbingan",
      variant: "destructive" as const,
      description:
        "Memerlukan pendampingan intensif dari wali kelas dan guru BK untuk perbaikan karakter santri.",
      colorClass: "text-rose-400",
      progressColor: "bg-rose-500",
    };
  };

  const grade = getGrade(score);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Al-Azhar Official Styled Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#09574c] to-[#083344] p-4 sm:p-6 md:p-8 text-white shadow-2xl border border-emerald-400/35">
        {/* Decorative Ambient Lighting & Color Glows */}
        <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-10 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-teal-500/25 blur-3xl pointer-events-none" />

        {/* Motif Desain: Islamic Geometric Star Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.16] pointer-events-none mix-blend-screen">
          <IslamicStarGeometricPattern />
        </div>
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none mix-blend-overlay">
          <IslamicMosaicPattern />
        </div>

        {/* Corner Mosaic Motif di Sudut Kanan Atas */}
        <div className="absolute top-0 right-0 w-36 sm:w-44 h-28 opacity-40 pointer-events-none">
          <AlAzharCornerMosaic className="w-full h-full" />
        </div>

        {/* Pita Mozaik Segitiga Warna-Warni di Garis Bawah Card */}
        <div className="absolute inset-x-0 bottom-0 h-1.5 opacity-90 overflow-hidden">
          <AlAzharMosaicStrip className="h-full w-full object-cover" />
        </div>

        {/* Main Content Layout: Responsive Flex */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
          {/* Sisi Kiri: Profil Siswa & Greeting */}
          <div className="flex items-start gap-3.5 sm:gap-4.5 min-w-0 max-w-2xl">
            <div className="relative shrink-0">
              <UserAvatar
                src={studentImage}
                gender={studentGender}
                name={studentName}
                className="h-14 w-14 sm:h-18 sm:w-18 rounded-2xl border-2 border-emerald-300/40 shadow-xl object-cover"
                previewable={false}
              />
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-[#064e3b] flex items-center justify-center text-white">
                <ShieldCheck className="h-3 w-3" />
              </span>
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-300/30 text-[10px] sm:text-xs font-semibold text-emerald-200 uppercase tracking-wide">
                  <Sparkles className="h-3 w-3" />
                  Buku Kedisiplinan & Adab
                </span>
                {studentKelas && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-[10px] sm:text-xs font-medium text-emerald-100 border border-white/15">
                    {studentKelas}
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight truncate">
                {studentName || "Santri Al-Azhar Cairo"}
              </h1>

              {studentNis && (
                <p className="text-[11px] sm:text-xs text-emerald-200/80 font-mono">
                  NIS: {studentNis}
                </p>
              )}

              <p className="text-xs sm:text-sm text-emerald-50/90 font-normal leading-relaxed pt-0.5 line-clamp-2">
                {grade.description}
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Frosted Glass Score Card */}
          <div className="shrink-0 w-full md:w-auto md:min-w-[240px] lg:min-w-[260px] bg-white/10 dark:bg-black/25 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] sm:text-xs font-medium text-emerald-200 uppercase tracking-wider">
                Indeks Karakter
              </span>
              <Badge variant={grade.variant} size="sm" className="text-[10px] sm:text-xs font-semibold">
                {grade.shortLabel}
              </Badge>
            </div>

            <div className="flex items-baseline gap-1.5 mb-2.5">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                {score}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-200/80">
                / 100 Poin
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="h-2.5 w-full bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${grade.progressColor}`}
                  style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-emerald-200/70 font-mono">
                <span>0</span>
                <span>Standar 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Responsive 4 Stat KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4">
        {/* Card 1: Skor Kedisiplinan */}
        <Card className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                score >= 90
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : score >= 75
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  : score >= 60
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                Skor Kedisiplinan
              </p>
              <h3 className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate mt-0.5">
                {score} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
              </h3>
            </div>
          </div>
        </Card>

        {/* Card 2: Poin Terpotong */}
        <Card className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                totalDeductedPoints === 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                Poin Terpotong
              </p>
              <h3 className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate mt-0.5">
                {totalDeductedPoints > 0 ? `-${totalDeductedPoints}` : "0"}{" "}
                <span className="text-xs font-normal text-muted-foreground">Poin</span>
              </h3>
            </div>
          </div>
        </Card>

        {/* Card 3: Total Riwayat Catatan */}
        <Card className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                Riwayat Catatan
              </p>
              <h3 className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate mt-0.5">
                {totalViolations}{" "}
                <span className="text-xs font-normal text-muted-foreground">Catatan</span>
              </h3>
            </div>
          </div>
        </Card>

        {/* Card 4: Predikat Karakter & Adab */}
        <Card className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                score >= 90
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : score >= 75
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  : score >= 60
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              <Award className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                Predikat Akhlak
              </p>
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate mt-0.5">
                {grade.label}
              </h3>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
