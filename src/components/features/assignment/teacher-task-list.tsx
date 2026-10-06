"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Trash2, Loader2, Plus, FileText, Clock, ClipboardCheck } from "lucide-react";
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
import { getDeadlineInfo } from "@/lib/task-status";

export interface TeacherTaskItem {
  id: string;
  judul: string;
  deskripsi: string;
  mapelId?: string;
  mapelNama: string;
  mapelWarna?: string | null;
  kelasId?: string;
  kelasNama: string;
  pertemuanId?: string | null;
  pertemuanKe?: number | null;
  pertemuanJudul?: string | null;
  deadline: string;
  poinMaksimal: number;
  totalSubmissions: number;
  waitingCount: number;
  gradedCount: number;
}

interface TeacherTaskListProps {
  tasks: TeacherTaskItem[];
  availableClasses?: Array<{ id: string; name: string }>;
  availableSubjects?: Array<{ id: string; name: string }>;
  initialMapelId?: string;
  initialKelasId?: string;
  initialStatus?: string;
  isSpecificView?: boolean;
  activeMapelNama?: string;
  activeKelasNama?: string;
}

export function TeacherTaskList({
  tasks,
  availableClasses = [],
  availableSubjects = [],
  initialMapelId,
  initialKelasId,
  initialStatus,
  isSpecificView = false,
  activeMapelNama,
  activeKelasNama,
}: TeacherTaskListProps) {
  const router = useRouter();
  const [taskToDelete, setTaskToDelete] = useState<TeacherTaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMapelId, setSelectedMapelId] = useState<string>(initialMapelId || "all");
  const [selectedKelasId, setSelectedKelasId] = useState<string>(initialKelasId || "all");

  const waitingTotalCount = useMemo(
    () => tasks.filter((t) => t.waitingCount > 0).length,
    [tasks]
  );
  const completedTotalCount = useMemo(
    () => tasks.filter((t) => t.waitingCount === 0 && t.totalSubmissions > 0).length,
    [tasks]
  );

  const filterTasks = (statusTab: string) => {
    return tasks.filter((task) => {
      if (statusTab === "need_grading" && task.waitingCount === 0) return false;
      if (statusTab === "completed" && !(task.waitingCount === 0 && task.totalSubmissions > 0)) {
        return false;
      }
      if (!isSpecificView) {
        if (selectedMapelId !== "all" && task.mapelId !== selectedMapelId) return false;
        if (selectedKelasId !== "all" && task.kelasId !== selectedKelasId) return false;
      }
      return true;
    });
  };

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

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
        <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <h3 className="text-base font-bold text-foreground">Belum Ada Tugas yang Dibuat</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Bapak/Ibu Guru belum membuat penugasan. Klik tombol di bawah untuk membuat tugas pertama.
        </p>
        <div className="pt-2">
          <Link href="/guru/tugas/create">
            <Button size="sm" className="gap-1.5 text-xs font-bold rounded-xl">
              <Plus className="h-4 w-4" /> Buat Tugas Baru
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderTable = (statusTab: string) => {
    const filtered = filterTasks(statusTab);

    return (
      <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-muted/40 border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                No
              </TableHead>
              {!isSpecificView && (
                <>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[160px]">
                    Mata Pelajaran
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[140px]">
                    Kelas
                  </TableHead>
                </>
              )}
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[220px]">
                Judul Tugas
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[130px]">
                Batas Waktu
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-center min-w-[130px]">
                Jawaban Siswa
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-center min-w-[150px]">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isSpecificView ? 5 : 7}
                  className="h-36 text-center text-muted-foreground"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {isSpecificView
                      ? `Belum ada tugas untuk mata pelajaran ${activeMapelNama || ""}${activeKelasNama ? ` di ${activeKelasNama}` : ""}`
                      : "Tidak ada tugas yang sesuai"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isSpecificView
                      ? "Bapak/Ibu dapat membuat tugas baru dengan mengklik tombol di atas."
                      : "Coba sesuaikan kata kunci pencarian atau klik tombol Reset Filter."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((task, index) => {
                const { label: deadlineLabel, isLate } = getDeadlineInfo(task.deadline);

                return (
                  <TableRow
                    key={task.id}
                    className="hover:bg-muted/30 transition-colors border-b border-border/60"
                  >
                    {/* Nomor Urut */}
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    {/* Mata Pelajaran & Kelas hanya jika view umum */}
                    {!isSpecificView && (
                      <>
                        <TableCell>
                          <span className="font-semibold text-xs sm:text-sm text-foreground">
                            {task.mapelNama}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs sm:text-sm text-foreground">
                            {task.kelasNama}
                          </span>
                        </TableCell>
                      </>
                    )}

                    {/* Judul Tugas */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <Link
                          href={`/guru/tugas/${task.id}`}
                          className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors block leading-snug"
                        >
                          {task.judul}
                        </Link>
                        {task.pertemuanJudul && (
                          <span className="text-[11px] text-muted-foreground block">
                            Pertemuan {task.pertemuanKe || ""}: {task.pertemuanJudul}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Batas Waktu */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Clock className={`h-3.5 w-3.5 shrink-0 ${isLate ? "text-rose-500" : "text-muted-foreground"}`} />
                        <span
                          className={`text-xs font-medium ${
                            isLate ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          {deadlineLabel}
                        </span>
                      </div>
                    </TableCell>

                    {/* Pengumpulan / Jawaban Siswa */}
                    <TableCell className="text-center">
                      {task.totalSubmissions === 0 ? (
                        <span className="text-xs text-muted-foreground font-medium">
                          Belum ada
                        </span>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-xs font-bold text-foreground">
                            {task.totalSubmissions} Siswa
                          </span>
                          {task.waitingCount > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            >
                              {task.waitingCount} perlu dinilai
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            >
                              Semua dinilai
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Aksi & Pengelolaan */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/guru/tugas/${task.id}`}>
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5"
                            title="Buka daftar jawaban siswa untuk dinilai"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            <span>Periksa & Nilai</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTaskToDelete(task)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-xl"
                          title="Hapus Tugas"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
    <div className="space-y-3.5">
      {/* Tabs Kategori Tugas */}
      <Tabs
        defaultValue={
          initialStatus === "need_grading" || initialStatus === "completed"
            ? initialStatus
            : "all"
        }
        className="space-y-3.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="inline-flex h-9 p-1 bg-card/80 border border-border/80 rounded-xl shadow-2xs gap-1 w-fit">
            <TabsTrigger
              value="all"
              className="rounded-lg text-xs font-semibold px-3 py-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all gap-1.5"
            >
              <span>Semua</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-muted-foreground/15">
                {tasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="need_grading"
              className="rounded-lg text-xs font-semibold px-3 py-1 data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 transition-all gap-1.5"
            >
              <span>Perlu Dinilai</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-bold rounded-md ${
                  waitingTotalCount > 0
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-muted-foreground/15 text-muted-foreground"
                }`}
              >
                {waitingTotalCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-lg text-xs font-semibold px-3 py-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 transition-all gap-1.5"
            >
              <span>Selesai</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-muted-foreground/15 text-muted-foreground">
                {completedTotalCount}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Filter dropdowns hanya jika BUKAN mode mapel spesifik */}
          {!isSpecificView && (availableClasses.length > 0 || availableSubjects.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {availableClasses.length > 0 && (
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="h-8 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground cursor-pointer"
                >
                  <option value="all">Semua Kelas</option>
                  {availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              )}

              {availableSubjects.length > 0 && (
                <select
                  value={selectedMapelId}
                  onChange={(e) => setSelectedMapelId(e.target.value)}
                  className="h-8 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground cursor-pointer"
                >
                  <option value="all">Semua Mapel</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              )}

              {(selectedKelasId !== "all" || selectedMapelId !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedKelasId("all");
                    setSelectedMapelId("all");
                  }}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-lg px-2"
                >
                  Reset
                </Button>
              )}
            </div>
          )}
        </div>

        <TabsContent value="all" className="mt-0">{renderTable("all")}</TabsContent>
        <TabsContent value="need_grading" className="mt-0">{renderTable("need_grading")}</TabsContent>
        <TabsContent value="completed" className="mt-0">{renderTable("completed")}</TabsContent>
      </Tabs>

      {/* Konfirmasi Hapus Tugas Dialog */}
      <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Hapus Tugas?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Apakah Bapak/Ibu yakin ingin menghapus tugas{" "}
              <strong className="text-foreground">&quot;{taskToDelete?.judul}&quot;</strong>?
              Seluruh lembar kerja dan jawaban siswa pada tugas ini akan terhapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setTaskToDelete(null)}
              className="text-xs rounded-xl"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleExecuteDelete}
              className="text-xs font-bold rounded-xl gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menghapus...
                </>
              ) : (
                "Ya, Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
