"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Calendar,
  Clock,
  User,
  Loader2,
  Check,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  CalendarPlus,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createJadwalAction,
  updateJadwalAction,
  deleteJadwalAction,
} from "@/actions/subject";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { compareScheduleTime, cn } from "@/lib/utils";
import { TeacherSearchSelect } from "./teacher-search-select";
import { ClassSearchSelect } from "./class-search-select";
import { SubjectSearchSelect } from "./subject-search-select";
import { ImportExcelModal } from "./import-excel-modal";
import { ExportPdfModal } from "./export-pdf-modal";
import { NewSemesterModal } from "./new-semester-modal";
import { BulkDeleteModal } from "./bulk-delete-modal";
import { exportSchedulesToExcelBuffer } from "@/lib/excel-schedules";

export interface ScheduleItem {
  id: string;
  kelasId: string;
  kelasNama: string;
  jenjang: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  guruId: string;
  guruNama: string;
  guruNiy?: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  tahunPelajaran?: string;
  semester?: string;
}

export interface ConflictInfo {
  type: "guru" | "kelas";
  label: string;
  withSchedule: ScheduleItem;
  description: string;
}

interface SchedulesManagerProps {
  initialSchedules: ScheduleItem[];
  classes: Array<{ id: string; nama: string; jenjang: string }>;
  subjects: Array<{ id: string; nama: string; kode: string; jenjang?: string }>;
  teachers: Array<{ id: string; nama: string; bidang?: string | null; nip?: string }>;
  currentTahun: string;
  currentSemester: string;
  availableYears: string[];
  adminJenjang: string;
  activeJenjang: string;
  initialScope: string;
  initialKelasId: string;
}

function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const parts = t.trim().split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function isTimeOverlapping(s1: string, e1: string, s2: string, e2: string): boolean {
  const start1 = parseTimeToMinutes(s1);
  const end1 = parseTimeToMinutes(e1);
  const start2 = parseTimeToMinutes(s2);
  const end2 = parseTimeToMinutes(e2);
  return start1 < end2 && start2 < end1;
}

function getScheduleConflicts(
  target: {
    id?: string;
    kelasId: string;
    guruId: string;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
  },
  allSchedules: ScheduleItem[]
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  if (!target.hari || !target.jamMulai || !target.jamSelesai) return conflicts;

  for (const s of allSchedules) {
    if (target.id && s.id === target.id) continue;
    if (s.hari.trim().toLowerCase() !== target.hari.trim().toLowerCase()) continue;

    if (!isTimeOverlapping(target.jamMulai, target.jamSelesai, s.jamMulai, s.jamSelesai)) {
      continue;
    }

    // 1. Guru bentrok
    if (target.guruId && s.guruId === target.guruId) {
      conflicts.push({
        type: "guru",
        label: "Guru Bentrok",
        withSchedule: s,
        description: `Guru ${s.guruNama} sudah mengajar di kelas ${s.kelasNama} (${s.mapelNama}, ${s.jamMulai} - ${s.jamSelesai}).`,
      });
    }

    // 2. Kelas bentrok
    if (target.kelasId && s.kelasId === target.kelasId) {
      conflicts.push({
        type: "kelas",
        label: "Kelas Bentrok",
        withSchedule: s,
        description: `Kelas ${s.kelasNama} sudah ada mata pelajaran ${s.mapelNama} (${s.jamMulai} - ${s.jamSelesai}).`,
      });
    }
  }

  return conflicts;
}

