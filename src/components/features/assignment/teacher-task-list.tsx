"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Users,
  ArrowRight,
  Trash2,
  Loader2,
  School,
  Search,
  X,
  FileText,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteTugasAction } from "@/actions/assignment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface TeacherTaskItem {
  id: string;
  judul: string;
  deskripsi: string;
  mapelNama: string;
  mapelWarna?: string | null;
  kelasNama: string;
  deadline: string;
  poinMaksimal: number;
  totalSubmissions: number;
  waitingCount: number;
  gradedCount: number;
}

interface TeacherTaskListProps {
  tasks: TeacherTaskItem[];
}

export function TeacherTaskList({ tasks }: TeacherTaskListProps) {
  const router = useRouter();
  const [taskToDelete, setTaskToDelete] = useState<TeacherTaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "need_grading" | "completed">("all");

  const waitingTotalCount = useMemo(
    () => tasks.filter((t) => t.waitingCount > 0).length,
    [tasks]
  );
  const completedTotalCount = useMemo(
    () => tasks.filter((t) => t.waitingCount === 0 && t.totalSubmissions > 0).length,
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter === "need_grading" && task.waitingCount === 0) return false;
      if (statusFilter === "completed" && !(task.waitingCount === 0 && task.totalSubmissions > 0)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchJudul = task.judul.toLowerCase().includes(query);
        const matchMapel = task.mapelNama.toLowerCase().includes(query);
        const matchKelas = task.kelasNama.toLowerCase().includes(query);
        return matchJudul || matchMapel || matchKelas;
      }

      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  const handleExecuteDelete = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      const res = await deleteTugasAction(taskToDelete.id);
      if (res.success) {
        toast.success(res.message);
        setTaskToDelete(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus tugas.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus tugas.");
    } finally {
      setIsDeleting(false);
    }
  };

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

  const isDeadlinePassed = (dateStr: string) => {
    try {
      return new Date(dateStr).getTime() < Date.now();
    } catch {
      return false;
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl bg-card border border-border p-6 shadow-2xs">
        <div className="h-12 w-12 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto mb-3 text-muted-foreground/60">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">Belum Ada Tugas yang Dibuat</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto mb-5">
          Buat penugasan pertama untuk kelas Anda agar siswa dapat mengumpulkan lembar kerja mereka.
        </p>
        <Link href="/guru/tugas/create">
          <Button size="sm" className="text-xs font-semibold rounded-xl gap-1.5 px-4 h-9">
            + Buat Tugas Baru
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card/60 backdrop-blur-xs p-2 rounded-2xl border border-border/70">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul tugas, mapel, atau kelas..."
            className="pl-9 pr-8 h-9 text-xs rounded-xl bg-background/80 border-border/70 focus-visible:ring-1"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Semua ({tasks.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("need_grading")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === "need_grading"
                ? "bg-amber-500 text-white shadow-2xs"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {waitingTotalCount > 0 && (
              <span className={`size-1.5 rounded-full ${statusFilter === "need_grading" ? "bg-white" : "bg-amber-500 animate-pulse"}`} />
            )}
            <span>Perlu Dikoreksi</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              statusFilter === "need_grading"
                ? "bg-white/20 text-white"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}>
              {waitingTotalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === "completed"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Selesai ({completedTotalCount})
          </button>
        </div>
      </div>

      {/* Empty Filter Result */}
      {filteredTasks.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-card border border-border p-6">
          <Filter className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">Tidak Ada Tugas yang Cocok</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Coba ubah kata kunci pencarian atau ganti filter status.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="mt-3 text-xs rounded-xl h-8"
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredTasks.map((task) => {
            const isOverdue = isDeadlinePassed(task.deadline);

            return (
              <div
                key={task.id}
                className="bg-card border border-border/80 hover:border-primary/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-md group relative gap-3.5"
              >
                {/* Header: Mapel, Kelas, dan Judul */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      title={task.mapelNama}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20 shrink-0"
                    >
                      {task.mapelNama}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
                      <School className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span>{task.kelasNama}</span>
                    </span>
                  </div>

                  <Link href={`/guru/tugas/${task.id}`} className="group/link block pt-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-foreground group-hover/link:text-primary transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
                      {task.judul}
                    </h3>
                  </Link>
                </div>

                {/* Footer: Box Info 2 Kolom & Tombol Aksi Bersampingan */}
                <div className="space-y-3 pt-1">
                  {/* Kotak Ringkasan Info (Pengumpulan & Batas Waktu) */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                        <Users className="h-3 w-3 text-primary" />
                        <span>Pengumpulan</span>
                      </span>
                      <p className="text-xs font-bold text-foreground truncate">
                        {task.totalSubmissions} Siswa
                        {task.waitingCount > 0 && (
                          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 ml-1">
                            ({task.waitingCount} baru)
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>Batas Waktu</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {formatDeadline(task.deadline)}
                        </p>
                        {isOverdue && (
                          <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-1 py-0.2 rounded shrink-0">
                            Lewat
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Bersampingan */}
                  <div className="flex items-center gap-2">
                    <Link href={`/guru/tugas/${task.id}`} className="flex-1 min-w-0">
                      <Button
                        size="sm"
                        className="w-full h-9 text-xs font-bold rounded-xl gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all group-hover:shadow-md"
                      >
                        <span>Periksa & Nilai Tugas</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTaskToDelete(task)}
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 hover:border-red-500/30 rounded-xl shrink-0 transition-colors"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
              Hapus Tugas?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
              Apakah Anda yakin ingin menghapus tugas{" "}
              <strong className="text-foreground">"{taskToDelete?.judul}"</strong>?
              Seluruh riwayat lembar kerja dan nilai siswa untuk tugas ini akan ikut terhapus secara permanen.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-2 mt-4 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTaskToDelete(null)}
              disabled={isDeleting}
              className="text-xs rounded-xl h-8.5"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleExecuteDelete}
              disabled={isDeleting}
              className="text-xs rounded-xl h-8.5 gap-1.5 font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Ya, Hapus Tugas</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
