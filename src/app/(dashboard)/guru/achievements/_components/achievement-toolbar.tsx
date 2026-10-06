"use client";

import React from "react";
import { Search, X, Users, School } from "lucide-react";
import { Input } from "@/components/ui/input";

export type ClassScope = "MY_CLASS" | "ALL_CLASSES";

interface AchievementToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  classScope: ClassScope;
  onClassScopeChange: (scope: ClassScope) => void;
  guruClass: string;
}

export function AchievementToolbar({
  searchQuery,
  onSearchChange,
  classScope,
  onClassScopeChange,
  guruClass,
}: AchievementToolbarProps) {
  return (
    <div className="bg-card/60 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-border shadow-xs">
      {/* Class Tabs + Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Class Scope Selector */}
        <div className="inline-flex p-1 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border/40 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onClassScopeChange("ALL_CLASSES")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              classScope === "ALL_CLASSES"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <School className="h-3.5 w-3.5" />
            Semua Prestasi
          </button>
          {guruClass && (
            <button
              type="button"
              onClick={() => onClassScopeChange("MY_CLASS")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                classScope === "MY_CLASS"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Kelas {guruClass}
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama siswa atau nama kejuaraan..."
            className="pl-9 pr-9 h-9 text-xs sm:text-sm rounded-xl bg-background/80 focus-visible:ring-amber-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
