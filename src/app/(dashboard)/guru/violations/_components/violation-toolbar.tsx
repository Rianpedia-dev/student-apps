"use client";

import React from "react";
import { X, Users, School, LayoutGrid, Table as TableIcon, Filter } from "lucide-react";
import { VIOLATION_CATEGORIES } from "@/lib/constants/violations";

export type ClassScope = "MY_CLASS" | "ALL_CLASSES";
export type ViewMode = "cards" | "table";

interface ViolationToolbarProps {
  classScope: ClassScope;
  onClassScopeChange: (scope: ClassScope) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  severityFilter: string;
  onSeverityFilterChange: (sev: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  guruClass: string;
}

export function ViolationToolbar({
  classScope,
  onClassScopeChange,
  categoryFilter,
  onCategoryFilterChange,
  severityFilter,
  onSeverityFilterChange,
  viewMode,
  onViewModeChange,
  guruClass,
}: ViolationToolbarProps) {
  const isFiltered =
    categoryFilter !== "ALL" ||
    severityFilter !== "ALL" ||
    (guruClass ? classScope !== "MY_CLASS" : false);

  const handleResetFilters = () => {
    onCategoryFilterChange("ALL");
    onSeverityFilterChange("ALL");
    if (guruClass) {
      onClassScopeChange("MY_CLASS");
    }
  };

  return (
    <div className="bg-card/70 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-border shadow-xs space-y-3">
      {/* Top Row: Class Selector + View Mode */}
      <div className="flex items-center justify-between gap-3">
        {/* Class Scope Selector */}
        <div className="inline-flex p-1 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border/40 shrink-0">
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
            Semua Kelas
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex p-1 bg-muted/60 rounded-xl border border-border/40 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange("cards")}
            title="Tampilan Kartu"
            className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              viewMode === "cards"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            title="Tampilan Tabel"
            className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">Filter:</span>
        </div>

        {/* Kategori */}
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          aria-label="Filter Berdasarkan Kategori"
          className="h-8 text-xs rounded-lg border border-border bg-background px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500/30 cursor-pointer"
        >
          <option value="ALL">Semua Kategori</option>
          {VIOLATION_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Tingkat Keparahan */}
        <select
          value={severityFilter}
          onChange={(e) => onSeverityFilterChange(e.target.value)}
          aria-label="Filter Berdasarkan Tingkat Keparahan"
          className="h-8 text-xs rounded-lg border border-border bg-background px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500/30 cursor-pointer"
        >
          <option value="ALL">Semua Tingkat</option>
          <option value="RINGAN">Ringan (5 pt)</option>
          <option value="SEDANG">Sedang (10-15 pt)</option>
          <option value="BERAT">Berat (25-30 pt)</option>
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium ml-auto flex items-center gap-1 cursor-pointer"
          >
            <X className="h-3 w-3" />
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
}
