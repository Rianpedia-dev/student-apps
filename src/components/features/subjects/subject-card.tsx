"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SubjectCardProps {
  id: string;
  kodeMapel: string;
  namaMapel: string;
  jenjang: string;
  icon?: string | null;
  warna?: string | null;
  guruNama?: string | null;
  guruImage?: string | null;
  jadwalHari?: string | null;
  jadwalWaktu?: string | null;
  ruang?: string | null;
  activeTasksCount?: number;
  completedTasksCount?: number;
  detailUrl: string;
}

export function SubjectCard({
  id,
  kodeMapel,
  namaMapel,
  jenjang,
  icon,
  warna = "emerald",
  guruNama,
  jadwalHari,
  jadwalWaktu,
  ruang,
  activeTasksCount = 0,
  detailUrl,
}: SubjectCardProps) {
  return (
    <Link
      href={detailUrl}
      className="group relative rounded-2xl border border-border/80 hover:border-emerald-500/40 bg-card p-4 sm:p-4.5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
    >
      <div>
        {/* Top: Title + Badge & Action Arrow */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground leading-snug truncate group-hover:text-primary transition-colors">
              {namaMapel}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            {activeTasksCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {activeTasksCount} Tugas
              </span>
            )}
            <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:text-primary group-hover:translate-x-0.5" />
          </div>
        </div>

        {/* Teacher & Schedule Info */}
        <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1">
          {guruNama && (
            <div className="truncate font-medium text-foreground/80">
              {guruNama}
            </div>
          )}

          {jadwalHari && (
            <div className="truncate text-[11px] text-muted-foreground/75">
              {jadwalHari}, {jadwalWaktu || "07:30 - 09:00"} {ruang ? `• ${ruang}` : ""}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
