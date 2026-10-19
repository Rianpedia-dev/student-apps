"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getDeadlineInfo } from "@/lib/task-status";
import { LayoutGrid, Table as TableIcon, Clock, ArrowRight, BookOpen } from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/liquid-weather-glass";

export interface StudentTaskItem {
  id: string;
  judul: string;
  deskripsi: string;
  mapelNama: string;
  guruNama: string;
  deadline: string;
  poinMaksimal: number;
  tipePengerjaan?: string;
  tampilkanNilaiInstan?: boolean;
  submission?: {
    status: string;
    nilai: number | null;
    submittedAt: string;
    catatanGuru?: string | null;
  } | null;
}

interface StudentTaskQuestListProps {
  tasks: StudentTaskItem[];
}

/** Maps a submission record to status string */
function resolveStatus(task: StudentTaskItem): string {
  if (!task.submission) return "belum_mengumpulkan";
  return task.submission.status;
}

/** Determines CTA target URL */
function getTaskHref(task: StudentTaskItem): string {
  const status = resolveStatus(task);
  if (task.tipePengerjaan === "LEMBAR_KERJA") {
    return `/siswa/tugas/${task.id}`;
  }
  if (status === "sudah_dinilai" || status === "selesai") {
    return `/siswa/tugas/${task.id}/hasil`;
  }
  return `/siswa/tugas/${task.id}`;
}

/** Returns the CTA button label */
function getCtaLabel(status: string): string {
  switch (status) {
    case "sudah_dinilai":
    case "selesai":
      return "Lihat Nilai";
    case "sedang_mengerjakan":
      return "Lanjutkan";
    case "menunggu_penilaian":
    case "terlambat":
      return "Lihat Jawaban";
    case "perlu_revisi":
      return "Perbaiki";
    default:
      return "Kerjakan";
  }
}

