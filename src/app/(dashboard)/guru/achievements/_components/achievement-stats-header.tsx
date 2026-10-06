"use client";

import React from "react";
import { Trophy, Award, Globe, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { detectAchievementTier, detectScope, detectCategory } from "./achievement-utils";

interface AchievementStatsHeaderProps {
  achievements: Array<{
    id: string;
    prestasi: string;
    kelas?: string;
  }>;
  guruClass?: string;
}

export function AchievementStatsHeader({ achievements, guruClass }: AchievementStatsHeaderProps) {
  const total = achievements.length;

  let goldCount = 0;
  let nationalCount = 0;
  let tahfidzCount = 0;

  for (const ach of achievements) {
    const tier = detectAchievementTier(ach.prestasi);
    const scope = detectScope(ach.prestasi);
    const cat = detectCategory(ach.prestasi);

    if (tier.tier === "gold") goldCount++;
    if (scope === "Nasional" || scope === "Internasional") nationalCount++;
    if (cat === "Keagamaan & Al-Qur'an" || tier.tier === "special") tahfidzCount++;
  }

  const stats = [
    {
      label: "Total Prestasi",
      value: total,
      sub: guruClass ? `Kelas ${guruClass}` : "Semua Angkatan",
      icon: Trophy,
      color: "amber",
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
      border: "border-amber-500/20 hover:border-amber-500/40",
      gradient: "from-amber-500/10 via-transparent to-transparent",
    },
    {
      label: "Juara 1 & Emas",
      value: goldCount,
      sub: "Podium Tertinggi",
      icon: Award,
      color: "yellow",
      iconBg: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
      border: "border-yellow-500/20 hover:border-yellow-500/40",
      gradient: "from-yellow-500/10 via-transparent to-transparent",
    },
    {
      label: "Tingkat Nasional",
      value: nationalCount,
      sub: "Skala Nasional & Antar Wilayah",
      icon: Globe,
      color: "sky",
      iconBg: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400",
      border: "border-sky-500/20 hover:border-sky-500/40",
      gradient: "from-sky-500/10 via-transparent to-transparent",
    },
    {
      label: "Tahfidz & Agama",
      value: tahfidzCount,
      sub: "Karakter Islami Al-Azhar",
      icon: BookOpen,
      color: "emerald",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      gradient: "from-emerald-500/10 via-transparent to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s, idx) => {
        const Icon = s.icon;
        return (
          <Card
            key={idx}
            className={`relative overflow-hidden rounded-2xl border ${s.border} bg-card transition-all duration-200 hover:shadow-xs group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} pointer-events-none opacity-60`} />
            <CardContent className="p-4 sm:p-4.5 flex items-center justify-between gap-3 relative z-10">
              <div className="space-y-0.5 min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                  {s.label}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {s.value}
                </p>
                <p className="text-[11px] text-muted-foreground/80 truncate">
                  {s.sub}
                </p>
              </div>
              <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${s.iconBg}`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
