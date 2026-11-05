"use client";

import React from "react";
import {
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
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
  score?: number; // kept as optional for backward compatibility
  studentName?: string;
  studentNis?: string | null;
  studentKelas?: string | null;
  studentImage?: string | null;
  studentGender?: string | null;
  totalViolations: number;
  activeViolationsCount: number;
  resolvedViolationsCount: number;
  totalDeductedPoints?: number; // optional deprecated
}

export function DisciplineSummaryCard({
  studentName,
  studentNis,
  studentKelas,
  studentImage,
  studentGender,
  totalViolations,
  activeViolationsCount,
  resolvedViolationsCount,
}: DisciplineSummaryCardProps) {
  const isClean = activeViolationsCount === 0;

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
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[#064e3b] flex items-center justify-center text-white ${
                  isClean ? "bg-emerald-500" : "bg-amber-500"
                }`}
              >
                {isClean ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
              </span>
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-300/30 text-[10px] sm:text-xs font-semibold text-emerald-200 uppercase tracking-wide">
                  <Sparkles className="h-3 w-3" />
                  Buku Pembinaan Karakter & Adab
                </span>
                {studentKelas && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-[10px] sm:text-xs font-medium text-emerald-100 border border-white/15">
                    {studentKelas}
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight truncate">
                {studentName || "Siswa Al-Azhar Cairo"}
              </h1>

              {studentNis && (
                <p className="text-[11px] sm:text-xs text-emerald-200/80 font-mono">
                  NIS: {studentNis}
                </p>
              )}

              <p className="text-xs sm:text-sm text-emerald-50/90 font-normal leading-relaxed pt-0.5 line-clamp-2">
                {isClean
                  ? "Alhamdulillah, catatan kedisiplinan dan adab Anda saat ini tertib. Pertahankan akhlak mulia dan keteladanan sehari-hari di lingkungan sekolah."
                  : `Terdapat ${activeViolationsCount} catatan pembinaan yang sedang dalam pendampingan wali kelas dan guru. Senantiasa berusaha memperbaiki diri dengan penuh keikhlasan.`}
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Frosted Glass Status Card */}
          <div className="shrink-0 w-full md:w-auto md:min-w-[240px] lg:min-w-[260px] bg-white/10 dark:bg-black/25 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] sm:text-xs font-medium text-emerald-200 uppercase tracking-wider">
                Status Kedisiplinan
              </span>
              <Badge
                variant={isClean ? "emerald" : "amber"}
                size="sm"
                className="text-[10px] sm:text-xs font-semibold"
              >
                {isClean ? "Tertib & Beradab" : "Dalam Pembinaan"}
              </Badge>
            </div>

            <div className="flex items-baseline gap-1.5 mb-2.5">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                {isClean ? "Tertib" : `${activeViolationsCount} Catatan`}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-200/80">
                {isClean ? "Kondusif" : "Aktif"}
              </span>
            </div>

            {/* Visual Status Indicator */}
            <div className="space-y-1">
              <div className="h-2.5 w-full bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isClean ? "bg-emerald-400 w-full" : "bg-amber-400 w-3/4"
                  }`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-emerald-200/70 font-mono">
                <span>{isClean ? "Akhlak Terpuji" : "Tahap Bimbingan"}</span>
                <span>Al-Azhar Cairo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Responsive 4 Stat KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4">
        {/* Card 1: Status Kedisiplinan */}
        <Card className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isClean
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                Status Kedisiplinan
              </p>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate mt-0.5">
                {isClean ? "Tertib & Beradab" : "Dalam Pembinaan"}
              </h3>
            </div>
          </div>
        </Card>

        {/* Card 2: Dalam Pembinaan */}
        <Card className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                activeViolationsCount === 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {activeViolationsCount === 0 ? (
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                Dalam Pembinaan
              </p>
              <h3 className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate mt-0.5">
                {activeViolationsCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">Catatan</span>
              </h3>
            </div>
          </div>
        </Card>

        {/* Card 3: Pembinaan Selesai */}
        <Card className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                Pembinaan Tuntas
              </p>
              <h3 className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate mt-0.5">
                {resolvedViolationsCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">Catatan</span>
              </h3>
            </div>
          </div>
        </Card>

        {/* Card 4: Total Riwayat Catatan */}
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
      </div>
    </div>
  );
}
