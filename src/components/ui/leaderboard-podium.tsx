"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Crown, Medal, Trophy } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useTheme } from "next-themes";
import ShinyText from "./ShinyText";

export interface LeaderboardRanking {
  userId: string;
  userName: string;
  rank: number;
  value: number | string;
  avatarUrl?: string | null;
  gender?: string | null;
  byline?: string;
}

interface LeaderboardPodiumProps {
  rankings: LeaderboardRanking[];
  className?: string;
  onSelectStudent?: (ranking: LeaderboardRanking) => void;
  title?: string;
  shinyColor?: string;
  shinyShineColor?: string;
}

export function LeaderboardPodium({
  rankings,
  className,
  onSelectStudent,
  title = "Best Student",
  shinyColor,
  shinyShineColor,
}: LeaderboardPodiumProps) {
  const { resolvedTheme } = useTheme();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const checkDark = () => {
      if (typeof document !== "undefined") {
        setIsDark(
          document.documentElement.classList.contains("dark") ||
          resolvedTheme === "dark"
        );
      }
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [resolvedTheme]);

  if (!rankings || rankings.length === 0) {
    return null;
  }

  // Warna kontras tinggi sesuai tema: Hitam pekat di light mode, Putih solid di dark mode (bukan abu-abu)
  const activeColor = shinyColor ?? (isDark ? "#ffffff" : "#09090b");
  const activeShineColor = shinyShineColor ?? (isDark ? "#fbbf24" : "#ffffff");

  // Cari peringkat 1, 2, dan 3
  const rank1 = rankings.find((r) => r.rank === 1) || rankings[0];
  const rank2 = rankings.find((r) => r.rank === 2) || rankings[1];
  const rank3 = rankings.find((r) => r.rank === 3) || rankings[2];

  return (
    <div className={cn("relative w-full py-2", className)}>
      {/* Decorative Background Glow Lembut di Sekitar Pemenang */}
      <div className="absolute left-1/2 -top-8 -translate-x-1/2 h-36 w-64 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

      {/* Teks Judul Tengah Atas Animasi ShinyText Kontras Tinggi (Digeser sedikit ke atas) */}
      {title && (
        <div className="text-center pt-0 pb-1 sm:pb-2 mb-2 sm:mb-3 -translate-y-2 sm:-translate-y-3 relative z-10 flex justify-center">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
            <ShinyText
              text={title}
              disabled={false}
              speed={2}
              color={activeColor}
              shineColor={activeShineColor}
            />
          </h3>
        </div>
      )}

      <div className="flex items-end justify-center gap-2.5 sm:gap-4 md:gap-6 pt-7 sm:pt-9 pb-2 w-full max-w-xl sm:max-w-2xl mx-auto">
        {/* PODIUM 2: PERAK / SILVER (KIRI) */}
        {rank2 && (
          <div
            onClick={() => onSelectStudent?.(rank2)}
            role={onSelectStudent ? "button" : undefined}
            tabIndex={onSelectStudent ? 0 : undefined}
            onKeyDown={(e) => {
              if (onSelectStudent && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelectStudent(rank2);
              }
            }}
            title={onSelectStudent ? `Klik untuk melihat riwayat prestasi ${rank2.userName}` : undefined}
            className={cn(
              "flex flex-col items-center flex-1 min-w-0 max-w-[135px] sm:max-w-[170px] md:max-w-[190px] transition-all duration-200",
              onSelectStudent && "cursor-pointer hover:-translate-y-1 group"
            )}
          >
            <div
              className="relative mb-1 sm:mb-1.5 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              title={`Lihat foto ${rank2.userName}`}
            >
              <div className="relative p-1 rounded-full bg-gradient-to-b from-slate-300 to-zinc-400 shadow-md group-hover:ring-2 group-hover:ring-slate-400 transition-all">
                <UserAvatar
                  src={rank2.avatarUrl}
                  gender={rank2.gender}
                  name={rank2.userName}
                  previewable={true}
                  className="h-14 w-14 sm:h-15 sm:w-15 md:h-16 md:w-16 rounded-full object-cover border-2 border-background cursor-pointer hover:scale-105 transition-transform"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-slate-400 to-zinc-200 text-xs font-black text-slate-800 shadow-sm border-2 border-background pointer-events-none">
                2
              </span>
            </div>

            <div className="text-center w-full px-1 mb-1.5 sm:mb-2 flex flex-col items-center">
              <h4
                className="font-bold text-xs sm:text-sm text-foreground text-center leading-snug break-words group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                title={rank2.userName}
              >
                {rank2.userName}
              </h4>
              {rank2.byline && (
                <p
                  className="text-[10px] sm:text-xs text-slate-900 dark:text-slate-100 text-center leading-tight break-words font-semibold mt-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  title={rank2.byline}
                >
                  {rank2.byline}
                </p>
              )}
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-200 bg-white dark:bg-card px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs whitespace-nowrap">
                {rank2.value} Poin
              </span>
            </div>

            {/* Pedestal Pilar #2 (Tinggi Menengah - Solid & Shadow) */}
            <div className="w-full h-20 sm:h-26 md:h-32 rounded-t-2xl bg-gradient-to-t from-slate-300 via-slate-200 to-slate-100 dark:from-slate-700 dark:via-slate-600 dark:to-slate-500 border-t border-x border-slate-300 dark:border-slate-500 flex items-center justify-center shadow-xl shadow-slate-900/10 dark:shadow-black/40 group-hover:brightness-105 transition-all">
              <Medal className="h-6 w-6 sm:h-7 sm:w-7 text-slate-600 dark:text-slate-200 drop-shadow-xs" />
            </div>
          </div>
        )}

        {/* PODIUM 1: EMAS / GOLD (TENGAH, TERTINGGI) */}
        {rank1 && (
          <div
            onClick={() => onSelectStudent?.(rank1)}
            role={onSelectStudent ? "button" : undefined}
            tabIndex={onSelectStudent ? 0 : undefined}
            onKeyDown={(e) => {
              if (onSelectStudent && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelectStudent(rank1);
              }
            }}
            title={onSelectStudent ? `Klik untuk melihat riwayat prestasi ${rank1.userName}` : undefined}
            className={cn(
              "flex flex-col items-center flex-1 min-w-0 max-w-[150px] sm:max-w-[190px] md:max-w-[215px] transition-all duration-200",
              onSelectStudent && "cursor-pointer hover:-translate-y-1.5 group"
            )}
          >
            <div
              className="relative mb-1 sm:mb-1.5 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              title={`Lihat foto ${rank1.userName}`}
            >
              <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-7 w-7 text-amber-500 animate-bounce pointer-events-none" />
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-lg ring-4 ring-amber-400/20 group-hover:ring-amber-400/50 transition-all">
                <UserAvatar
                  src={rank1.avatarUrl}
                  gender={rank1.gender}
                  name={rank1.userName}
                  previewable={true}
                  className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 rounded-full object-cover border-2 border-background cursor-pointer hover:scale-105 transition-transform"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-sm font-black text-amber-950 shadow-md border-2 border-background pointer-events-none">
                1
              </span>
            </div>

            <div className="text-center w-full px-1 mb-1.5 sm:mb-2 flex flex-col items-center">
              <h4
                className="font-extrabold text-xs sm:text-base text-foreground text-center leading-snug break-words group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                title={rank1.userName}
              >
                {rank1.userName}
              </h4>
              {rank1.byline && (
                <p
                  className="text-[10px] sm:text-xs text-slate-900 dark:text-slate-100 text-center leading-tight break-words font-semibold mt-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  title={rank1.byline}
                >
                  {rank1.byline}
                </p>
              )}
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-black text-amber-950 dark:text-amber-200 bg-white dark:bg-card px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-amber-400/50 dark:border-amber-500/40 shadow-xs whitespace-nowrap">
                {rank1.value} Poin
              </span>
            </div>

            {/* Pedestal Pilar #1 (Tertinggi - Solid & Shadow) */}
            <div className="w-full h-28 sm:h-36 md:h-44 rounded-t-2xl bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300 dark:from-amber-700 dark:via-amber-600 dark:to-yellow-500 border-t border-x border-amber-300 dark:border-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/25 dark:shadow-black/40 group-hover:brightness-105 transition-all">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-amber-900/85 dark:text-amber-100 drop-shadow-xs" />
            </div>
          </div>
        )}

        {/* PODIUM 3: PERUNGGU / BRONZE (KANAN, TERENDAH) */}
        {rank3 && (
          <div
            onClick={() => onSelectStudent?.(rank3)}
            role={onSelectStudent ? "button" : undefined}
            tabIndex={onSelectStudent ? 0 : undefined}
            onKeyDown={(e) => {
              if (onSelectStudent && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelectStudent(rank3);
              }
            }}  
            title={onSelectStudent ? `Klik untuk melihat riwayat prestasi ${rank3.userName}` : undefined}
            className={cn(
              "flex flex-col items-center flex-1 min-w-0 max-w-[135px] sm:max-w-[170px] md:max-w-[190px] transition-all duration-200",
              onSelectStudent && "cursor-pointer hover:-translate-y-1 group"
            )}
          >
            <div
              className="relative mb-1 sm:mb-1.5 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              title={`Lihat foto ${rank3.userName}`}
            >
              <div className="relative p-1 rounded-full bg-gradient-to-b from-amber-700 to-orange-700 shadow-md group-hover:ring-2 group-hover:ring-orange-400 transition-all">
                <UserAvatar
                  src={rank3.avatarUrl}
                  gender={rank3.gender}
                  name={rank3.userName}
                  previewable={true}
                  className="h-13 w-13 sm:h-14 sm:w-14 md:h-15 md:w-15 rounded-full object-cover border-2 border-background cursor-pointer hover:scale-105 transition-transform"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-amber-700 to-orange-500 text-xs font-black text-white shadow-sm border-2 border-background pointer-events-none">
                3
              </span>
            </div>

            <div className="text-center w-full px-1 mb-1.5 sm:mb-2 flex flex-col items-center">
              <h4
                className="font-bold text-xs sm:text-sm text-foreground text-center leading-snug break-words group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                title={rank3.userName}
              >
                {rank3.userName}
              </h4>
              {rank3.byline && (
                <p
                  className="text-[10px] sm:text-xs text-slate-900 dark:text-slate-100 text-center leading-tight break-words font-semibold mt-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  title={rank3.byline}
                >
                  {rank3.byline}
                </p>
              )}
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] sm:text-xs font-black text-orange-900 dark:text-orange-200 bg-white dark:bg-card px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-orange-300 dark:border-orange-600 shadow-xs whitespace-nowrap">
                {rank3.value} Poin
              </span>
            </div>

            {/* Pedestal Pilar #3 (Terendah - Solid & Shadow) */}
            <div className="w-full h-12 sm:h-16 md:h-20 rounded-t-2xl bg-gradient-to-t from-amber-700 via-orange-400 to-amber-200 dark:from-amber-900 dark:via-orange-800 dark:to-amber-700 border-t border-x border-orange-300 dark:border-orange-500 flex items-center justify-center shadow-xl shadow-orange-700/20 dark:shadow-black/40 group-hover:brightness-105 transition-all">
              <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-amber-950/85 dark:text-amber-100 drop-shadow-xs" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

