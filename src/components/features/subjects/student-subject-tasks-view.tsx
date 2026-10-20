"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ListTodo,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  X,
  FileCheck,
  FolderOpen,
  Award,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface StudentTaskItem {
  id: string;
  judul: string;
  deskripsi?: string | null;
  deadline: string;
  poinMaksimal: number;
  tipePengerjaan?: string;
  pertemuanKe?: number | null;
  totalSoal?: number;
  durasiMenit?: number | null;
  isGraded: boolean;
  isPending: boolean;
  submissionStatus?: string;
  nilai?: number | null;
}

interface StudentSubjectTasksViewProps {
  mapel: {
    id: string;
    kodeMapel: string;
    namaMapel: string;
    warna?: string | null;
  };
  studentClass: string;
  tasks: StudentTaskItem[];
}

export function StudentSubjectTasksView({
  mapel,
  studentClass,
  tasks: allTasks,
}: StudentSubjectTasksViewProps) {
  const [taskFilter, setTaskFilter] = useState<"all" | "todo" | "pending" | "graded">("all");
  const [taskSearch, setTaskSearch] = useState("");

  const unsubmittedCount = useMemo(() => {
    return allTasks.filter((t) => !t.isGraded && !t.isPending).length;
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (taskFilter === "todo" && (t.isGraded || t.isPending)) return false;
      if (taskFilter === "pending" && !t.isPending) return false;
      if (taskFilter === "graded" && !t.isGraded) return false;

      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        const matchTitle = t.judul.toLowerCase().includes(q);
        const matchDesc = t.deskripsi?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [allTasks, taskFilter, taskSearch]);

  return (
    <div className="space-y-5">
      {/* 1. Header & Quick Stats */}
      {allTasks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl p-3.5 bg-card/80 border border-border/70 backdrop-blur-xs flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ListTodo className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Total Tugas</p>
              <p className="text-lg font-extrabold text-foreground">{allTasks.length}</p>
            </div>
          </div>

          <div className="rounded-2xl p-3.5 bg-card/80 border border-border/70 backdrop-blur-xs flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Perlu Dikerjakan</p>
              <p className="text-lg font-extrabold text-foreground">{unsubmittedCount}</p>
            </div>
          </div>

          <div className="rounded-2xl p-3.5 bg-card/80 border border-border/70 backdrop-blur-xs flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Sedang Diperiksa</p>
              <p className="text-lg font-extrabold text-foreground">
                {allTasks.filter((t) => t.isPending).length}
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-3.5 bg-card/80 border border-border/70 backdrop-blur-xs flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Selesai & Dinilai</p>
              <p className="text-lg font-extrabold text-foreground">
                {allTasks.filter((t) => t.isGraded).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Toolbar: Filter Pills & Search */}
      {allTasks.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/75 dark:bg-card/45 backdrop-blur-xl p-3.5 rounded-2xl border border-white/50 dark:border-white/10 shadow-xs">
          {/* Filter Pills */}
          <div className="inline-flex rounded-xl bg-muted/60 p-1 border border-border/60 text-xs font-medium gap-1 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setTaskFilter("all")}
              className={`rounded-lg px-2.5 py-1 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap ${
                taskFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({allTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setTaskFilter("todo")}
              className={`rounded-lg px-2.5 py-1 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap ${
                taskFilter === "todo"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Perlu Dikerjakan ({unsubmittedCount})
            </button>
            <button
              type="button"
              onClick={() => setTaskFilter("pending")}
              className={`rounded-lg px-2.5 py-1 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap ${
                taskFilter === "pending"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sedang Diperiksa ({allTasks.filter((t) => t.isPending).length})
            </button>
            <button
              type="button"
              onClick={() => setTaskFilter("graded")}
              className={`rounded-lg px-2.5 py-1 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap ${
                taskFilter === "graded"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sudah Dinilai ({allTasks.filter((t) => t.isGraded).length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari tugas..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              className="w-full h-8.5 pl-8 pr-7 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            {taskSearch && (
              <button
                type="button"
                onClick={() => setTaskSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Empty States */}
      {allTasks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-card border border-border text-muted-foreground space-y-4 shadow-xs">
          <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            <FileCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              Alhamdulillah, Belum Ada Tugas untuk Mata Pelajaran Ini
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ustadz/Ustadzah belum memberikan tugas atau latihan untuk mata pelajaran {mapel.namaMapel} kelas {studentClass}. Silakan fokus membaca dan memahami modul materi pertemuan yang tersedia!
            </p>
          </div>
          <div className="pt-2">
            <Link href={`/siswa/mapel/${mapel.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>Buka Modul & Materi Pembelajaran</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-card border border-border text-muted-foreground space-y-3">
          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <p className="text-sm font-bold text-foreground">Tugas Tidak Ditemukan</p>
          <p className="text-xs max-w-sm mx-auto">
            Tidak ada tugas yang sesuai dengan filter atau kata kunci pencarian Anda.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTaskFilter("all");
              setTaskSearch("");
            }}
            className="mt-2 text-xs rounded-xl cursor-pointer"
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        /* 4. Daftar Kartu Tugas */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredTasks.map((task) => {
            const deadlineDate = new Date(task.deadline);
            const isLate = new Date() > deadlineDate;
            const deadlineFormatted = deadlineDate.toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={task.id}
                className="rounded-3xl bg-card/85 dark:bg-card/45 backdrop-blur-sm border border-border/80 p-5 sm:p-6 flex flex-col justify-between hover:border-primary/50 hover:shadow-lg transition-all duration-200 card-elevation space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Row 1: Badges & Deadline */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Status Badge */}
                    <Badge
                      variant={
                        task.isGraded
                          ? "success"
                          : task.isPending
                          ? "sky"
                          : isLate
                          ? "destructive"
                          : "amber"
                      }
                      size="xs"
                      className="font-bold gap-1"
                    >
                      {task.isGraded ? (
                        <>
                          <Award className="h-3 w-3" />
                          <span>Nilai: {task.nilai ?? 0} / {task.poinMaksimal} ⭐</span>
                        </>
                      ) : task.isPending ? (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>Sedang Dinilai ⏳</span>
                        </>
                      ) : isLate ? (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          <span>Terlambat ⚠️</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          <span>Belum Dikerjakan 🚀</span>
                        </>
                      )}
                    </Badge>

                    {/* Deadline Badge */}
                    <span
                      className={`text-[11px] flex items-center gap-1.5 font-medium px-2.5 py-0.5 rounded-full ${
                        isLate && !task.isGraded && !task.isPending
                          ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 font-bold"
                          : "text-muted-foreground bg-muted/50"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>Tenggat: {deadlineFormatted}</span>
                    </span>
                  </div>

                  {/* Row 2: Title */}
                  <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {task.judul}
                  </h3>

                  {/* Row 3: Description */}
                  {task.deskripsi && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                      {task.deskripsi}
                    </p>
                  )}

                  {/* Row 4: Meta chips (Pertemuan, Tipe) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {task.pertemuanKe && (
                      <Badge variant="outline" size="xs" className="font-medium text-muted-foreground">
                        Pertemuan {task.pertemuanKe}
                      </Badge>
                    )}
                    <Badge variant="teal" size="xs" className="font-medium">
                      {task.tipePengerjaan === "LEMBAR_KERJA"
                        ? "Lembar Kerja Siswa"
                        : `Kuis Interaktif${task.totalSoal && task.totalSoal > 0 ? ` (${task.totalSoal} Soal)` : ""}`}
                    </Badge>
                    {task.durasiMenit && (
                      <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md font-medium">
                        ⏱️ {task.durasiMenit} Menit
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-3.5 border-t border-border/60 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Maksimal {task.poinMaksimal} Poin
                  </span>

                  <Link href={`/siswa/tugas/${task.id}`}>
                    <Button
                      size="sm"
                      variant={task.isGraded ? "outline" : "default"}
                      className="h-8.5 text-xs font-bold rounded-xl gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>
                        {task.isGraded
                          ? "Lihat Evaluasi & Nilai"
                          : task.isPending
                          ? "Buka Jawaban"
                          : "Mulai Kerjakan"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
