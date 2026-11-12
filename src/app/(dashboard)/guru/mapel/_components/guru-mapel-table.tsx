"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import {
  LayoutGrid,
  Table as TableIcon,
  Search,
  Calendar,
  Clock,
  BookOpen,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiquidGlassCard } from "@/components/ui/liquid-weather-glass";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const VALID_BADGE_VARIANTS = new Set<string>([
  "default",
  "secondary",
  "destructive",
  "outline",
  "success",
  "warning",
  "info",
  "amber",
  "yellow",
  "orange",
  "pink",
  "rose",
  "blue",
  "smp",
  "sky",
  "cyan",
  "teal",
  "emerald",
  "lime",
  "purple",
  "violet",
  "indigo",
  "fuchsia",
]);

function resolveMapelBadgeVariant(warna?: string | null): BadgeVariant {
  if (warna && VALID_BADGE_VARIANTS.has(warna)) {
    return warna as BadgeVariant;
  }
  return "emerald";
}

const VIEW_MODE_STORAGE_KEY = "alazhar_guru_mapel_view_mode";
const VIEW_MODE_EVENT = "guru-mapel-view-mode-change";

function subscribeViewMode(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(VIEW_MODE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(VIEW_MODE_EVENT, callback);
  };
}

function getViewModeSnapshot(): "card" | "table" {
  try {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (saved === "card" || saved === "table") {
      return saved;
    }
  } catch {
    // Ignore localStorage errors
  }
  return "table";
}

function getServerViewModeSnapshot(): "card" | "table" {
  return "table";
}

export interface ScheduleItemData {
  id: string;
  kelasId: string;
  kelasNama: string;
  jenjang: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  mapelWarna: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  meetingsCount: number;
  tasksCount: number;
  pendingGradingCount?: number;
}

interface GuruMapelTableProps {
  schedules: ScheduleItemData[];
}