const DAYS_LIST = ["Semua Hari", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

export function SchedulesManager({
  initialSchedules,
  classes,
  subjects,
  teachers,
  currentTahun,
  currentSemester,
  availableYears,
  adminJenjang,
  activeJenjang,
  initialScope,
  initialKelasId,
}: SchedulesManagerProps) {
  const router = useRouter();

  // Primary filters
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [selectedYear, setSelectedYear] = useState(currentTahun);
  const [selectedSemester, setSelectedSemester] = useState(currentSemester);
  const [selectedScope, setSelectedScope] = useState(initialScope);
  const [selectedKelasId, setSelectedKelasId] = useState(initialKelasId || "ALL");
  const [selectedDay, setSelectedDay] = useState<string>("Semua Hari");

  // Search & Conflicts
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOnlyConflict, setFilterOnlyConflict] = useState(false);
  const [expandedConflictId, setExpandedConflictId] = useState<string | null>(null);

  // CRUD Modals
  const [openModal, setOpenModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ScheduleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Modals
  const [openImportModal, setOpenImportModal] = useState(false);
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [openSemesterModal, setOpenSemesterModal] = useState(false);
  const [openBulkDeleteModal, setOpenBulkDeleteModal] = useState(false);

  // Form values state for real-time conflict checking inside modal
  const [formKelasId, setFormKelasId] = useState<string>("");
  const [formMapelId, setFormMapelId] = useState<string>("");
  const [formGuruId, setFormGuruId] = useState<string>("");
  const [formHari, setFormHari] = useState<string>("Senin");
  const [formJamMulai, setFormJamMulai] = useState<string>("07:30");
  const [formJamSelesai, setFormJamSelesai] = useState<string>("09:00");
  const [allowConflict, setAllowConflict] = useState<boolean>(false);

  // Synchronize when server props update
  useEffect(() => {
    setSchedules(initialSchedules);
    setSelectedYear(currentTahun);
    setSelectedSemester(currentSemester);
    setSelectedScope(initialScope);
    if (initialKelasId) setSelectedKelasId(initialKelasId);
  }, [initialSchedules, currentTahun, currentSemester, initialScope, initialKelasId]);

  // Handle URL navigation for period and scope filters
  const handleNavigate = (params: {
    tahun?: string;
    semester?: string;
    scope?: string;
    kelasId?: string;
  }) => {
    const qTahun = params.tahun ?? selectedYear;
    const qSemester = params.semester ?? selectedSemester;
    const qScope = params.scope ?? selectedScope;
    const qKelasId = params.kelasId ?? selectedKelasId;

    const query = new URLSearchParams();
    query.set("tahun", qTahun);
    query.set("semester", qSemester);
    query.set("scope", qScope);
    if (qScope === "CLASS" && qKelasId && qKelasId !== "ALL") {
      query.set("kelasId", qKelasId);
    }

    router.push(`/admin/schedules?${query.toString()}`);
  };

  // Compute conflicts map for all schedules
  const conflictsMap = useMemo(() => {
    const map = new Map<string, ConflictInfo[]>();
    for (const s of schedules) {
      const c = getScheduleConflicts(s, schedules);
      if (c.length > 0) {
        map.set(s.id, c);
      }
    }
    return map;
  }, [schedules]);

  // Filtered list
  const filtered = useMemo(() => {
    const list = schedules.filter((s) => {
      // Day filter
      if (selectedDay !== "Semua Hari" && s.hari.toLowerCase() !== selectedDay.toLowerCase()) {
        return false;
      }

      // Conflict filter
      if (filterOnlyConflict && !conflictsMap.has(s.id)) {
        return false;
      }

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const match =
          s.mapelNama.toLowerCase().includes(q) ||
          s.mapelKode.toLowerCase().includes(q) ||
          s.guruNama.toLowerCase().includes(q) ||
          (s.guruNiy && s.guruNiy.toLowerCase().includes(q)) ||
          s.kelasNama.toLowerCase().includes(q) ||
          s.hari.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      const comp = compareScheduleTime(
        a.hari,
        a.jamMulai,
        a.jamSelesai,
        b.hari,
        b.jamMulai,
        b.jamSelesai
      );
      if (comp !== 0) return comp;
      const kelasComp = a.kelasNama.localeCompare(b.kelasNama);
      if (kelasComp !== 0) return kelasComp;
      return a.mapelNama.localeCompare(b.mapelNama);
    });
  }, [schedules, selectedDay, filterOnlyConflict, searchQuery, conflictsMap]);

  // Real-time conflict preview inside the active modal (Add or Edit)
  const modalConflicts = useMemo(() => {
    if (!openModal && !editTarget) return [];
    return getScheduleConflicts(
      {
        id: editTarget ? editTarget.id : undefined,
        kelasId: formKelasId,
        guruId: formGuruId,
        hari: formHari,
        jamMulai: formJamMulai,
        jamSelesai: formJamSelesai,
      },
      schedules
    );
  }, [
    openModal,
    editTarget,
    formKelasId,
    formGuruId,
    formHari,
    formJamMulai,
    formJamSelesai,
    schedules,
  ]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditTarget(null);
    setFormKelasId(
      selectedScope === "CLASS" && selectedKelasId !== "ALL"
        ? selectedKelasId
        : classes[0]?.id || ""
    );
    setFormMapelId(subjects[0]?.id || "");
    setFormGuruId(teachers[0]?.id || "");
    setFormHari(selectedDay !== "Semua Hari" ? selectedDay : "Senin");
    setFormJamMulai("07:30");
    setFormJamSelesai("09:00");
    setAllowConflict(false);
    setOpenModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (s: ScheduleItem) => {
    setEditTarget(s);
    setFormKelasId(s.kelasId);
    setFormMapelId(s.mapelId);
    setFormGuruId(s.guruId);
    setFormHari(s.hari);
    setFormJamMulai(s.jamMulai);
    setFormJamSelesai(s.jamSelesai);
    setAllowConflict(false);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditTarget(null);
    setAllowConflict(false);
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (parseTimeToMinutes(formJamMulai) >= parseTimeToMinutes(formJamSelesai)) {
      toast.error("Jam selesai harus lebih akhir dari jam mulai.");
      return;
    }

    if (modalConflicts.length > 0 && !allowConflict) {
      toast.warning("Terdapat jadwal bentrok! Centang konfirmasi untuk tetap menyimpan.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("tahun_pelajaran", selectedYear);
    formData.set("semester", selectedSemester);
    if (allowConflict) {
      formData.set("allow_conflict", "true");
    }

    try {
      if (editTarget) {
        formData.set("id", editTarget.id);
        const res = await updateJadwalAction(formData);
        if (res.success) {
          toast.success(res.message);
          handleCloseModal();
          router.refresh();
        } else {
          toast.error(res.error || "Gagal memperbarui jadwal.");
        }
      } else {
        const res = await createJadwalAction(formData);
        if (res.success) {
          toast.success(res.message);
          handleCloseModal();
          router.refresh();
        } else {
          toast.error(res.error || "Gagal menambahkan jadwal.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await deleteJadwalAction(deleteTarget.id);
      if (res.success) {
        toast.success(res.message);
        setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Excel Export Handler
  const handleExportExcel = () => {
    try {
      if (filtered.length === 0) {
        toast.warning("Tidak ada data jadwal untuk diekspor.");
        return;
      }

      const scopeTitle =
        selectedScope === "CLASS"
          ? classes.find((c) => c.id === selectedKelasId)?.nama || "Per Kelas"
          : selectedScope === "SD"
          ? "Jenjang SD"
          : selectedScope === "SMP"
          ? "Jenjang SMP"
          : "Seluruh Sekolah";

      const title = `Jadwal Pelajaran ${scopeTitle} - ${selectedYear} Semester ${selectedSemester}`;
      const buffer = exportSchedulesToExcelBuffer(filtered, title);

      const blob = new Blob([buffer as any], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Jadwal_KBM_${scopeTitle.replace(/\s+/g, "_")}_${selectedYear.replace(/\//g, "-")}_Sem${selectedSemester}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("File Excel berhasil diunduh.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengekspor file Excel.";
      toast.error(msg);
    }
  };

  const conflictCount = conflictsMap.size;

  return (
    <div className="space-y-4">
      {/* Bentrok Alert Banner (Compact & Rapi) */}
      {conflictCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-xs transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold text-amber-950 dark:text-amber-100 truncate">
              Peringatan: Ditemukan{" "}
              <span className="font-bold underline underline-offset-2 decoration-amber-500">
                {conflictCount} jadwal bentrok
              </span>
            </p>
          </div>

          <Button
            type="button"
            variant={filterOnlyConflict ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterOnlyConflict(!filterOnlyConflict)}
            className={cn(
              "h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg gap-1.5 shrink-0 transition-all shadow-none",
              filterOnlyConflict
                ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs"
                : "border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
            )}
          >
            <Filter className="h-3.5 w-3.5 shrink-0" />
            <span>
              {filterOnlyConflict
                ? "Tampilkan Semua"
                : `Hanya Bentrok (${conflictCount})`}
            </span>
          </Button>
        </div>
      )}

      {/* Control Card 1: Periode & Filter Cakupan */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Periode Akademik: Tahun & Semester */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Periode:
            </span>

            {/* Tahun Pelajaran Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => {
                const newTahun = e.target.value;
                setSelectedYear(newTahun);
                handleNavigate({ tahun: newTahun });
              }}
              className="text-xs font-bold rounded-xl border border-input bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  T.A. {y}
                </option>
              ))}
            </select>

            {/* Semester Buttons */}
            <div className="flex items-center rounded-xl border border-input p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => {
                  setSelectedSemester("1");
                  handleNavigate({ semester: "1" });
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedSemester === "1"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sem 1 (Ganjil)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSemester("2");
                  handleNavigate({ semester: "2" });
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedSemester === "2"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sem 2 (Genap)
              </button>
            </div>
          </div>

          {/* Cakupan (Scope Filter): Semua, SD, SMP, Per Kelas */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground mr-1">Cakupan:</span>

            {adminJenjang === "ALL" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedScope("ALL");
                    setSelectedKelasId("ALL");
                    handleNavigate({ scope: "ALL", kelasId: "ALL" });
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedScope === "ALL"
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-muted/40 border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semua Kelas
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedScope("SD");
                    setSelectedKelasId("ALL");
                    handleNavigate({ scope: "SD", kelasId: "ALL" });
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedScope === "SD"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-muted/40 border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Jenjang SD
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedScope("SMP");
                    setSelectedKelasId("ALL");
                    handleNavigate({ scope: "SMP", kelasId: "ALL" });
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedScope === "SMP"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-muted/40 border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Jenjang SMP
                </button>
              </>
            )}

            {/* Filter Per Kelas Dropdown */}
            <select
              value={selectedScope === "CLASS" ? selectedKelasId : "ALL"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "ALL") {
                  setSelectedScope(adminJenjang === "ALL" ? "ALL" : activeJenjang);
                  setSelectedKelasId("ALL");
                  handleNavigate({
                    scope: adminJenjang === "ALL" ? "ALL" : activeJenjang,
                    kelasId: "ALL",
                  });
                } else {
                  setSelectedScope("CLASS");
                  setSelectedKelasId(val);
                  handleNavigate({ scope: "CLASS", kelasId: val });
                }
              }}
              className="text-xs font-semibold rounded-xl border border-input bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[210px]"
            >
              <option value="ALL">Pilih Kelas Tertentu...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama} ({c.jenjang})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Filter Hari (Senin - Sabtu) */}
        <div className="pt-2 border-t border-border flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {DAYS_LIST.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`text-xs px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedDay === day
                  ? "bg-primary/10 text-primary font-bold border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Control Card 2: Action Buttons & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari mapel, guru, NIY, kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-8 py-2 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action Group: Tambah, Import, Export, Semester Baru, Hapus */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            onClick={handleOpenAdd}
            size="sm"
            className="h-8 text-xs font-bold gap-1.5 rounded-xl shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Jadwal</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpenImportModal(true)}
            className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Import Excel</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border text-foreground hover:bg-muted/40"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpenPdfModal(true)}
            className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-rose-600/30 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Export PDF</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpenSemesterModal(true)}
            className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border text-foreground hover:bg-muted/40"
          >
            <CalendarPlus className="h-3.5 w-3.5 text-primary" />
            <span>Semester Baru</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpenBulkDeleteModal(true)}
            className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Hapus Massal</span>
          </Button>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-foreground text-sm">Tidak ada jadwal pelajaran ditemukan.</p>
            <p className="text-muted-foreground max-w-md mx-auto">
              {filterOnlyConflict
                ? "Tidak ada jadwal yang bentrok untuk filter saat ini."
                : "Belum ada jadwal yang terdaftar pada filter ini. Gunakan tombol 'Tambah Jadwal' atau 'Import Excel' untuk memulai."}
            </p>
            {filterOnlyConflict && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilterOnlyConflict(false)}
                className="mt-2 text-xs rounded-xl"
              >
                Tampilkan Semua Jadwal
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3 w-44">Kelas & Jenjang</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3">Guru Pengampu</th>
                  <th className="p-3">Hari & Waktu</th>
                  <th className="p-3 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((s) => {
                  const scheduleConflicts = conflictsMap.get(s.id);
                  const hasConflict = !!scheduleConflicts && scheduleConflicts.length > 0;
                  const isExpanded = expandedConflictId === s.id;

                  return (
                    <React.Fragment key={s.id}>
                      <tr
                        className={`transition-colors ${
                          hasConflict
                            ? "bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        {/* Kelas & Jenjang (Rapi & Minimalis) */}
                        <td className="p-3 font-semibold text-foreground">
                          <div className="space-y-0.5">
                            <span className="font-bold">{s.kelasNama}</span>
                            <div className="text-[11px] text-muted-foreground font-normal">
                              Jenjang {s.jenjang}
                            </div>
                          </div>
                        </td>

                        {/* Mata Pelajaran */}
                        <td className="p-3 font-medium text-foreground">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground">{s.mapelNama}</span>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              Kode: {s.mapelKode}
                            </div>
                          </div>
                        </td>

                        {/* Guru Pengampu (NIY Standar Al-Azhar) */}
                        <td className="p-3 text-foreground">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <User
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  hasConflict && scheduleConflicts.some((c) => c.type === "guru")
                                    ? "text-amber-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                              <span
                                className={
                                  hasConflict && scheduleConflicts.some((c) => c.type === "guru")
                                    ? "font-bold text-amber-900 dark:text-amber-300"
                                    : "font-semibold"
                                }
                              >
                                {s.guruNama}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground pl-5 font-mono">
                              NIY: {s.guruNiy || "-"}
                            </div>
                          </div>
                        </td>

                        {/* Hari & Waktu */}
                        <td className="p-3 text-foreground">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  hasConflict ? "text-amber-500" : "text-primary"
                                }`}
                              />
                              <span>
                                {s.hari}, {s.jamMulai} - {s.jamSelesai}
                              </span>
                            </div>

                            {/* Bentrok Warning Dropdown */}
                            {hasConflict && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedConflictId(isExpanded ? null : s.id)
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-all text-left"
                              >
                                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                <span>
                                  Bentrok:{" "}
                                  {Array.from(new Set(scheduleConflicts.map((c) => c.label))).join(
                                    " & "
                                  )}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="h-2.5 w-2.5 ml-0.5 shrink-0" />
                                ) : (
                                  <ChevronDown className="h-2.5 w-2.5 ml-0.5 shrink-0" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Aksi: Edit & Delete */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(s)}
                              className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 rounded-lg hover:bg-amber-500/10"
                              title="Edit Jadwal"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(s)}
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-500/10"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Conflict Details Row */}
                      {hasConflict && isExpanded && (
                        <tr className="bg-amber-500/10 border-l-4 border-l-amber-500">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="space-y-2 rounded-xl bg-card border border-amber-500/30 p-3 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  Rincian Jadwal Bentrok:
                                </span>
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  onClick={() => handleOpenEdit(s)}
                                  className="text-[11px] h-6 rounded-lg gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit Jadwal Ini
                                </Button>
                              </div>
                              <ul className="space-y-1.5 pl-1 text-[11px] text-foreground">
                                {scheduleConflicts.map((c, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                                    <div>
                                      <span className="font-semibold text-amber-700 dark:text-amber-300">
                                        [{c.label}]
                                      </span>{" "}
                                      <span>{c.description}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Schedule Dialog */}
      <Dialog open={openModal} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl max-w-[calc(100%-2rem)] rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              {editTarget ? (
                <>
                  <Pencil className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  <span>Edit Jadwal Pelajaran</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>Tambah Jadwal Pelajaran ({selectedYear} Sem {selectedSemester})</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Grid 2 Kolom untuk Kelas & Mata Pelajaran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold block mb-1">Rombongan Belajar (Kelas) *</label>
                <ClassSearchSelect
                  classes={classes}
                  value={formKelasId}
                  onChange={(newId) => setFormKelasId(newId)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Mata Pelajaran *</label>
                <SubjectSearchSelect
                  subjects={subjects}
                  value={formMapelId}
                  onChange={(newId) => setFormMapelId(newId)}
                  required
                />
              </div>
            </div>

            {/* Guru Pengampu Selector */}
            <div>
              <label className="text-xs font-bold block mb-1">Guru Pengampu *</label>
              <TeacherSearchSelect
                teachers={teachers}
                value={formGuruId}
                onChange={(newId) => setFormGuruId(newId)}
                required
              />
            </div>

            {/* Hari & Jam */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1">Hari *</label>
                <select
                  name="hari"
                  value={formHari}
                  onChange={(e) => setFormHari(e.target.value)}
                  className="w-full text-xs rounded-xl border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Mulai *</label>
                <input
                  type="time"
                  name="jam_mulai"
                  value={formJamMulai}
                  onChange={(e) => setFormJamMulai(e.target.value)}
                  className="w-full text-xs rounded-xl border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Selesai *</label>
                <input
                  type="time"
                  name="jam_selesai"
                  value={formJamSelesai}
                  onChange={(e) => setFormJamSelesai(e.target.value)}
                  className="w-full text-xs rounded-xl border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Live Conflict Warning inside Dialog */}
            {modalConflicts.length > 0 && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Peringatan: Jadwal Ini Mengalami Bentrok!</span>
                </div>
                <ul className="space-y-1 pl-4 text-[11px] text-amber-900 dark:text-amber-200 list-disc">
                  {modalConflicts.map((c, idx) => (
                    <li key={idx}>
                      <strong>{c.label}:</strong> {c.description}
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-amber-500/20 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_conflict"
                    checked={allowConflict}
                    onChange={(e) => setAllowConflict(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  <label
                    htmlFor="allow_conflict"
                    className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 cursor-pointer select-none"
                  >
                    Tetap simpan jadwal meskipun ada bentrok
                  </label>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleCloseModal}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="font-bold text-xs gap-1.5 rounded-xl"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>{editTarget ? "Simpan Perubahan" : "Simpan Jadwal"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Single Schedule Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-rose-600 dark:text-rose-400">
              Hapus Jadwal Pelajaran
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Apakah Anda yakin ingin menghapus jadwal <strong>{deleteTarget?.mapelNama}</strong> di kelas{" "}
            <strong>{deleteTarget?.kelasNama}</strong> ({deleteTarget?.hari}, {deleteTarget?.jamMulai} -{" "}
            {deleteTarget?.jamSelesai})?
          </p>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="text-xs font-bold rounded-xl"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Hapus Jadwal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 1: Import Excel */}
      <ImportExcelModal
        open={openImportModal}
        onOpenChange={setOpenImportModal}
        currentTahun={selectedYear}
        currentSemester={selectedSemester}
        availableYears={availableYears}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Modal 2: Export PDF */}
      <ExportPdfModal
        open={openPdfModal}
        onOpenChange={setOpenPdfModal}
        classes={classes}
        currentTahun={selectedYear}
        currentSemester={selectedSemester}
        currentScope={selectedScope}
        currentKelasId={selectedKelasId}
        schedules={filtered}
      />

      {/* Modal 3: Semester Baru & Salin Jadwal */}
      <NewSemesterModal
        open={openSemesterModal}
        onOpenChange={setOpenSemesterModal}
        currentTahun={selectedYear}
        currentSemester={selectedSemester}
        availableYears={availableYears}
        onSuccess={(newTahun, newSemester) => {
          setSelectedYear(newTahun);
          setSelectedSemester(newSemester);
          handleNavigate({ tahun: newTahun, semester: newSemester });
        }}
      />

      {/* Modal 4: Bulk Delete */}
      <BulkDeleteModal
        open={openBulkDeleteModal}
        onOpenChange={setOpenBulkDeleteModal}
        currentTahun={selectedYear}
        currentSemester={selectedSemester}
        currentScope={selectedScope}
        classes={classes}
        initialClassId={selectedKelasId}
        scheduleCount={filtered.length}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
