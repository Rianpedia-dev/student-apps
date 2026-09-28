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
  ArrowRight
} from "lucide-react";

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
  emerald: { bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20 hover:border-emerald-500/50", lightBg: "bg-emerald-500/10", gradient: "from-emerald-500/15 to-transparent" },
  indigo: { bg: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20 hover:border-indigo-500/50", lightBg: "bg-indigo-500/10", gradient: "from-indigo-500/15 to-transparent" },
  violet: { bg: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/20 hover:border-violet-500/50", lightBg: "bg-violet-500/10", gradient: "from-violet-500/15 to-transparent" },
  amber: { bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20 hover:border-amber-500/50", lightBg: "bg-amber-500/10", gradient: "from-amber-500/15 to-transparent" },
  blue: { bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20 hover:border-blue-500/50", lightBg: "bg-blue-500/10", gradient: "from-blue-500/15 to-transparent" },
  sky: { bg: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", border: "border-sky-500/20 hover:border-sky-500/50", lightBg: "bg-sky-500/10", gradient: "from-sky-500/15 to-transparent" },
  rose: { bg: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20 hover:border-rose-500/50", lightBg: "bg-rose-500/10", gradient: "from-rose-500/15 to-transparent" },
  lime: { bg: "bg-lime-500", text: "text-lime-600 dark:text-lime-400", border: "border-lime-500/20 hover:border-lime-500/50", lightBg: "bg-lime-500/10", gradient: "from-lime-500/15 to-transparent" },
  orange: { bg: "bg-orange-500", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20 hover:border-orange-500/50", lightBg: "bg-orange-500/10", gradient: "from-orange-500/15 to-transparent" },
  teal: { bg: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/20 hover:border-teal-500/50", lightBg: "bg-teal-500/10", gradient: "from-teal-500/15 to-transparent" },
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
    <Link
      href={detailUrl}
      className={`group relative rounded-2xl border ${theme.border} bg-card p-4.5 sm:p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden flex flex-col justify-between`}
    >
      {/* Subtle Ambient Glow */}
      <div className={`absolute -right-8 -top-8 w-28 h-28 bg-gradient-to-bl ${theme.gradient} rounded-full blur-xl pointer-events-none transition-opacity opacity-60 group-hover:opacity-100`} />

      <div>
        {/* Top: Icon + Badge (if task active) + Hover Action */}
        <div className="flex items-center justify-between mb-3.5">
          <div className={`h-10 w-10 rounded-xl ${theme.lightBg} ${theme.text} flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105`}>
            <IconComponent className="h-5 w-5" />
          </div>

          <div className="flex items-center gap-2">
            {activeTasksCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {activeTasksCount} Tugas
              </span>
            )}
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {namaMapel}
        </h4>

        {/* Teacher & Schedule Info */}
        <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
          {guruNama && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
              <span className="truncate">{guruNama}</span>
            </div>
          )}

          {jadwalHari && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
              <span className="truncate">{jadwalHari}, {jadwalWaktu || "07:30 - 09:00"} {ruang ? `(${ruang})` : ""}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
