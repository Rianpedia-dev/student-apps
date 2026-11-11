"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  FileCheck,
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
  return (
    <div className="space-y-5">
      {/* Empty State */}
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
      ) : (
        /* Daftar Kartu Tugas */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {allTasks.map((task) => {
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
                          <span>Nilai: {task.nilai ?? 0} / {task.poinMaksimal} </span>
                        </>
                      ) : task.isPending ? (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>Sedang Dinilai</span>
                        </>
                      ) : isLate ? (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          <span>Terlambat</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          <span>Belum Dikerjakan</span>
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
                </div>

                {/* Bottom Action Row */}
                <div className="pt-3.5 border-t border-border/60 flex justify-end">
                  <Link
                    href={
                      task.isGraded && task.tipePengerjaan !== "LEMBAR_KERJA"
                        ? `/siswa/tugas/${task.id}/hasil`
                        : `/siswa/tugas/${task.id}`
                    }
                  >
                    <Button
                      size="sm"
                      variant={task.isGraded ? "outline" : "default"}
                      className="h-8.5 px-4 text-xs font-bold rounded-xl gap-1.5 shadow-xs cursor-pointer"
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
