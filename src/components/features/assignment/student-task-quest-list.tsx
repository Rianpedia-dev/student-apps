"use client";

import React, { useMemo } from "react";
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

export interface StudentTaskItem {
  id: string;
  judul: string;
  deskripsi: string;
  mapelNama: string;
  guruNama: string;
  deadline: string;
  poinMaksimal: number;
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
      <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-muted/40 border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                No
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[160px]">
                Mata Pelajaran
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[220px]">
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
                      <span className="font-semibold text-xs sm:text-sm text-foreground">
                        {task.mapelNama}
                      </span>
                    </TableCell>

                    {/* Judul Tugas */}
                    <TableCell>
                      <Link
                        href={href}
                        className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors block leading-snug"
                      >
                        {task.judul}
                      </Link>
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

  return (
    <div className="space-y-4">
      {/* Tabs Kategori Tugas */}
      <Tabs defaultValue="semua" className="space-y-4">
        <TabsList className="w-full sm:w-auto p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="semua" className="rounded-lg text-xs font-semibold">
            Semua ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="belum" className="rounded-lg text-xs font-semibold">
            Belum ({counts.belum})
          </TabsTrigger>
          <TabsTrigger value="menunggu" className="rounded-lg text-xs font-semibold">
            Diperiksa ({counts.menunggu})
          </TabsTrigger>
          <TabsTrigger value="dinilai" className="rounded-lg text-xs font-semibold">
            Selesai ({counts.dinilai})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="semua">{renderTaskTable("semua")}</TabsContent>
        <TabsContent value="belum">{renderTaskTable("belum")}</TabsContent>
        <TabsContent value="menunggu">{renderTaskTable("menunggu")}</TabsContent>
        <TabsContent value="dinilai">{renderTaskTable("dinilai")}</TabsContent>
      </Tabs>
    </div>
  );
}
