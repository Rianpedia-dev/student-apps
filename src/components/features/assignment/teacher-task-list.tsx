"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trash2,
  Loader2,
  Plus,
  FileText,
  Clock,
  ClipboardCheck,
  Search,
  X,
  Edit3,
  School,
  Download,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteTugasAction } from "@/actions/assignment";
import { getMapelGradeRecapAction } from "@/actions/grade-recap";
import {
  exportMapelGradesToExcel,
  exportMapelGradesToPdf,
} from "@/lib/export-mapel-grades";
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
  tipePengerjaan?: string;
  pertemuanId?: string | null;
  pertemuanKe?: number | null;
  pertemuanJudul?: string | null;
  deadline: string;
  poinMaksimal: number;
  totalSubmissions: number;
  waitingCount: number;
  revisionCount?: number;
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
  assignedClassesForMapel?: Array<{ id: string; name: string; jenjang: string }>;
  currentKelasId?: string;
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
  assignedClassesForMapel = [],
  currentKelasId,
}: TeacherTaskListProps) {
  const router = useRouter();
  const [taskToDelete, setTaskToDelete] = useState<TeacherTaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>(
    initialStatus === "need_grading" || initialStatus === "completed"
      ? initialStatus
      : "all"
  );
  const [selectedMapelId, setSelectedMapelId] = useState<string>(initialMapelId || "all");
  const [selectedKelasId, setSelectedKelasId] = useState<string>(initialKelasId || "all");
  const [exportingFormat, setExportingFormat] = useState<"excel" | "pdf" | null>(null);

  const effectiveKelasId = currentKelasId || initialKelasId;

  const handleExportAllGrades = async (format: "excel" | "pdf") => {
    if (!initialMapelId || !effectiveKelasId) return;
    setExportingFormat(format);
    try {
      const res = await getMapelGradeRecapAction({
        mapelId: initialMapelId,
        kelasId: effectiveKelasId,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "Gagal mengambil rekap nilai tugas.");
        return;
      }

      if (res.data.tasks.length === 0) {
        toast.info("Belum ada tugas pada mata pelajaran dan kelas ini.");
        return;
      }

      if (format === "excel") {
        await exportMapelGradesToExcel(res.data);
        toast.success("Rekap semua nilai tugas (.xlsx) berhasil diunduh!");
      } else {
        await exportMapelGradesToPdf(res.data);
        toast.success("Rekap semua nilai tugas (.pdf) berhasil diunduh!");
      }
    } catch (error) {
      console.error("[Export Mapel Grades Error]:", error);
      toast.error(
        format === "excel"
          ? "Gagal mengunduh rekap nilai Excel."
          : "Gagal mengunduh rekap nilai PDF."
      );
    } finally {
      setExportingFormat(null);
    }
  };

  // Filter tasks based on class & subject dropdowns (for general view)
  const scopedTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!isSpecificView) {
        if (selectedMapelId !== "all" && task.mapelId !== selectedMapelId) return false;
        if (selectedKelasId !== "all" && task.kelasId !== selectedKelasId) return false;
      }
      return true;
    });
  }, [tasks, isSpecificView, selectedMapelId, selectedKelasId]);

  // Filter tasks based on status tab & search query
  const displayedTasks = useMemo(() => {
    return scopedTasks.filter((task) => {
      // Status Tab filter
      if (activeTab === "need_grading" && task.waitingCount === 0) return false;
      if (
        activeTab === "completed" &&
        !(
          task.waitingCount === 0 &&
          (task.revisionCount ?? 0) === 0 &&
          task.totalSubmissions > 0
        )
      ) {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchJudul = task.judul.toLowerCase().includes(q);
        const matchPertemuan =
          (task.pertemuanJudul || "").toLowerCase().includes(q) ||
          (task.pertemuanKe != null && `pertemuan ${task.pertemuanKe}`.includes(q));
        const matchKelas = (task.kelasNama || "").toLowerCase().includes(q);
        const matchMapel = (task.mapelNama || "").toLowerCase().includes(q);

        if (!matchJudul && !matchPertemuan && !matchKelas && !matchMapel) {
          return false;
        }
      }

      return true;
    });
  }, [scopedTasks, activeTab, searchQuery]);

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

  // If no tasks exist at all in this context
  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        {isSpecificView && assignedClassesForMapel.length > 1 && (
          <div className="flex items-center justify-end bg-card/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-border/80 shadow-2xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background/80 shadow-2xs text-xs h-9">
              <School className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="font-bold text-muted-foreground shrink-0 hidden sm:inline">Pilih Kelas:</span>
              <select
                value={currentKelasId || initialKelasId}
                onChange={(e) =>
                  router.push(`/guru/mapel/${initialMapelId}?kelasId=${e.target.value}&tab=tugas`)
                }
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                {assignedClassesForMapel.map((cls) => (
                  <option key={cls.id} value={cls.id} className="bg-card text-foreground font-semibold">
                    {cls.name} ({cls.jenjang})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="bg-card/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-border/80 p-10 sm:p-14 text-center space-y-4 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <FileText className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Belum Ada Tugas yang Dibuat
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {isSpecificView && activeMapelNama
                ? `Bapak/Ibu Guru belum membuat tugas untuk ${activeMapelNama}${
                    activeKelasNama ? ` di ${activeKelasNama}` : ""
                  }. Klik tombol di bawah untuk mulai membuat penugasan baru.`
                : "Bapak/Ibu Guru belum membuat penugasan kelas. Klik tombol di bawah untuk membuat penugasan pertama."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/guru/tugas/create${
                initialMapelId
                  ? `?mapelId=${initialMapelId}${
                      initialKelasId ? `&kelasId=${initialKelasId}` : ""
                    }&from=mapel`
                  : ""
              }`}
            >
              <Button className="h-10 px-5 gap-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-4 w-4" />
                <span>Buat Tugas Baru</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: Status Filter Tabs + Search + Optional Filter Dropdowns */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-card/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-border/80 shadow-2xs">
        {/* Left: Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50 overflow-x-auto max-w-full shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Semua</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("need_grading")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "need_grading"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Perlu Dinilai</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "completed"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Selesai</span>
          </button>
        </div>

        {/* Right: Class Selector, Search Input & General View Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Dropdown Ganti Kelas Langsung di Mode Mapel Spesifik */}
          {isSpecificView && assignedClassesForMapel.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background/80 shadow-2xs text-xs h-9">
              <School className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="font-bold text-muted-foreground shrink-0 hidden sm:inline">Pilih Kelas:</span>
              <select
                value={currentKelasId || initialKelasId}
                onChange={(e) =>
                  router.push(`/guru/mapel/${initialMapelId}?kelasId=${e.target.value}&tab=tugas`)
                }
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                {assignedClassesForMapel.map((cls) => (
                  <option key={cls.id} value={cls.id} className="bg-card text-foreground font-semibold">
                    {cls.name} ({cls.jenjang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative flex-1 sm:w-60 min-w-[170px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Cari tugas atau pertemuan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8.5 pr-8 rounded-xl border border-border bg-background/80 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1.5 focus:ring-emerald-500/40 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Tombol Unduh Semua Nilai Tugas (Excel & PDF) pada Mode Mapel Spesifik */}
          {isSpecificView && initialMapelId && effectiveKelasId && (
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={exportingFormat !== null}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0 shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                {exportingFormat !== null ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <Download className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>
                  {exportingFormat === "excel"
                    ? "Menyiapkan Excel..."
                    : exportingFormat === "pdf"
                    ? "Menyiapkan PDF..."
                    : "Unduh Semua Nilai"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-75 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-xl">
                <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                  Pilih Format Rekap Nilai
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleExportAllGrades("excel")}
                  disabled={exportingFormat !== null}
                  className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">Unduh Excel (.xlsx)</span>
                    <span className="text-[11px] text-muted-foreground">
                      Matriks nilai, detail & status tugas
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExportAllGrades("pdf")}
                  disabled={exportingFormat !== null}
                  className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg"
                >
                  <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">Unduh PDF (.pdf)</span>
                    <span className="text-[11px] text-muted-foreground">
                      Dokumen cetak resmi A4 Landscape
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Filter dropdowns (hanya tampil jika BUKAN mode mapel spesifik) */}
          {!isSpecificView && (availableClasses.length > 0 || availableSubjects.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {availableClasses.length > 0 && (
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="h-9 rounded-xl border border-border bg-background/80 px-2.5 text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-emerald-500/40"
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
                  className="h-9 rounded-xl border border-border bg-background/80 px-2.5 text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-emerald-500/40"
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
                  className="h-9 text-xs text-muted-foreground hover:text-foreground rounded-xl px-2.5"
                >
                  Reset
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Jika hasil filter kosong */}
      {displayedTasks.length === 0 ? (
        <div className="bg-card/95 backdrop-blur-md rounded-2xl border border-border/80 p-8 sm:p-12 text-center space-y-3 shadow-2xs">
          <FileText className="h-9 w-9 text-muted-foreground/40 mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Tidak Ada Tugas yang Sesuai
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ada tugas dengan kata kunci "${searchQuery}". Coba kata kunci lain atau hapus pencarian.`
              : activeTab === "need_grading"
              ? "Semua jawaban siswa sudah dinilai dengan lengkap. Bagus sekali!"
              : activeTab === "completed"
              ? "Belum ada tugas yang selesai dinilai sepenuhnya."
              : "Belum ada tugas pada pilihan filter kelas atau mata pelajaran ini."}
          </p>
          {(searchQuery ||
            activeTab !== "all" ||
            selectedKelasId !== "all" ||
            selectedMapelId !== "all") && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                  setSelectedKelasId("all");
                  setSelectedMapelId("all");
                }}
                className="text-xs font-semibold rounded-xl"
              >
                Tampilkan Semua Tugas
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP & TABLET LANDSCAPE VIEW (Hidden on Mobile) */}
          <div className="hidden md:block bg-card/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-border/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/40 border-b border-border/70">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-14 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      No
                    </TableHead>
                    {!isSpecificView && (
                      <>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[150px]">
                          Mata Pelajaran
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[130px]">
                          Kelas
                        </TableHead>
                      </>
                    )}
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[260px]">
                      Judul Tugas & Pertemuan
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[140px]">
                      Batas Waktu
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-center min-w-[150px]">
                      Jawaban Siswa
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-center min-w-[170px]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedTasks.map((task, index) => {
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

                        {/* View Umum: Mapel & Kelas */}
                        {!isSpecificView && (
                          <>
                            <TableCell>
                              <span className="font-semibold text-xs text-foreground">
                                {task.mapelNama}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground font-medium">
                                {task.kelasNama}
                              </span>
                            </TableCell>
                          </>
                        )}

                        {/* Judul Tugas & Pertemuan */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                href={`/guru/tugas/${task.id}`}
                                className="font-bold text-xs sm:text-sm text-foreground hover:text-emerald-600 transition-colors block leading-snug"
                              >
                                {task.judul}
                              </Link>
                              {task.tipePengerjaan === "LEMBAR_KERJA" ? (
                                <Badge
                                  variant="emerald"
                                  size="sm"
                                  className="text-[10px] py-0 px-1.5 h-4"
                                >
                                  Berkas
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  size="sm"
                                  className="text-[10px] py-0 px-1.5 h-4"
                                >
                                  Kuis
                                </Badge>
                              )}
                            </div>
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
                            <Clock
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isLate ? "text-rose-500" : "text-muted-foreground"
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                isLate
                                  ? "text-rose-600 dark:text-rose-400 font-bold"
                                  : "text-muted-foreground font-medium"
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
                              ) : (task.revisionCount ?? 0) > 0 ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30"
                                >
                                  {task.revisionCount} perlu revisi
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
                                className="h-8 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                title="Buka daftar jawaban siswa untuk dinilai"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                <span>Periksa & Nilai</span>
                              </Button>
                            </Link>

                            <Link href={`/guru/tugas/${task.id}/edit`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                                title="Edit Tugas"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
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
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* MOBILE & TABLET PORTRAIT VIEW (Card View) */}
          <div className="block md:hidden space-y-3">
            {displayedTasks.map((task, index) => {
              const { label: deadlineLabel, isLate } = getDeadlineInfo(task.deadline);

              return (
                <div
                  key={task.id}
                  className="bg-card/95 backdrop-blur-md rounded-2xl border border-border/80 p-4 shadow-2xs space-y-3 transition-all"
                >
                  {/* Top: No, Type, Title, and Action Icons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                          #{index + 1}
                        </span>
                        {task.tipePengerjaan === "LEMBAR_KERJA" ? (
                          <Badge
                            variant="emerald"
                            size="sm"
                            className="text-[10px] py-0 px-1.5 h-4"
                          >
                            Berkas
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            size="sm"
                            className="text-[10px] py-0 px-1.5 h-4"
                          >
                            Kuis
                          </Badge>
                        )}
                        {!isSpecificView && (
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {task.kelasNama}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/guru/tugas/${task.id}`}
                        className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors block line-clamp-2 leading-snug pt-0.5"
                      >
                        {task.judul}
                      </Link>
                      {task.pertemuanJudul && (
                        <p className="text-[11px] text-muted-foreground">
                          Pertemuan {task.pertemuanKe || ""}: {task.pertemuanJudul}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/guru/tugas/${task.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                          title="Edit Tugas"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTaskToDelete(task)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
                        title="Hapus Tugas"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Info Grid: Batas Waktu & Jawaban */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Batas Waktu
                      </span>
                      <div className="flex items-center gap-1 font-medium">
                        <Clock
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isLate ? "text-rose-500" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={
                            isLate
                              ? "text-rose-600 dark:text-rose-400 font-bold text-xs"
                              : "text-foreground text-xs"
                          }
                        >
                          {deadlineLabel}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Jawaban Siswa
                      </span>
                      <div>
                        {task.totalSubmissions === 0 ? (
                          <span className="text-xs text-muted-foreground font-medium">
                            Belum ada
                          </span>
                        ) : task.waitingCount > 0 ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          >
                            {task.waitingCount} perlu dinilai
                          </Badge>
                        ) : (task.revisionCount ?? 0) > 0 ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30"
                          >
                            {task.revisionCount} perlu revisi
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          >
                            Semua dinilai ({task.totalSubmissions})
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Utama Mobile: Periksa & Nilai */}
                  <div className="pt-1">
                    <Link href={`/guru/tugas/${task.id}`} className="block w-full">
                      <Button className="w-full h-9 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 transition-all active:scale-[0.98]">
                        <ClipboardCheck className="h-4 w-4" />
                        <span>Periksa & Nilai Jawaban</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

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
