"use client";

import React from "react";
import { X, Users, School, LayoutGrid, Table as TableIcon, Filter } from "lucide-react";
import { VIOLATION_CATEGORIES } from "@/lib/constants/violations";
import { cn } from "@/lib/utils";

export type ClassScope = "MY_CLASS" | "ALL_CLASSES";
export type ViewMode = "cards" | "table";

interface ViolationToolbarProps {
  classScope: ClassScope;
  onClassScopeChange: (scope: ClassScope) => void;
  classFilter: string;
  onClassFilterChange: (cls: string) => void;
  availableClasses: string[];
  semesterFilter: string;
  onSemesterFilterChange: (sem: string) => void;
  availableSemesters: string[];
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
  classFilter,
  onClassFilterChange,
  availableClasses,
  semesterFilter,
  onSemesterFilterChange,
  availableSemesters,
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
    semesterFilter !== "ALL" ||
    classFilter !== "ALL" ||
    (guruClass ? classScope !== "MY_CLASS" : false);

  const handleResetFilters = () => {
    onCategoryFilterChange("ALL");
    onSeverityFilterChange("ALL");
    onSemesterFilterChange("ALL");
    onClassFilterChange("ALL");
    if (guruClass) {
      onClassScopeChange("MY_CLASS");
    }
  };

  const getSelectClass = (isActive: boolean) =>
    cn(
      "h-8.5 w-full sm:w-auto sm:max-w-[155px] truncate rounded-xl border px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500/40 cursor-pointer transition-colors",
      isActive
        ? "bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300 font-semibold"
        : "bg-card border-border/60 text-foreground font-medium hover:border-border"
    );

  const renderViewToggle = (extraClass: string) => (
    <div
      className={cn(
        "p-0.5 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border/50 shrink-0",
        extraClass
      )}
    >
      <button
        type="button"
        onClick={() => onViewModeChange("cards")}
        title="Tampilan Kartu"
        aria-label="Tampilan Kartu"
        className={cn(
          "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
          viewMode === "cards"
            ? "bg-card text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("table")}
        title="Tampilan Tabel"
        aria-label="Tampilan Tabel"
        className={cn(
          "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
          viewMode === "table"
            ? "bg-card text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <TableIcon className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="bg-card/85 dark:bg-card/55 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl border border-border/60 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Kiri: Scope (Khusus Wali Kelas) + Filter Dropdowns dalam 1 Baris */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap xl:flex-nowrap sm:items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 sm:contents">
            {guruClass ? (
              <div className="inline-flex p-0.5 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border/50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onClassScopeChange("MY_CLASS");
                    onClassFilterChange("ALL");
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                    classScope === "MY_CLASS"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Users className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span className="truncate max-w-[115px]">Kelas Saya ({guruClass})</span>
                </button>
                <button
                  type="button"
                  onClick={() => onClassScopeChange("ALL_CLASSES")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                    classScope === "ALL_CLASSES"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <School className="h-3.5 w-3.5 shrink-0" />
                  <span>Semua</span>
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 px-1">
                <Filter className="h-3.5 w-3.5 shrink-0" />
                <span className="font-semibold">Filter:</span>
              </div>
            )}

            {renderViewToggle("inline-flex sm:hidden")}
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap xl:flex-nowrap items-center gap-2 min-w-0">
            {/* Filter Kelas Spesifik */}
            {classScope === "ALL_CLASSES" && availableClasses.length > 0 && (
              <select
                value={classFilter}
                onChange={(e) => onClassFilterChange(e.target.value)}
                aria-label="Filter Berdasarkan Kelas"
                className={getSelectClass(classFilter !== "ALL")}
              >
                <option value="ALL">Semua Kelas</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            )}

            {/* Filter Semester */}
            {availableSemesters.length > 0 && (
              <select
                value={semesterFilter}
                onChange={(e) => onSemesterFilterChange(e.target.value)}
                aria-label="Filter Berdasarkan Semester"
                className={getSelectClass(semesterFilter !== "ALL")}
              >
                <option value="ALL">Semua Semester</option>
                {availableSemesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            )}

            {/* Filter Kategori */}
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              aria-label="Filter Berdasarkan Kategori"
              className={getSelectClass(categoryFilter !== "ALL")}
            >
              <option value="ALL">Semua Kategori</option>
              {VIOLATION_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Filter Tingkat Pelanggaran */}
            <select
              value={severityFilter}
              onChange={(e) => onSeverityFilterChange(e.target.value)}
              aria-label="Filter Berdasarkan Tingkat Pelanggaran"
              className={getSelectClass(severityFilter !== "ALL")}
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="RINGAN">Ringan</option>
              <option value="SEDANG">Sedang</option>
            </select>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1 h-8.5 px-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Kanan (Tablet & Desktop): View Mode Toggle */}
        {renderViewToggle("hidden sm:inline-flex self-end lg:self-auto")}
      </div>
    </div>
  );
}