export function GuruMapelTable({ schedules }: GuruMapelTableProps) {
  const viewMode = useSyncExternalStore(
    subscribeViewMode,
    getViewModeSnapshot,
    getServerViewModeSnapshot
  );
  const [search, setSearch] = useState("");
  const [selectedHari, setSelectedHari] = useState<string>("all");

  const handleViewModeChange = (mode: "card" | "table") => {
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
      window.dispatchEvent(new Event(VIEW_MODE_EVENT));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Unique days present in schedules
  const availableDays = useMemo(() => {
    const daysOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const foundDays = new Set(schedules.map((s) => s.hari));
    return daysOrder.filter((d) => foundDays.has(d));
  }, [schedules]);

  // Filtered schedules based on search and selected day
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.mapelNama.toLowerCase().includes(q) ||
        s.mapelKode.toLowerCase().includes(q) ||
        s.kelasNama.toLowerCase().includes(q) ||
        s.jenjang.toLowerCase().includes(q) ||
        s.hari.toLowerCase().includes(q);

      const matchHari =
        selectedHari === "all" || s.hari.toLowerCase() === selectedHari.toLowerCase();

      return matchSearch && matchHari;
    });
  }, [schedules, search, selectedHari]);

  return (
    <div className="space-y-4">
      {/* Toolbar: Search, Day Filter, and Card/Table View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left side: Search & Day Filter */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari mata pelajaran, kelas, atau hari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-background border-border"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Hari Tabs */}
          {availableDays.length > 1 && (
            <div className="inline-flex rounded-xl bg-muted/60 p-1 border border-border/60 text-xs font-medium gap-1 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setSelectedHari("all")}
                className={`rounded-lg px-2.5 py-1 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedHari === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua Hari
              </button>
              {availableDays.map((hari) => (
                <button
                  key={hari}
                  type="button"
                  onClick={() => setSelectedHari(hari)}
                  className={`rounded-lg px-2.5 py-1 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    selectedHari.toLowerCase() === hari.toLowerCase()
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {hari}
                </button>
              ))}
            </div>
          )}

          {/* Reset button if filter is active */}
          {(search || selectedHari !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedHari("all");
              }}
              className="text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground rounded-xl"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Right side: View Mode Toggle Pill (Card vs Table) */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-xs text-muted-foreground font-medium sm:hidden">
            Tampilan:
          </span>
          <div className="inline-flex items-center p-1 bg-muted/80 dark:bg-muted/60 rounded-full border border-border/60 shadow-xs">
            <button
              type="button"
              onClick={() => handleViewModeChange("card")}
              title="Tampilan Card"
              aria-label="Tampilan Card"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === "card"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("table")}
              title="Tampilan Tabel"
              aria-label="Tampilan Tabel"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Card View vs Table View */}
      {filteredSchedules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="text-base font-bold text-foreground">
            Tidak Ada Mata Pelajaran yang Sesuai
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || selectedHari !== "all"
              ? "Coba sesuaikan kata kunci pencarian atau ganti filter hari Anda."
              : "Jadwal mengajar untuk akun ini belum didaftarkan oleh administrator."}
          </p>
          {(search || selectedHari !== "all") && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedHari("all");
                }}
                className="text-xs rounded-xl"
              >
                Tampilkan Semua Pelajaran
              </Button>
            </div>
          )}
        </div>
      ) : viewMode === "card" ? (
        /* CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredSchedules.map((sch) => {
            const pendingGrading = sch.pendingGradingCount || 0;
            return (
              <LiquidGlassCard
                key={sch.id}
                borderRadius="28px"
                blurIntensity="xl"
                shadowIntensity="md"
                glowIntensity="sm"
                draggable={false}
                className="p-5 bg-card/75 dark:bg-card/45 border border-white/50 dark:border-white/10 group flex flex-col justify-between hover:border-primary/50 transition-all duration-200 shadow-2xl"
              >
                <div className="space-y-3">
                  {/* Row 1: Kode Badge & Day Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={resolveMapelBadgeVariant(sch.mapelWarna)}
                      size="xs"
                      className="font-bold font-mono uppercase tracking-wider"
                    >
                      {sch.mapelKode}
                    </Badge>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{sch.hari}</span>
                    </div>
                  </div>

                  {/* Row 2: Subject Name */}
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {sch.mapelNama}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        {sch.jamMulai} - {sch.jamSelesai} WIB
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Class / Rombel Info */}
                  <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-border/60">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {sch.kelasNama}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Rombel / Kelas • Jenjang {sch.jenjang}
                      </p>
                    </div>
                    <Badge
                      variant={sch.jenjang === "SMP" ? "smp" : "amber"}
                      size="xs"
                      className="font-bold shrink-0"
                    >
                      {sch.jenjang}
                    </Badge>
                  </div>

                  {/* Row 4: Meetings & Tasks Indicator */}
                  {(pendingGrading > 0 || sch.meetingsCount > 0 || sch.tasksCount > 0) && (
                    <div className="pt-1">
                      {pendingGrading > 0 ? (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>Penilaian Tugas</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-[11px] font-bold">
                            {pendingGrading} Perlu Dinilai
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {sch.meetingsCount} Pertemuan • {sch.tasksCount} Tugas
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="grid grid-cols-2 gap-2 pt-4 mt-3 border-t border-border/60">
                  <Link
                    href={`/guru/mapel/${sch.mapelId}?kelasId=${sch.kelasId}&tab=materi`}
                    className="w-full"
                  >
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs font-bold gap-1.5 rounded-xl"
                      title="Buka modul materi pertemuan belajar"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Materi</span>
                    </Button>
                  </Link>

                  <Link
                    href={`/guru/mapel/${sch.mapelId}?kelasId=${sch.kelasId}&tab=tugas`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs font-semibold rounded-xl hover:border-primary/40 gap-1.5 justify-center"
                      title="Lihat daftar tugas dan penilaian siswa"
                    >
                      <ListTodo className="h-3.5 w-3.5 text-primary" />
                      <span>Tugas</span>
                      {pendingGrading > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                          {pendingGrading}
                        </span>
                      )}
                    </Button>
                  </Link>
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-3xl card-elevation overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/30 backdrop-blur-xs">
              <TableRow className="border-b border-border/80">
                <TableHead className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  No
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[200px]">
                  Mata Pelajaran
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[170px]">
                  Rombel / Kelas
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[180px]">
                  Jadwal
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[180px]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.map((sch, idx) => {
                const pendingGrading = sch.pendingGradingCount || 0;
                return (
                  <TableRow
                    key={sch.id}
                    className="group hover:bg-muted/40 transition-colors border-b border-border/60"
                  >
                    {/* No */}
                    <TableCell className="text-center text-xs font-medium text-muted-foreground/80 py-3.5">
                      {idx + 1}
                    </TableCell>

                    {/* Mata Pelajaran */}
                    <TableCell className="py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/guru/mapel/${sch.mapelId}?kelasId=${sch.kelasId}&tab=materi`}
                            className="text-sm font-bold text-foreground leading-tight hover:text-primary group-hover:text-primary transition-colors"
                          >
                            {sch.mapelNama}
                          </Link>
                          {pendingGrading > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold shrink-0">
                              {pendingGrading} Perlu Dinilai
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={resolveMapelBadgeVariant(sch.mapelWarna)}
                          size="xs"
                          className="font-bold font-mono uppercase"
                        >
                          {sch.mapelKode}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Rombel / Kelas */}
                    <TableCell className="py-3.5">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-semibold text-foreground leading-tight truncate">
                          {sch.kelasNama}
                        </p>
                        <Badge
                          variant={sch.jenjang === "SMP" ? "smp" : "amber"}
                          size="xs"
                          className="font-bold"
                        >
                          Jenjang {sch.jenjang}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Jadwal */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div>
                          <span className="font-semibold text-primary">{sch.hari}</span>
                          <span className="text-muted-foreground"> • </span>
                          <span className="text-muted-foreground text-[11px]">
                            {sch.jamMulai} - {sch.jamSelesai}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Aksi: 2 Buttons */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/guru/mapel/${sch.mapelId}?kelasId=${sch.kelasId}&tab=materi`}
                        >
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs font-bold gap-1.5 rounded-xl"
                            title="Buka modul materi pertemuan belajar"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Materi</span>
                          </Button>
                        </Link>

                        <Link
                          href={`/guru/mapel/${sch.mapelId}?kelasId=${sch.kelasId}&tab=tugas`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold rounded-xl hover:border-primary/40 gap-1.5"
                            title="Lihat daftar tugas dan penilaian siswa"
                          >
                            <ListTodo className="h-3.5 w-3.5 text-primary" />
                            <span>Tugas</span>
                            {pendingGrading > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                {pendingGrading}
                              </span>
                            )}
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer */}
      {filteredSchedules.length > 0 && (
        <div className="text-[11px] text-muted-foreground px-1 flex items-center justify-between">
          <span>
            Menampilkan {filteredSchedules.length} dari {schedules.length} jadwal mengajar
          </span>
          <span className="capitalize text-[10px] bg-muted/60 px-2 py-0.5 rounded-md">
            Mode: {viewMode === "card" ? "Kartu (Grid)" : "Tabel"}
          </span>
        </div>
      )}
    </div>
  );
}
