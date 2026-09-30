"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  Sparkles,
  Trophy,
  BookOpen,
  Calendar,
  Compass,
} from "lucide-react";
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

interface StudentTaskQuestListProps {
  tasks: StudentTaskItem[];
  studentName?: string;
}

export function StudentTaskQuestList({ tasks, studentName }: StudentTaskQuestListProps) {
  const [activeTab, setActiveTab] = useState<"belum" | "menunggu" | "dinilai">(() => {
    if (tasks.some((t) => !t.submission || t.submission.status === "perlu_revisi")) return "belum";
    if (tasks.some((t) => t.submission && (t.submission.status === "menunggu_penilaian" || t.submission.status === "terlambat"))) return "menunggu";
    if (tasks.some((t) => t.submission && t.submission.status === "sudah_dinilai")) return "dinilai";
    return "belum";
  });

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
    return false;
  });

  const getMapelIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("matematika") || lower.includes("math")) return "📐";
    if (lower.includes("agama") || lower.includes("pai") || lower.includes("qur'an") || lower.includes("tahfidz")) return "🕌";
    if (lower.includes("ipa") || lower.includes("sains") || lower.includes("biologi") || lower.includes("fisika")) return "🔬";
    if (lower.includes("ips") || lower.includes("sejarah") || lower.includes("geografi")) return "🌍";
    if (lower.includes("arab")) return "📖";
    if (lower.includes("inggris") || lower.includes("english")) return "💬";
    if (lower.includes("indonesia")) return "📝";
    if (lower.includes("pjok") || lower.includes("olahraga")) return "⚽";
    if (lower.includes("seni") || lower.includes("budaya") || lower.includes("prakarya")) return "🎨";
    if (lower.includes("tik") || lower.includes("komputer") || lower.includes("informatika")) return "💻";
    return "📚";
  };

  const formatDeadline = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();

      const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      if (isToday) return `Hari ini, pukul ${timeStr}`;

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
      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-1 px-1 touch-pan-x">
        <button
          type="button"
          onClick={() => setActiveTab("belum")}
          className={`px-3.5 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeTab === "belum"
              ? "bg-amber-500 text-white shadow-sm scale-102"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
        >
          <span>🎯 Dikerjakan</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "belum" ? "bg-white/30 text-white" : "bg-amber-500/10 text-amber-600"
            }`}>
            {pendingTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("menunggu")}
          className={`px-3.5 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeTab === "menunggu"
              ? "bg-sky-600 text-white shadow-sm scale-102"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
        >
          <span>⏳ Diperiksa</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "menunggu" ? "bg-white/30 text-white" : "bg-sky-500/10 text-sky-600"
            }`}>
            {waitingTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dinilai")}
          className={`px-3.5 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeTab === "dinilai"
              ? "bg-emerald-600 text-white shadow-sm scale-102"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
        >
          <span>⭐ Selesai</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "dinilai" ? "bg-white/30 text-white" : "bg-emerald-500/10 text-emerald-600"
            }`}>
            {gradedTasks.length}
          </span>
        </button>
      </div>

      {/* 3. QUEST CARDS GRID */}
      {filteredTasks.length === 0 ? (
        <div className="py-14 text-center rounded-3xl card-elevation space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl">
            {activeTab === "belum" ? "🎉" : activeTab === "dinilai" ? "📝" : "✨"}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {activeTab === "belum"
                ? "Hebat! Semua tugas sudah dikerjakan!"
                : activeTab === "menunggu"
                  ? "Tidak ada tugas yang sedang menunggu nilai."
                  : activeTab === "dinilai"
                    ? "Belum ada tugas yang dinilai oleh guru."
                    : "Belum ada tugas yang aktif saat ini."}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {activeTab === "belum"
                ? "Pertahankan prestasimu dan nikmati waktu belajarmu dengan gembira!"
                : "Periksa kembali secara berkala untuk misi belajar terbaru dari sekolah."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          {filteredTasks.map((task) => {
            const sub = task.submission;
            const isGraded = sub?.status === "sudah_dinilai";
            const isRevision = sub?.status === "perlu_revisi";
            const isWaiting = sub?.status === "menunggu_penilaian" || sub?.status === "terlambat";

            const icon = getMapelIcon(task.mapelNama);

            return (
              <div
                key={task.id}
                className="card-elevation card-elevation-hover rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all duration-200 group relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Bar: Subject Badge + Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-muted/80 text-foreground font-bold text-xs min-w-0">
                      <span className="shrink-0">{icon}</span>
                      <span className="truncate">{task.mapelNama}</span>
                    </div>

                    {!isGraded && (
                      <div className="shrink-0">
                        {isRevision ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 whitespace-nowrap">
                            <span>✏️</span>
                            <span>Perlu Revisi</span>
                          </span>
                        ) : isWaiting ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 whitespace-nowrap">
                            <span>⏳</span>
                            <span>Diperiksa</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            <span>🎯</span>
                            <span>Misi Baru</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {task.judul}
                    </h3>
                  </div>
                </div>

                {/* Footer Info & Action (Button Underneath) */}
                <div className="pt-3 border-t border-border/70 flex flex-col gap-3">
                  <div className="space-y-1.5 text-xs min-w-0">
                    <div className="flex items-center gap-1.5 text-foreground/85 font-medium">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{formatDeadline(task.deadline)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                      <span className="shrink-0 text-muted-foreground/75">Guru:</span>
                      <span className="font-semibold text-foreground truncate">{task.guruNama}</span>
                    </div>
                  </div>

                  <Link href={`/siswa/tugas/${task.id}`} className="w-full">
                    <Button
                      size="sm"
                      className={`w-full text-xs h-9 px-4 rounded-xl font-bold shadow-2xs transition-all active:scale-95 ${isGraded
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : isRevision
                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                            : isWaiting
                              ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                              : "bg-primary hover:bg-primary/90 text-white"
                        }`}
                    >
                      <span className="whitespace-nowrap">
                        {isGraded
                          ? "Bintang & Nilai"
                          : isRevision
                            ? "Poles & Kirim Ulang"
                            : isWaiting
                              ? "Cek Lembar Tugas"
                              : "Mulai Kerjakan"}
                      </span>
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