/** Render status badge cleanly without visual noise */
function renderStatusBadge(task: StudentTaskItem, isLate: boolean) {
  const status = resolveStatus(task);

  if (status === "sudah_dinilai" || status === "selesai") {
    const nilai = task.submission?.nilai;
    const hideScore = task.tampilkanNilaiInstan === false;
    return (
      <Badge
        variant="outline"
        className="font-bold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      >
        {!hideScore && nilai != null ? `Nilai: ${nilai}` : "Selesai"}
      </Badge>
    );
  }

  if (status === "menunggu_penilaian") {
    return (
      <Badge variant="secondary" className="text-xs font-medium">
        Diperiksa
      </Badge>
    );
  }

  if (status === "sedang_mengerjakan") {
    return (
      <Badge
        variant="outline"
        className="text-xs font-medium border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
      >
        Sedang Dikerjakan
      </Badge>
    );
  }

  if (status === "perlu_revisi") {
    return (
      <Badge variant="destructive" className="text-xs font-medium">
        Perlu Revisi
      </Badge>
    );
  }

  if (isLate) {
    return (
      <Badge variant="destructive" className="text-xs font-medium">
        Terlambat
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs font-medium text-muted-foreground">
      Belum Dikerjakan
    </Badge>
  );
}

export function StudentTaskQuestList({ tasks }: StudentTaskQuestListProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("alazhar_siswa_tugas_view_mode");
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
      localStorage.setItem("alazhar_siswa_tugas_view_mode", mode);
    } catch {
      // Ignore localStorage errors
    }
  };

  const counts = useMemo(() => {
    let belum = 0;
    let menunggu = 0;
    let dinilai = 0;
    for (const t of tasks) {
      const s = resolveStatus(t);
      if (!t.submission || s === "sedang_mengerjakan" || s === "perlu_revisi") belum++;
      else if (s === "menunggu_penilaian" || s === "terlambat") menunggu++;
      else if (s === "sudah_dinilai" || s === "selesai") dinilai++;
    }
    return { belum, menunggu, dinilai };
  }, [tasks]);

  const filterTasks = (tab: string) => {
    return tasks.filter((task) => {
      const s = resolveStatus(task);
      if (tab === "belum") {
        if (task.submission && s !== "sedang_mengerjakan" && s !== "perlu_revisi") return false;
      }
      if (tab === "menunggu") {
        if (s !== "menunggu_penilaian" && s !== "terlambat") return false;
      }
      if (tab === "dinilai") {
        if (s !== "sudah_dinilai" && s !== "selesai") return false;
      }
      return true;
    });
  };

  const renderTaskTable = (tab: string) => {
    const filtered = filterTasks(tab);

    return (
      <div
        className="rounded-2xl border border-white/50 dark:border-white/10 bg-card/65 dark:bg-card/45 backdrop-blur-xl shadow-sm overflow-hidden"
        style={{
          boxShadow:
            "inset 1.5px 1.5px 2px 0 rgba(255, 255, 255, 0.45), inset -1.5px -1.5px 2px 0 rgba(255, 255, 255, 0.25)",
        }}
      >
        <Table className="w-full">
          <TableHeader className="bg-muted/30 backdrop-blur-xs border-b border-border/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                No
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[160px]">
                Mata Pelajaran
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[200px]">
                Judul Tugas
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[140px]">
                Batas Waktu
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-center min-w-[130px]">
                Status
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-center min-w-[120px]">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-36 text-center text-muted-foreground">
                  <p className="text-sm font-semibold text-foreground">
                    {tab === "belum"
                      ? "Alhamdulillah, tidak ada tugas yang belum selesai!"
                      : "Tidak ada tugas pada kategori ini."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tab === "belum"
                      ? "Semua tugas telah dikerjakan dengan baik."
                      : "Silakan pilih tab kategori lainnya untuk melihat tugas Anda."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((task, index) => {
                const status = resolveStatus(task);
                const { label: deadlineLabel, isLate } = getDeadlineInfo(task.deadline);
                const href = getTaskHref(task);
                const isPendingWork =
                  status === "belum_mengumpulkan" ||
                  status === "sedang_mengerjakan" ||
                  status === "perlu_revisi";

                return (
                  <TableRow
                    key={task.id}
                    className="hover:bg-muted/30 transition-colors border-b border-border/60"
                  >
                    {/* Nomor Urut */}
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    {/* Mata Pelajaran */}
                    <TableCell>
                      <span className="font-semibold text-xs sm:text-sm text-foreground block">
                        {task.mapelNama}
                      </span>
                    </TableCell>

                    {/* Judul Tugas */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={href}
                            className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors block leading-snug"
                          >
                            {task.judul}
                          </Link>
                          {task.tipePengerjaan === "LEMBAR_KERJA" && (
                            <Badge variant="emerald" size="sm" className="text-[10px] py-0 px-1.5 h-4">
                              Berkas
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Batas Waktu */}
                    <TableCell>
                      <span
                        className={`text-xs font-medium ${
                          isLate && isPendingWork
                            ? "text-rose-600 dark:text-rose-400 font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {deadlineLabel}
                      </span>
                    </TableCell>

                    {/* Status / Nilai */}
                    <TableCell className="text-center">
                      {renderStatusBadge(task, isLate)}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-center">
                      <Link href={href}>
                        <Button
                          size="sm"
                          variant={isPendingWork ? "default" : "outline"}
                          className={`text-xs h-8 px-3.5 rounded-xl font-bold transition-all shadow-2xs ${
                            isPendingWork
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "border-border/80 hover:bg-muted hover:text-primary"
                          }`}
                        >
                          {getCtaLabel(status)}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderTaskCards = (tab: string) => {
    const filtered = filterTasks(tab);

    if (filtered.length === 0) {
      return (
        <div
          className="rounded-2xl border border-white/50 dark:border-white/10 bg-card/65 dark:bg-card/45 backdrop-blur-xl p-12 text-center shadow-sm"
          style={{
            boxShadow:
              "inset 1.5px 1.5px 2px 0 rgba(255, 255, 255, 0.45), inset -1.5px -1.5px 2px 0 rgba(255, 255, 255, 0.25)",
          }}
        >
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="text-base font-bold text-foreground">
            {tab === "belum"
              ? "Alhamdulillah, tidak ada tugas yang belum selesai!"
              : "Tidak ada tugas pada kategori ini."}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {tab === "belum"
              ? "Semua tugas telah dikerjakan dengan baik."
              : "Silakan pilih tab kategori lainnya untuk melihat tugas Anda."}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filtered.map((task) => {
          const status = resolveStatus(task);
          const { label: deadlineLabel, isLate } = getDeadlineInfo(task.deadline);
          const href = getTaskHref(task);
          const isPendingWork =
            status === "belum_mengumpulkan" ||
            status === "sedang_mengerjakan" ||
            status === "perlu_revisi";

          return (
            <LiquidGlassCard
              key={task.id}
              borderRadius="24px"
              blurIntensity="xl"
              shadowIntensity="sm"
              glowIntensity="sm"
              draggable={false}
              className="p-5 bg-card/65 dark:bg-card/45 border border-white/50 dark:border-white/10 group flex flex-col justify-between hover:border-primary/50 transition-all duration-200"
            >
              <div className="space-y-3">
                {/* Header: Mapel Badge & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span
                      className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full truncate max-w-[170px]"
                      title={task.mapelNama}
                    >
                      {task.mapelNama}
                    </span>
                    {task.tipePengerjaan === "LEMBAR_KERJA" && (
                      <Badge variant="emerald" size="sm" className="text-[10px] py-0 px-1.5 h-4 shrink-0">
                        Berkas
                      </Badge>
                    )}
                  </div>
                  <div className="shrink-0">
                    {renderStatusBadge(task, isLate)}
                  </div>
                </div>

                {/* Task Title & Description */}
                <div>
                  <Link
                    href={href}
                    className="font-bold text-sm sm:text-base text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 block"
                  >
                    {task.judul}
                  </Link>
                  {task.deskripsi && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {task.deskripsi}
                    </p>
                  )}
                </div>

                {/* Metadata Pills */}
                <div className="space-y-1.5 pt-1 text-xs">
                  {/* Deadline Info */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground text-[11px]">Batas Waktu:</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        isLate && isPendingWork
                          ? "text-rose-600 dark:text-rose-400 font-bold"
                          : "text-foreground/80"
                      }`}
                    >
                      {deadlineLabel}
                    </span>
                  </div>

                  {/* Teacher & Poin */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                    <span className="truncate text-muted-foreground/90 text-[11px]">
                      Guru: <strong className="text-foreground/80 font-medium">{task.guruNama}</strong>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-foreground/80 bg-muted/60 px-2 py-0.5 rounded-md shrink-0">
                      {task.poinMaksimal} Poin
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action CTA Button */}
              <div className="pt-4 mt-2 border-t border-border/50">
                <Link href={href} className="block w-full">
                  <Button
                    size="sm"
                    variant={isPendingWork ? "default" : "outline"}
                    className={`w-full text-xs h-9 rounded-xl font-bold transition-all shadow-2xs gap-1.5 ${
                      isPendingWork
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-border/80 hover:bg-muted hover:text-primary"
                    }`}
                  >
                    <span>{getCtaLabel(status)}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </LiquidGlassCard>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tabs Kategori Tugas & View Toggle */}
      <Tabs defaultValue="semua" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/65 dark:bg-card/45 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl border border-white/50 dark:border-white/10 shadow-xs">
          <TabsList className="p-1 bg-muted/70 dark:bg-muted/50 backdrop-blur-md rounded-xl border border-border/50 shadow-xs h-auto flex flex-wrap gap-1">
            <TabsTrigger value="semua" className="rounded-lg text-xs font-semibold px-3 py-1.5 cursor-pointer">
              Semua ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="belum" className="rounded-lg text-xs font-semibold px-3 py-1.5 cursor-pointer">
              Belum ({counts.belum})
            </TabsTrigger>
            <TabsTrigger value="menunggu" className="rounded-lg text-xs font-semibold px-3 py-1.5 cursor-pointer">
              Diperiksa ({counts.menunggu})
            </TabsTrigger>
            <TabsTrigger value="dinilai" className="rounded-lg text-xs font-semibold px-3 py-1.5 cursor-pointer">
              Selesai ({counts.dinilai})
            </TabsTrigger>
          </TabsList>

          {/* View Mode Toggle Pill (Card vs Table) */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 px-1 sm:px-0">
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

        <TabsContent value="semua">
          {viewMode === "card" ? renderTaskCards("semua") : renderTaskTable("semua")}
        </TabsContent>
        <TabsContent value="belum">
          {viewMode === "card" ? renderTaskCards("belum") : renderTaskTable("belum")}
        </TabsContent>
        <TabsContent value="menunggu">
          {viewMode === "card" ? renderTaskCards("menunggu") : renderTaskTable("menunggu")}
        </TabsContent>
        <TabsContent value="dinilai">
          {viewMode === "card" ? renderTaskCards("dinilai") : renderTaskTable("dinilai")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
