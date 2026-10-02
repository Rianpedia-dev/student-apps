"use client";

import React from "react";
import { Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RunnerHeaderProps {
  mapelNama: string;
  tugasJudul: string;
  secondsRemaining: number | null;
  answeredCount: number;
  totalCount: number;
  progressPercent: number;
  onSubmitClick: () => void;
}

export function RunnerHeader({
  mapelNama,
  tugasJudul,
  secondsRemaining,
  answeredCount,
  totalCount,
  progressPercent,
  onSubmitClick,
}: RunnerHeaderProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: Mapel & Title */}
        <div className="truncate max-w-[40%] sm:max-w-[50%]">
          <span className="text-[11px] font-medium text-muted-foreground block truncate">
            {mapelNama}
          </span>
          <h1 className="text-xs sm:text-sm font-bold text-foreground truncate">
            {tugasJudul}
          </h1>
        </div>

        {/* Center: Timer */}
        {secondsRemaining !== null && (
          <div
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md border text-xs font-bold shrink-0 ${
              secondsRemaining < 300
                ? "text-destructive border-destructive/30 bg-destructive/10"
                : "text-foreground border-border bg-muted/60"
            }`}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>
        )}

        {/* Right: Progress & Submit */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[11px] font-medium text-muted-foreground">
              {answeredCount}/{totalCount} terjawab
            </span>
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={onSubmitClick}
            className="text-xs font-semibold gap-1.5 h-9 px-3"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kumpulkan</span>
            <span className="sm:hidden">Kirim</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
