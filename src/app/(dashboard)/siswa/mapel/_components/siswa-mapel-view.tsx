"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LiquidGlassCard } from "@/components/ui/liquid-weather-glass";

export interface SiswaMapelItem {
  id: string;
  mapelId: string;
  namaMapel: string;
  kodeMapel: string;
  warna: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  guru: {
    id: string;
    name: string;
    image?: string | null;
    gender?: string | null;
  } | null;
  totalTasks: number;
  unsubmittedTasks: number;
}

interface SiswaMapelViewProps {
  schedules: SiswaMapelItem[];
  studentClass: string;
}
export function SiswaMapelView({ schedules, studentClass }: SiswaMapelViewProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [search, setSearch] = useState("");
  const [selectedHari, setSelectedHari] = useState<string>("all");

  // Restore view mode from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("alazhar_siswa_mapel_view_mode");
      if (saved === "table" || saved === "card") {
        setViewMode(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleViewModeChange = (mode: "card" | "table") => {
    setViewMode(mode);
    try {
      localStorage.setItem("alazhar_siswa_mapel_view_mode", mode);
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
        s.namaMapel.toLowerCase().includes(q) ||
        s.kodeMapel.toLowerCase().includes(q) ||
        (s.guru?.name && s.guru.name.toLowerCase().includes(q)) ||
        s.hari.toLowerCase().includes(q);

      const matchHari =
        selectedHari === "all" || s.hari.toLowerCase() === selectedHari.toLowerCase();

      return matchSearch && matchHari;
    });
  }, [schedules, search, selectedHari]);

  return (
    <div className="space-y-4">
      {/* Toolbar: Search, Day Filter, and Card/Table View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/75 dark:bg-card/45 backdrop-blur-xl p-3.5 sm:p-4 rounded-3xl border border-white/50 dark:border-white/10 shadow-xl">
        {/* Left side: Search & Day Filter */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari mata pelajaran, guru, atau hari..."
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
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
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
              : `Administrator belum mendaftarkan jadwal pelajaran untuk kelas ${studentClass || "Anda"}.`}
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
                      variant={(sch.warna as any) || "emerald"}
                      size="xs"
                      className="font-bold font-mono uppercase tracking-wider"
                    >
                      {sch.kodeMapel}
                    </Badge>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{sch.hari}</span>
                    </div>
                  </div>

                  {/* Row 2: Subject Name */}
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {sch.namaMapel}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        {sch.jamMulai} - {sch.jamSelesai} WIB
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Teacher Info */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-border/60">
                    <UserAvatar
                      src={sch.guru?.image}
                      gender={sch.guru?.gender}
                      name={sch.guru?.name || "Guru Pengampu"}
                      className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
                      previewable={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {sch.guru?.name || "Guru Pengampu"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Guru Pengampu
                      </p>
                    </div>
                  </div>

                  {/* Row 4: Tasks Status Indicator */}
                  {sch.totalTasks > 0 && (
                    <div className="pt-1">
                      {sch.unsubmittedTasks > 0 ? (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>Tugas Aktif</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-[11px] font-bold">
                            {sch.unsubmittedTasks} Belum Dikumpulkan
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Semua Tugas Selesai ({sch.totalTasks})</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="grid grid-cols-2 gap-2 pt-4 mt-3 border-t border-border/60">
                  <Link href={`/siswa/mapel/${sch.mapelId}`} className="w-full">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs font-bold gap-1.5 rounded-xl"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Materi</span>
                    </Button>
                  </Link>

                  <Link href={`/siswa/mapel/${sch.mapelId}/tugas`} className="w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs font-semibold rounded-xl hover:border-primary/40 gap-1.5 justify-center"
                    >
                      <ListTodo className="h-3.5 w-3.5 text-primary" />
                      <span>Tugas</span>
                      {sch.unsubmittedTasks > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                          {sch.unsubmittedTasks}
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
                  Guru Pengampu
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
                          <p className="text-sm font-bold text-foreground leading-tight">
                            {sch.namaMapel}
                          </p>
                          {sch.unsubmittedTasks > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold shrink-0">
                              {sch.unsubmittedTasks} Tugas
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={(sch.warna as any) || "emerald"}
                          size="xs"
                          className="font-bold font-mono uppercase"
                        >
                          {sch.kodeMapel}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Guru Pengampu */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          src={sch.guru?.image}
                          gender={sch.guru?.gender}
                          name={sch.guru?.name || "Guru Pengampu"}
                          className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
                          previewable={false}
                        />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {sch.guru?.name || "Guru Pengampu"}
                        </span>
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
                        <Link href={`/siswa/mapel/${sch.mapelId}`}>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs font-bold gap-1.5 rounded-xl"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Materi</span>
                          </Button>
                        </Link>

                        <Link href={`/siswa/mapel/${sch.mapelId}/tugas`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold rounded-xl hover:border-primary/40 gap-1.5"
                          >
                            <ListTodo className="h-3.5 w-3.5 text-primary" />
                            <span>Tugas</span>
                            {sch.unsubmittedTasks > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                {sch.unsubmittedTasks}
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
            Menampilkan {filteredSchedules.length} dari {schedules.length} mata pelajaran terjadwal untuk kelas {studentClass || "Anda"}
          </span>
          <span className="capitalize text-[10px] bg-muted/60 px-2 py-0.5 rounded-md">
            Mode: {viewMode === "card" ? "Kartu (Grid)" : "Tabel"}
          </span>
        </div>
      )}
    </div>
  );
}
