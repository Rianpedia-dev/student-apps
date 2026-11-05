"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, UserCheck } from "lucide-react";

export interface LeaderboardRankingItem {
  userId: string;
  rank: number;
  userName: string;
  byline?: string;
  value: number | string;
  avatarUrl?: string | null;
  gender?: string | null;
  displayed?: boolean;
}

interface LeaderboardRankingsProps {
  rankings: LeaderboardRankingItem[];
  currentUserId?: string;
  showPagination?: boolean;
  defaultPageSize?: number;
  className?: string;
}

export function LeaderboardRankings({
  rankings,
  currentUserId,
  showPagination = true,
  defaultPageSize = 10,
  className,
}: LeaderboardRankingsProps) {
  const [currentPage, setCurrentPage] = React.useState(1);

  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground italic border rounded-xl bg-card">
        Belum ada siswa yang tercatat di papan peringkat ini.
      </div>
    );
  }

  const pageSize = defaultPageSize;
  const totalPages = Math.ceil(rankings.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = showPagination
    ? rankings.slice(startIndex, startIndex + pageSize)
    : rankings;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-3 py-1.5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <span className="w-8 text-center">Pos</span>
          <span>Siswa</span>
        </div>
        <span>Total Poin</span>
      </div>

      <div className="space-y-1.5">
        {paginatedItems.map((item) => {
          const isCurrentUser = Boolean(currentUserId && String(item.userId) === String(currentUserId));

          return (
            <div
              key={`${item.userId}-${item.rank}`}
              className={cn(
                "group flex items-center justify-between p-3 rounded-xl border transition-all duration-150",
                isCurrentUser
                  ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30"
                  : "bg-card/70 hover:bg-accent/40 border-border/60 hover:border-border"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank Badge */}
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold",
                    item.rank === 1
                      ? "bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 shadow-xs"
                      : item.rank === 2
                      ? "bg-gradient-to-tr from-slate-300 to-zinc-400 text-slate-900 shadow-xs"
                      : item.rank === 3
                      ? "bg-gradient-to-tr from-amber-700 to-orange-500 text-white shadow-xs"
                      : "bg-muted text-muted-foreground font-semibold"
                  )}
                >
                  {item.rank}
                </span>

                {/* Avatar */}
                <UserAvatar
                  src={item.avatarUrl}
                  gender={item.gender}
                  name={item.userName}
                  className="h-9 w-9 shrink-0 rounded-lg object-cover border border-border"
                />

                {/* Name & Byline */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5
                      className={cn(
                        "text-xs sm:text-sm font-bold truncate",
                        isCurrentUser ? "text-amber-900 dark:text-amber-200" : "text-foreground"
                      )}
                      title={item.userName}
                    >
                      {item.userName}
                    </h5>
                    {isCurrentUser && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-white shadow-xs">
                        <UserCheck className="h-3 w-3" /> Anda
                      </span>
                    )}
                  </div>
                  {item.byline && (
                    <p className="text-[11px] text-muted-foreground truncate">{item.byline}</p>
                  )}
                </div>
              </div>

              {/* Points Badge */}
              <div className="shrink-0 pl-2">
                <span
                  className={cn(
                    "inline-block text-xs font-extrabold px-2.5 py-1 rounded-lg border",
                    isCurrentUser
                      ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40"
                      : item.rank <= 3
                      ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20"
                      : "bg-secondary text-secondary-foreground border-border/40"
                  )}
                >
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
          <p className="text-muted-foreground">
            Menampilkan <strong className="text-foreground">{startIndex + 1}</strong> -{" "}
            <strong className="text-foreground">
              {Math.min(startIndex + pageSize, rankings.length)}
            </strong>{" "}
            dari <strong className="text-foreground">{rankings.length}</strong> siswa
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-7 w-7 rounded-md cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-7 w-7 rounded-md cursor-pointer disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

