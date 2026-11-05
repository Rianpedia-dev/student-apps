"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Crown, Medal, Trophy } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";

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
}

export function LeaderboardPodium({ rankings, className }: LeaderboardPodiumProps) {
  if (!rankings || rankings.length === 0) {
    return null;
  }

  // Cari peringkat 1, 2, dan 3
  const rank1 = rankings.find((r) => r.rank === 1) || rankings[0];
  const rank2 = rankings.find((r) => r.rank === 2) || rankings[1];
  const rank3 = rankings.find((r) => r.rank === 3) || rankings[2];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-500/5 via-background to-background p-4 sm:p-6 border border-border/70",
        className
      )}
    >
      {/* Decorative Background Glow */}
      <div className="absolute left-1/2 -top-12 -translate-x-1/2 h-36 w-64 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          Podium Siswa Juara
        </span>
      </div>

      <div className="flex items-end justify-center gap-2.5 sm:gap-4 md:gap-6 pt-6 pb-2 max-w-xl mx-auto">
        {/* PODIUM 2: PERAK / SILVER (KIRI) */}
        {rank2 && (
          <div className="flex flex-col items-center flex-1 min-w-0 max-w-[140px] sm:max-w-[170px]">
            <div className="relative mb-2">
              <div className="relative p-1 rounded-full bg-gradient-to-b from-slate-300 to-zinc-400 shadow-md">
                <UserAvatar
                  src={rank2.avatarUrl}
                  gender={rank2.gender}
                  name={rank2.userName}
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover border-2 border-background"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-slate-400 to-zinc-200 text-xs font-black text-slate-800 shadow-sm border border-white">
                2
              </span>
            </div>

            <div className="text-center w-full px-1 mb-2">
              <h4 className="font-bold text-xs sm:text-sm text-foreground truncate" title={rank2.userName}>
                {rank2.userName}
              </h4>
              {rank2.byline && (
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{rank2.byline}</p>
              )}
              <span className="inline-block mt-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-400/20">
                {rank2.value} Poin
              </span>
            </div>

            {/* Pedestal Pilar #2 */}
            <div className="w-full h-24 sm:h-28 rounded-t-xl bg-gradient-to-t from-slate-300/40 via-slate-200/50 to-slate-100/60 dark:from-slate-800/80 dark:to-slate-700/60 border-t border-x border-slate-300 dark:border-slate-600 flex items-center justify-center shadow-inner">
              <Medal className="h-7 w-7 text-slate-400 opacity-60" />
            </div>
          </div>
        )}

        {/* PODIUM 1: EMAS / GOLD (TENGAH, TERTINGGI) */}
        {rank1 && (
          <div className="flex flex-col items-center flex-1 min-w-0 max-w-[155px] sm:max-w-[190px] -mt-6">
            <div className="relative mb-2">
              <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-7 w-7 text-amber-500 animate-bounce" />
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-lg ring-4 ring-amber-400/20">
                <UserAvatar
                  src={rank1.avatarUrl}
                  gender={rank1.gender}
                  name={rank1.userName}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-background"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-sm font-black text-amber-950 shadow-md border-2 border-white">
                1
              </span>
            </div>

            <div className="text-center w-full px-1 mb-2">
              <h4 className="font-extrabold text-xs sm:text-base text-foreground truncate" title={rank1.userName}>
                {rank1.userName}
              </h4>
              {rank1.byline && (
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">{rank1.byline}</p>
              )}
              <span className="inline-block mt-1 text-xs font-black text-amber-900 dark:text-amber-200 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                🔥 {rank1.value} Poin
              </span>
            </div>

            {/* Pedestal Pilar #1 (Tertinggi) */}
            <div className="w-full h-32 sm:h-38 rounded-t-xl bg-gradient-to-t from-amber-400/40 via-yellow-300/40 to-amber-200/50 dark:from-amber-900/60 dark:to-amber-800/40 border-t border-x border-amber-400 dark:border-amber-600 flex items-center justify-center shadow-lg">
              <Trophy className="h-9 w-9 text-amber-500 opacity-80" />
            </div>
          </div>
        )}

        {/* PODIUM 3: PERUNGGU / BRONZE (KANAN) */}
        {rank3 && (
          <div className="flex flex-col items-center flex-1 min-w-0 max-w-[140px] sm:max-w-[170px]">
            <div className="relative mb-2">
              <div className="relative p-1 rounded-full bg-gradient-to-b from-amber-700 to-orange-700 shadow-md">
                <UserAvatar
                  src={rank3.avatarUrl}
                  gender={rank3.gender}
                  name={rank3.userName}
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover border-2 border-background"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-amber-700 to-orange-500 text-xs font-black text-white shadow-sm border border-white">
                3
              </span>
            </div>

            <div className="text-center w-full px-1 mb-2">
              <h4 className="font-bold text-xs sm:text-sm text-foreground truncate" title={rank3.userName}>
                {rank3.userName}
              </h4>
              {rank3.byline && (
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{rank3.byline}</p>
              )}
              <span className="inline-block mt-1 text-[11px] font-extrabold text-orange-800 dark:text-orange-200 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                {rank3.value} Poin
              </span>
            </div>

            {/* Pedestal Pilar #3 */}
            <div className="w-full h-18 sm:h-22 rounded-t-xl bg-gradient-to-t from-orange-400/30 via-orange-300/30 to-amber-200/40 dark:from-orange-950/80 dark:to-orange-900/50 border-t border-x border-orange-400 dark:border-orange-700 flex items-center justify-center shadow-inner">
              <Medal className="h-6 w-6 text-orange-600 dark:text-orange-400 opacity-60" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

