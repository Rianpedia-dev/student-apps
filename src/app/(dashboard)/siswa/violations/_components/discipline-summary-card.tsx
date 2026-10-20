"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DisciplineSummaryCardProps {
  score: number;
  studentName?: string;
}

export function DisciplineSummaryCard({
  score,
  studentName,
}: DisciplineSummaryCardProps) {
  // Predikat Karakter & Kedisiplinan
  const getGrade = (pts: number) => {
    if (pts >= 90) return { label: "Mumtaz (Sangat Baik)", variant: "emerald" as const };
    if (pts >= 75) return { label: "Jayyid Jiddan (Baik)", variant: "purple" as const };
    if (pts >= 60) return { label: "Maqbul (Cukup)", variant: "amber" as const };
    return { label: "Perlu Pendampingan", variant: "destructive" as const };
  };

  const grade = getGrade(score);

  return (
    <Card className="rounded-3xl card-elevation p-4 sm:p-5 shadow-2xl">
      <div className="flex items-center gap-3.5 sm:gap-4">
        {/* Skor Poin */}
        <div
          className={`shrink-0 flex flex-col items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl font-extrabold ${
            score >= 90
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : score >= 75
              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
              : score >= 60
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
          }`}
        >
          <span className="text-xl sm:text-2xl font-black leading-none">{score}</span>
          <span className="text-[9px] sm:text-[10px] font-semibold opacity-75 uppercase mt-0.5">Poin</span>
        </div>

        {/* Informasi Status */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
              {studentName || "Catatan Kedisiplinan"}
            </h2>
            <Badge variant={grade.variant} size="sm" className="text-[10px] sm:text-xs shrink-0 font-medium">
              {grade.label}
            </Badge>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {score >= 90
              ? "Alhamdulillah, catatan kedisiplinan dan adab Anda sangat baik."
              : "Jadikan catatan pembinaan sebagai sarana muhasabah untuk senantiasa memperbaiki diri."}
          </p>
        </div>
      </div>
    </Card>
  );
}
