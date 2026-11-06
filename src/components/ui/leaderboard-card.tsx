"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X, ChevronDown } from "lucide-react";
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
  fromDate?: string | Date;
  toDate?: string | Date;
  podiumRankings: LeaderboardPodiumRanking[];
  rankings: LeaderboardRankingItem[];
  currentUserId?: string;
  runOptions?: LeaderboardRunOption[];
  selectedRunId?: string;
  onRunChange?: (runId: string) => void;
  onSelectStudent?: (item: LeaderboardRankingItem) => void;
  actionButton?: React.ReactNode;
}

function formatRangeDate(date?: string | Date) {
  if (!date) return "";
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
      title,
      fromDate,
      toDate,
      podiumRankings,
      rankings,
      currentUserId,
      runOptions,
      selectedRunId,
      onRunChange,
      onSelectStudent,
      actionButton,
      ...props
    },
    ref
  ) => {
    const fromLabel = formatRangeDate(fromDate);
    const toLabel = formatRangeDate(toDate);
    const resolvedRunId = selectedRunId ?? runOptions?.[0]?.id ?? "";
    const hasOnRunChange = Boolean(onRunChange);
    const [localRunId, setLocalRunId] = React.useState(resolvedRunId);
    const [searchQuery, setSearchQuery] = React.useState("");

    React.useEffect(() => {
      if (hasOnRunChange) return;
      setLocalRunId(resolvedRunId);
    }, [hasOnRunChange, resolvedRunId]);

    const activeRunId = hasOnRunChange ? resolvedRunId : localRunId;

    // Filter daftar ranking berdasarkan input pencarian nama atau kelas siswa
    const filteredRankings = React.useMemo(() => {
      if (!searchQuery.trim()) return rankings;
      const q = searchQuery.toLowerCase().trim();
      return rankings.filter(
        (item) =>
          item.userName.toLowerCase().includes(q) ||
          (item.byline && item.byline.toLowerCase().includes(q))
      );
    }, [rankings, searchQuery]);

    // Render pengalih cakupan: Segmented Button untuk <= 2 opsi, Dropdown rapi untuk > 2 opsi
    const renderScopeControl = () => {
      if (!runOptions || runOptions.length === 0) return null;

      if (runOptions.length <= 2) {
        return (
          <div className="inline-flex items-center h-10 p-1 rounded-2xl bg-white dark:bg-card border border-border/80 shrink-0 shadow-xs">
            {runOptions.map((opt) => {
              const isActive = activeRunId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (onRunChange) onRunChange(opt.id);
                    else setLocalRunId(opt.id);
                  }}
                  className={cn(
                    "h-8 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center",
                    isActive
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-muted/80"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
            Cakupan:
          </span>
          <div className="relative">
            <select
              aria-label="Pilih filter cakupan leaderboard"
              value={activeRunId}
              onChange={(e) => {
                if (onRunChange) onRunChange(e.target.value);
                else setLocalRunId(e.target.value);
              }}
              className="appearance-none h-10 bg-white dark:bg-card text-foreground rounded-xl border border-input pl-3.5 pr-8 text-xs sm:text-sm font-semibold shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/25 cursor-pointer"
            >
              {runOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
          </div>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={cn("space-y-6", className)}
        {...props}
      >
        {/* Header Opsional (Judul & Periode) Jika Diberikan */}
        {title || (fromLabel && toLabel) ? (
          <div className="space-y-1">
            {title && (
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h3>
            )}
            {fromLabel && toLabel && (
              <p className="text-muted-foreground text-xs sm:text-sm font-medium">
                Periode: {fromLabel} – {toLabel}
              </p>
            )}
          </div>
        ) : null}

        {/* Podium Top 3 Siswa Juara Tampil Langsung di Bagian Atas */}
        <LeaderboardPodium
          rankings={podiumRankings}
          onSelectStudent={
            onSelectStudent
              ? (podiumItem) =>
                  onSelectStudent({
                    userId: podiumItem.userId,
                    rank: podiumItem.rank,
                    userName: podiumItem.userName,
                    byline: podiumItem.byline,
                    value: `${podiumItem.value} Poin`,
                    avatarUrl: podiumItem.avatarUrl,
                    gender: podiumItem.gender,
                  })
              : undefined
          }
        />

        {/* Toolbar Interaktif: Pencarian Siswa & Pengalih Cakupan (Filter) & Tombol Tambah */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Input Pencarian Siswa */}
          <div className="relative flex-1 max-w-sm sm:max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa atau kelas..."
              className="w-full h-10 pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-card border border-input text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all placeholder:text-muted-foreground/60 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center cursor-pointer transition-colors"
                title="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sisi Kanan: Pengalih Cakupan (Filter) & Tombol Aksi Tambah */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            {renderScopeControl()}
            {actionButton}
          </div>
        </div>

        {/* Daftar Peringkat Lengkap dengan Highlight Siswa Aktif & Paginasi */}
        <LeaderboardRankings
          rankings={filteredRankings}
          currentUserId={currentUserId}
          showPagination
          defaultPageSize={10}
          onSelectStudent={onSelectStudent}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
        />
      </div>
    );
  }
);

LeaderboardCard.displayName = "LeaderboardCard";

export { LeaderboardCard };

