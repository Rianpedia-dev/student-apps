"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Clock, Search, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getStatusConfig, getDeadlineInfo } from "@/lib/task-status";

export interface StudentTaskItem {
  id: string;
  judul: string;
  deskripsi: string;
  mapelNama: string;
  guruNama: string;
  deadline: string;
  poinMaksimal: number;
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

/** Maps a submission record to the appropriate status string */
function resolveStatus(task: StudentTaskItem): string {
  if (!task.submission) return "belum_mengumpulkan";
  return task.submission.status;
}

/** Determines the correct CTA link based on task status */
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

export function StudentTaskQuestList({ tasks }: StudentTaskQuestListProps) {
  const [searchQuery, setSearchQuery] = useState("");

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
      // Tab filter
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

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          task.judul.toLowerCase().includes(q) ||
          task.mapelNama.toLowerCase().includes(q) ||
          task.guruNama.toLowerCase().includes(q)
        );
      }

      return true;
    });
  };

  const renderTaskList = (tab: string) => {
    const filtered = filterTasks(tab);

    if (filtered.length === 0) {
      return (
        <Card>
          <CardContent className="py-14 text-center space-y-2">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              {tab === "belum" ? "Semua tugas sudah selesai!" : "Tidak ada tugas di kategori ini."}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {tab === "belum"
                ? "Alhamdulillah, tidak ada tugas yang perlu dikerjakan."
                : "Coba ubah kata kunci pencarian atau pilih tab lain."}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((task) => {
          const status = resolveStatus(task);
          const config = getStatusConfig(status);
          const { label: deadlineLabel, isLate } = getDeadlineInfo(task.deadline);
          const href = getTaskHref(task);
          const StatusIcon = config.icon;

          return (
            <Card key={task.id} enableHover className="flex flex-col justify-between">
              <CardContent className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col">
                {/* Top: Subject + Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground truncate flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    {task.mapelNama}
                  </span>

                  <Badge variant={config.variant} size="sm" className="gap-1 shrink-0">
                    <StatusIcon className="h-3 w-3" />
                    <span>
                      {status === "sudah_dinilai" && task.submission?.nilai != null
                        ? `Nilai: ${task.submission.nilai}`
                        : config.label}
                    </span>
                  </Badge>
                </div>

                {/* Title */}
                <Link href={href} className="block flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-2 leading-snug hover:text-primary transition-colors">
                    {task.judul}
                  </h3>
                </Link>

                {/* Bottom: Deadline + CTA */}
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-xs flex items-center gap-1.5 truncate ${isLate ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {deadlineLabel}
                  </span>

                  <Link href={href} className="shrink-0">
                    <Button size="sm" variant={status === "sudah_dinilai" || status === "selesai" ? "outline" : "default"} className="text-xs h-8 rounded-lg font-semibold">
                      {getCtaLabel(status)}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari tugas atau mata pelajaran..."
          className="pl-9 pr-8 h-10 text-sm rounded-lg"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabs + Content */}
      <Tabs defaultValue="semua">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="semua">Semua ({tasks.length})</TabsTrigger>
          <TabsTrigger value="belum">Belum ({counts.belum})</TabsTrigger>
          <TabsTrigger value="menunggu">Diperiksa ({counts.menunggu})</TabsTrigger>
          <TabsTrigger value="dinilai">Tuntas ({counts.dinilai})</TabsTrigger>
        </TabsList>

        <TabsContent value="semua">{renderTaskList("semua")}</TabsContent>
        <TabsContent value="belum">{renderTaskList("belum")}</TabsContent>
        <TabsContent value="menunggu">{renderTaskList("menunggu")}</TabsContent>
        <TabsContent value="dinilai">{renderTaskList("dinilai")}</TabsContent>
      </Tabs>
    </div>
  );
}
