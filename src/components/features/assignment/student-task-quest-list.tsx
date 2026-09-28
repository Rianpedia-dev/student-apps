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
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("semua")}
          className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "semua"
              ? "bg-primary text-primary-foreground shadow-sm scale-102"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span>Semua Misi</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            activeTab === "semua" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
          }`}>
            {tasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("belum")}
          className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "belum"
              ? "bg-amber-500 text-white shadow-sm scale-102"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span>🎯 Perlu Dikerjakan</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            activeTab === "belum" ? "bg-white/30 text-white" : "bg-amber-500/10 text-amber-600"
          }`}>
            {pendingTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("menunggu")}
          className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "menunggu"
              ? "bg-sky-600 text-white shadow-sm scale-102"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span>⏳ Sedang Diperiksa</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            activeTab === "menunggu" ? "bg-white/30 text-white" : "bg-sky-500/10 text-sky-600"
          }`}>
            {waitingTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dinilai")}
          className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "dinilai"
              ? "bg-emerald-600 text-white shadow-sm scale-102"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span>⭐ Misi Selesai</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            activeTab === "dinilai" ? "bg-white/30 text-white" : "bg-emerald-500/10 text-emerald-600"
          }`}>
            {gradedTasks.length}
          </span>
        </button>
      </div>

      {/* 3. QUEST CARDS GRID */}
      {filteredTasks.length === 0 ? (
        <div className="py-14 text-center rounded-3xl bg-card border border-border shadow-2xs space-y-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const sub = task.submission;
            const isGraded = sub?.status === "sudah_dinilai";
            const isRevision = sub?.status === "perlu_revisi";
            const isWaiting = sub?.status === "menunggu_penilaian" || sub?.status === "terlambat";

            const icon = getMapelIcon(task.mapelNama);

            return (
              <div
                key={task.id}
                className="bg-card border-2 border-border/80 hover:border-primary/50 rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md group relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Bar: Subject Badge + Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/80 text-foreground font-bold text-xs">
                      <span>{icon}</span>
                      <span className="truncate max-w-[130px] sm:max-w-[160px]">{task.mapelNama}</span>
                    </div>

                    {isGraded ? (
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span>⭐</span>
                        <span>Nilai: {sub.nilai} / {task.poinMaksimal}</span>
                      </span>
                    ) : isRevision ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center gap-1">
                        <span>✏️</span>
                        <span>Perlu Revisi</span>
                      </span>
                    ) : isWaiting ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1">
                        <span>⏳</span>
                        <span>Diperiksa Guru</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <span>🎯</span>
                        <span>Misi Baru</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description Snippet */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {task.judul}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {task.deskripsi ? task.deskripsi.replace(/<[^>]*>?/gm, "") : "Buka detail untuk membaca petunjuk tugas."}
                    </p>
                  </div>
                </div>

                {/* Footer Info & Action */}
                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                  <div className="space-y-0.5 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1 text-foreground/80 font-medium">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{formatDeadline(task.deadline)}</span>
                    </div>
                    <div>Guru: <span className="font-semibold text-foreground">{task.guruNama}</span></div>
                  </div>

                  <Link href={`/siswa/tugas/${task.id}`}>
                    <Button
                      size="sm"
                      className={`text-xs h-9 px-3.5 rounded-xl gap-1.5 font-bold shadow-2xs transition-all active:scale-95 ${
                        isGraded
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : isRevision
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : isWaiting
                          ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                          : "bg-primary hover:bg-primary/90 text-white"
                      }`}
                    >
                      <span>
                        {isGraded
                          ? "Lihat Bintang & Nilai"
                          : isRevision
                          ? "Poles & Kirim Ulang"
                          : isWaiting
                          ? "Cek Lembar Tugas"
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
