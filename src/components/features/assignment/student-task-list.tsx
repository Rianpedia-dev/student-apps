"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clock, CheckCircle2, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface StudentTaskListProps {
  tasks: StudentTaskItem[];
}

export function StudentTaskList({ tasks }: StudentTaskListProps) {
  const [activeTab, setActiveTab] = useState<"semua" | "belum" | "menunggu" | "dinilai">("semua");

  const pendingTasks = tasks.filter((t) => !t.submission || t.submission.status === "perlu_revisi");
  const waitingTasks = tasks.filter(
    (t) => t.submission && (t.submission.status === "menunggu_penilaian" || t.submission.status === "terlambat")
  );
  const gradedTasks = tasks.filter((t) => t.submission && t.submission.status === "sudah_dinilai");

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "belum") return !task.submission || task.submission.status === "perlu_revisi";
    if (activeTab === "menunggu") {
      return task.submission && (task.submission.status === "menunggu_penilaian" || task.submission.status === "terlambat");
    }
    if (activeTab === "dinilai") return task.submission && task.submission.status === "sudah_dinilai";
    return true;
  });

  const formatDeadline = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Filter Sederhana */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
        <button
          onClick={() => setActiveTab("semua")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "semua"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Semua ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab("belum")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "belum"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span>Belum Dikerjakan</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === "belum" ? "bg-white/20" : "bg-amber-500/10 text-amber-600"
          }`}>
            {pendingTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("menunggu")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "menunggu"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span>Menunggu Nilai</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === "menunggu" ? "bg-white/20" : "bg-blue-500/10 text-blue-600"
          }`}>
            {waitingTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("dinilai")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "dinilai"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span>Sudah Dinilai</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === "dinilai" ? "bg-white/20" : "bg-emerald-500/10 text-emerald-600"
          }`}>
            {gradedTasks.length}
          </span>
        </button>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-card border border-border">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-foreground">Tidak Ada Tugas</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTab === "belum"
              ? "Semua tugas sudah dikerjakan!"
              : activeTab === "menunggu"
              ? "Tidak ada tugas yang sedang menunggu nilai."
              : activeTab === "dinilai"
              ? "Belum ada tugas yang dinilai."
              : "Belum ada tugas yang ditugaskan saat ini."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const sub = task.submission;
            const isGraded = sub?.status === "sudah_dinilai";
            const isRevision = sub?.status === "perlu_revisi";
            const isPending = sub?.status === "menunggu_penilaian" || sub?.status === "terlambat";
            const isSubmitted = !!sub;

            return (
              <div
                key={task.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-primary/40 transition-colors"
              >
                <div className="space-y-3">
                  {/* Top: Mapel & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">
                      {task.mapelNama}
                    </span>

                    {isGraded ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Nilai: {sub.nilai} / {task.poinMaksimal}
                      </span>
                    ) : isRevision ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Perlu Revisi
                      </span>
                    ) : isPending ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Menunggu Nilai
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Belum Dikerjakan
                      </span>
                    )}
                  </div>

                  {/* Judul Tugas */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                      {task.judul}
                    </h3>
                  </div>
                </div>

                {/* Footer Info & Action */}
                <div className="pt-3 mt-4 border-t border-border flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Tenggat: {formatDeadline(task.deadline)}</span>
                    </div>
                    <div>Guru: {task.guruNama}</div>
                  </div>

                  <Link href={`/siswa/tugas/${task.id}`}>
                    <Button
                      size="sm"
                      variant={isGraded ? "outline" : "default"}
                      className="text-xs h-8 px-3 rounded-lg gap-1 font-semibold"
                    >
                      <span>
                        {isGraded
                          ? "Lihat Nilai"
                          : isRevision
                          ? "Perbaiki Tugas"
                          : isPending
                          ? "Lihat Tugas"
                          : "Kerjakan"}
                      </span>
                      <ArrowRight className="h-3 w-3" />
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
