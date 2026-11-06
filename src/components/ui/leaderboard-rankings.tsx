"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  onSelectStudent?: (item: LeaderboardRankingItem) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function LeaderboardRankings({
  rankings,
  currentUserId,
  showPagination = true,
  defaultPageSize = 10,
  className,
  onSelectStudent,
  searchQuery,
  onClearSearch,
}: LeaderboardRankingsProps) {
  const [currentPage, setCurrentPage] = React.useState(1);

  // Reset ke halaman 1 saat pencarian atau daftar ranking berubah
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, rankings.length]);

  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-12 px-4 border border-dashed rounded-2xl bg-white dark:bg-card shadow-xs space-y-3">
        <p className="text-sm font-bold text-foreground">
          {searchQuery
            ? `Tidak ada siswa yang cocok dengan pencarian "${searchQuery}"`
            : "Belum ada siswa yang tercatat di papan peringkat ini."}
        </p>
        {searchQuery && (
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Periksa ejaan nama atau coba gunakan kata kunci pencarian nama yang lain.
          </p>
        )}
        {onClearSearch && searchQuery && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="rounded-xl text-xs cursor-pointer mt-1"
          >
            Reset Pencarian
          </Button>
        )}
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
      <div className="space-y-1.5">
        {paginatedItems.map((item) => {
          const isCurrentUser = Boolean(currentUserId && String(item.userId) === String(currentUserId));

          return (
            <div
              key={`${item.userId}-${item.rank}`}
              onClick={() => onSelectStudent?.(item)}
              role={onSelectStudent ? "button" : undefined}
              tabIndex={onSelectStudent ? 0 : undefined}
              onKeyDown={(e) => {
                if (onSelectStudent && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelectStudent(item);
                }
              }}
              title={onSelectStudent ? `Klik untuk melihat riwayat prestasi ${item.userName}` : undefined}
              className={cn(
                "group flex items-center justify-between p-3 rounded-xl border transition-all duration-150 shadow-xs",
                onSelectStudent && "cursor-pointer hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 active:scale-[0.995]",
                isCurrentUser
                  ? "bg-amber-50 dark:bg-amber-500/15 border-amber-500/60 shadow-xs ring-1 ring-amber-500/30"
                  : "bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-accent/40 border-slate-200/90 dark:border-border/60 hover:border-slate-300 dark:hover:border-border"
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

                {/* Avatar dengan Preview Lightbox Foto Murni */}
                <div
                  className="shrink-0 relative cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  title={`Lihat foto ${item.userName}`}
                >
                  <UserAvatar
                    src={item.avatarUrl}
                    gender={item.gender}
                    name={item.userName}
                    previewable={true}
                    className="h-9 w-9 rounded-lg object-cover border border-border hover:ring-2 hover:ring-amber-500/50 hover:scale-105 transition-all cursor-pointer"
                  />
                </div>

                {/* Name & Byline */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5
                      className={cn(
                        "text-xs sm:text-sm font-bold truncate transition-colors",
                        isCurrentUser ? "text-amber-900 dark:text-amber-200" : "text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400"
                      )}
                      title={item.userName}
                    >
                      {item.userName}
                    </h5>
                  </div>
                  {item.byline && (
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">{item.byline}</p>
                  )}
                </div>
              </div>

              {/* Points Badge & Detail Icon */}
              <div className="shrink-0 pl-2 flex items-center gap-1 sm:gap-2">
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
                {onSelectStudent && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                )}
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

