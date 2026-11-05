"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  LeaderboardPodium,
  type LeaderboardRanking as LeaderboardPodiumRanking,
} from "@/components/ui/leaderboard-podium";
import {
  LeaderboardRankings,
  type LeaderboardRankingItem,
} from "@/components/ui/leaderboard-rankings";

export interface LeaderboardRunOption {
  id: string;
  label: string;
}

export interface LeaderboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  fromDate: string | Date;
  toDate: string | Date;
  podiumRankings: LeaderboardPodiumRanking[];
  rankings: LeaderboardRankingItem[];
  currentUserId?: string;
  runOptions?: LeaderboardRunOption[];
  selectedRunId?: string;
  onRunChange?: (runId: string) => void;
}

function formatRangeDate(date: string | Date) {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("id-ID", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const LeaderboardCard = React.forwardRef<HTMLDivElement, LeaderboardCardProps>(
  (
    {
      className,
      title = "Leaderboard Siswa Berprestasi",
      fromDate,
      toDate,
      podiumRankings,
      rankings,
      currentUserId,
      runOptions,
      selectedRunId,
      onRunChange,
      ...props
    },
    ref
  ) => {
    const fromLabel = formatRangeDate(fromDate);
    const toLabel = formatRangeDate(toDate);
    const resolvedRunId = selectedRunId ?? runOptions?.[0]?.id ?? "";
    const hasOnRunChange = Boolean(onRunChange);
    const [localRunId, setLocalRunId] = React.useState(resolvedRunId);

    React.useEffect(() => {
      if (hasOnRunChange) return;
      setLocalRunId(resolvedRunId);
    }, [hasOnRunChange, resolvedRunId]);

    const activeRunId = hasOnRunChange ? resolvedRunId : localRunId;

    return (
      <div
        ref={ref}
        className={cn("bg-card rounded-3xl border p-5 sm:p-7 shadow-sm", className)}
        {...props}
      >
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h3>
            <p className="text-muted-foreground text-xs sm:text-sm font-medium">
              Periode: {fromLabel} – {toLabel}
            </p>
          </div>

          {runOptions && runOptions.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
                Cakupan:
              </span>
              <select
                aria-label="Pilih filter cakupan leaderboard"
                value={activeRunId}
                onChange={(e) => {
                  if (onRunChange) {
                    onRunChange(e.target.value);
                    return;
                  }
                  setLocalRunId(e.target.value);
                }}
                className="bg-background text-foreground rounded-xl border border-input px-3 py-2 text-xs sm:text-sm font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              >
                {runOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {/* Podium Top 3 Siswa Juara */}
        <LeaderboardPodium rankings={podiumRankings} className="mb-6" />

        {/* Daftar Peringkat Lengkap dengan Highlight Siswa Aktif & Paginasi */}
        <LeaderboardRankings
          rankings={rankings}
          currentUserId={currentUserId}
          showPagination
          defaultPageSize={10}
        />
      </div>
    );
  }
);

LeaderboardCard.displayName = "LeaderboardCard";

export { LeaderboardCard };

