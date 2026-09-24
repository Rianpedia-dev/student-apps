"use client";

import React from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Calculator, 
  Atom, 
  Globe, 
  Languages, 
  Laptop, 
  Sparkles, 
  BookOpenText, 
  Activity, 
  Compass, 
  Clock, 
  User, 
  ArrowRight,
  FileCheck
} from "lucide-react";
import { AlAzharCornerMosaic } from "@/components/ui/alazhar-patterns";

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

const ICON_MAP: Record<string, any> = {
  Calculator,
  Atom,
  Globe,
  Languages,
  Laptop,
  Sparkles,
  BookOpenText,
  Activity,
  Compass,
  BookOpen,
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; lightBg: string; gradient: string }> = {
  emerald: { bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30", lightBg: "bg-emerald-500/10", gradient: "from-emerald-500/20 to-teal-500/5" },
  indigo: { bg: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/30", lightBg: "bg-indigo-500/10", gradient: "from-indigo-500/20 to-blue-500/5" },
  violet: { bg: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/30", lightBg: "bg-violet-500/10", gradient: "from-violet-500/20 to-purple-500/5" },
  amber: { bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30", lightBg: "bg-amber-500/10", gradient: "from-amber-500/20 to-orange-500/5" },
  blue: { bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30", lightBg: "bg-blue-500/10", gradient: "from-blue-500/20 to-cyan-500/5" },
  sky: { bg: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", border: "border-sky-500/30", lightBg: "bg-sky-500/10", gradient: "from-sky-500/20 to-blue-500/5" },
  rose: { bg: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/30", lightBg: "bg-rose-500/10", gradient: "from-rose-500/20 to-pink-500/5" },
  lime: { bg: "bg-lime-500", text: "text-lime-600 dark:text-lime-400", border: "border-lime-500/30", lightBg: "bg-lime-500/10", gradient: "from-lime-500/20 to-emerald-500/5" },
  orange: { bg: "bg-orange-500", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/30", lightBg: "bg-orange-500/10", gradient: "from-orange-500/20 to-amber-500/5" },
  teal: { bg: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/30", lightBg: "bg-teal-500/10", gradient: "from-teal-500/20 to-emerald-500/5" },
};

export function SubjectCard({
  id,
  kodeMapel,
  namaMapel,
  jenjang,
  icon = "BookOpen",
  warna = "emerald",
  guruNama,
  jadwalHari,
  jadwalWaktu,
  ruang,
  activeTasksCount = 0,
  detailUrl,
}: SubjectCardProps) {
  const IconComponent = ICON_MAP[icon || "BookOpen"] || BookOpen;
  const theme = COLOR_MAP[warna || "emerald"] || COLOR_MAP.emerald;

  return (
    <div className={`group relative rounded-2xl border ${theme.border} bg-card p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden flex flex-col justify-between`}>
      {/* Background Accent Gradient */}
      <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${theme.gradient} rounded-bl-full pointer-events-none transition-transform duration-300 group-hover:scale-110`} />
      {/* Al-Azhar Geometric Triangular Prism Accent */}
      <AlAzharCornerMosaic className="absolute top-0 right-0 w-24 sm:w-28 h-14 pointer-events-none opacity-50 group-hover:opacity-85 transition-opacity select-none z-0" />

      <div>
        {/* Top Badges & Icon */}
        <div className="flex items-start justify-between mb-3.5">
          <div className={`h-11 w-11 rounded-xl ${theme.lightBg} ${theme.text} flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1.5">
            {activeTasksCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                {activeTasksCount} Tugas
              </span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase tracking-wider">
              {kodeMapel}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {namaMapel}
        </h4>

        {/* Teacher */}
        {guruNama && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{guruNama}</span>
          </div>
        )}

        {/* Schedule */}
        {jadwalHari && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{jadwalHari}, {jadwalWaktu || "07:30 - 09:00"} {ruang ? `(${ruang})` : ""}</span>
          </div>
        )}
      </div>

      {/* Card Footer Button */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <FileCheck className="h-3.5 w-3.5" />
          {activeTasksCount > 0 ? "Ada tugas menunggu" : "Materi & Silabus"}
        </span>

        <Link
          href={detailUrl}
          className={`inline-flex items-center gap-1 text-xs font-bold ${theme.text} hover:opacity-80 transition-opacity`}
        >
          <span>Masuk Mapel</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
