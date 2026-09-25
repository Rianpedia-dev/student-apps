"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clock, Users, ArrowRight, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTugasAction } from "@/actions/assignment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface TeacherTaskItem {
  id: string;
  judul: string;
  deskripsi: string;
  mapelNama: string;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, judul: string) => {
    if (!confirm(`Hapus tugas "${judul}"? Semua data pengumpulan siswa untuk tugas ini juga akan terhapus.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteTugasAction(id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus tugas.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setDeletingId(null);
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

  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl bg-card border border-border">
        <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
        <h3 className="text-base font-bold text-foreground">Belum Ada Tugas yang Dibuat</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
          Buat tugas pertama untuk kelas Anda agar siswa dapat mengumpulkan hasil pekerjaan mereka.
        </p>
        <Link href="/guru/tugas/create">
          <Button size="sm" className="text-xs font-semibold rounded-lg">
            + Buat Tugas Baru
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tasks.map((task) => {
        const isDeleting = deletingId === task.id;

        return (
          <div
            key={task.id}
            className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-primary/40 transition-colors"
          >
            <div className="space-y-3">
              {/* Header: Mapel, Kelas, dan Status Penilaian */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    {task.mapelNama}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-foreground">
                    {task.kelasNama}
                  </span>
                </div>

                {task.waitingCount > 0 ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {task.waitingCount} Perlu Dikoreksi
                  </span>
                ) : task.totalSubmissions > 0 ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Semua Dinilai ✓
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Belum Ada Pengumpulan
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

            {/* Footer: Statistik Pengumpulan & Tombol Aksi */}
            <div className="pt-3 mt-4 border-t border-border flex items-center justify-between">
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-foreground">{task.totalSubmissions}</span>
                  <span>siswa mengumpulkan</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Tenggat: {formatDeadline(task.deadline)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(task.id, task.judul)}
                  disabled={isDeleting}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 rounded-lg"
                  title="Hapus Tugas"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>

                <Link href={`/guru/tugas/${task.id}`}>
                  <Button size="sm" className="h-8 text-xs font-semibold rounded-lg gap-1 px-3">
                    <span>Periksa & Nilai</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
