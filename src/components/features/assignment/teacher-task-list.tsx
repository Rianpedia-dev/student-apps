"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Users,
  ArrowRight,
  Trash2,
  Loader2,
  Search,
  X,
  FileText,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
}

export function TeacherTaskList({
  tasks,
  availableClasses = [],
  availableSubjects = [],
  initialMapelId,
  initialKelasId,
  initialStatus,
}: TeacherTaskListProps) {
  const router = useRouter();
  const [taskToDelete, setTaskToDelete] = useState<TeacherTaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMapelId, setSelectedMapelId] = useState<string>(initialMapelId || "all");
  const [selectedKelasId, setSelectedKelasId] = useState<string>(initialKelasId || "all");

  const waitingTotalCount = useMemo(() => tasks.filter((t) => t.waitingCount > 0).length, [tasks]);
  const completedTotalCount = useMemo(() => tasks.filter((t) => t.waitingCount === 0 && t.totalSubmissions > 0).length, [tasks]);

  const filterTasks = (statusTab: string) => {
    return tasks.filter((task) => {
      if (statusTab === "need_grading" && task.waitingCount === 0) return false;
      if (statusTab === "completed" && !(task.waitingCount === 0 && task.totalSubmissions > 0)) return false;
      if (selectedMapelId !== "all" && task.mapelId !== selectedMapelId) return false;
      if (selectedKelasId !== "all" && task.kelasId !== selectedKelasId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return task.judul.toLowerCase().includes(q) || task.mapelNama.toLowerCase().includes(q) || task.kelasNama.toLowerCase().includes(q);
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
      toast.error("Terjadi kesalahan saat menghapus.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Belum ada tugas</h3>
            <p className="text-xs text-muted-foreground mt-1">Buat penugasan pertama untuk kelas Anda.</p>
          </div>
          <Link href="/guru/tugas/create">
            <Button size="sm" className="gap-1.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" /> Buat Tugas
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const renderTaskGrid = (statusTab: string) => {
    const filtered = filterTasks(statusTab);
    if (filtered.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Search className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-foreground">Tidak ada tugas yang cocok</p>
            <p className="text-xs text-muted-foreground">Coba ubah kata kunci atau reset filter.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((task) => {
          const { label: deadlineLabel, isLate } = getDeadlineInfo(task.deadline);
          return (
            <Card key={task.id} enableHover className="flex flex-col justify-between">
              <CardContent className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col">
                {/* Top: Subject + Class */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium truncate">{task.mapelNama}</span>
                  <span>•</span>
                  <span>{task.kelasNama}</span>
                </div>

                {/* Title */}
                <Link href={`/guru/tugas/${task.id}`} className="block flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-2 leading-snug hover:text-primary transition-colors">
                    {task.judul}
                  </h3>
                </Link>

                {/* Info Row */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Pengumpulan
                    </span>
                    <p className="font-semibold text-foreground">
                      {task.totalSubmissions} siswa
                      {task.waitingCount > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground ml-1">
                          ({task.waitingCount} baru)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Deadline
                    </span>
                    <p className={`font-semibold truncate ${isLate ? "text-destructive" : "text-foreground"}`}>
                      {deadlineLabel}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <Separator />
                <div className="flex items-center gap-2">
                  <Link href={`/guru/tugas/${task.id}`} className="flex-1">
                    <Button size="sm" className="w-full text-xs font-semibold gap-1.5 h-9">
                      Periksa & Nilai
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTaskToDelete(task)}
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tugas, mapel, atau kelas..."
            className="pl-9 pr-8 h-10 text-sm rounded-lg"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        {(availableClasses.length > 0 || availableSubjects.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            {availableClasses.length > 0 && (
              <Select value={selectedKelasId} onValueChange={(val) => setSelectedKelasId(val || "all")}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {availableSubjects.length > 0 && (
              <Select value={selectedMapelId} onValueChange={(val) => setSelectedMapelId(val || "all")}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Semua Mapel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mapel</SelectItem>
                  {availableSubjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(selectedKelasId !== "all" || selectedMapelId !== "all") && (
              <button
                onClick={() => { setSelectedKelasId("all"); setSelectedMapelId("all"); }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs + Content */}
      <Tabs defaultValue={initialStatus === "need_grading" || initialStatus === "completed" ? initialStatus : "all"}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">Semua ({tasks.length})</TabsTrigger>
          <TabsTrigger value="need_grading">Perlu Dikoreksi ({waitingTotalCount})</TabsTrigger>
          <TabsTrigger value="completed">Selesai ({completedTotalCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderTaskGrid("all")}</TabsContent>
        <TabsContent value="need_grading">{renderTaskGrid("need_grading")}</TabsContent>
        <TabsContent value="completed">{renderTaskGrid("completed")}</TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Tugas?</DialogTitle>
            <DialogDescription>
              Tugas <strong>&quot;{taskToDelete?.judul}&quot;</strong> dan seluruh data siswa terkait akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" disabled={isDeleting} onClick={() => setTaskToDelete(null)} className="text-xs">
              Batal
            </Button>
            <Button variant="destructive" size="sm" disabled={isDeleting} onClick={handleExecuteDelete} className="text-xs font-semibold gap-1.5">
              {isDeleting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Menghapus...</> : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
