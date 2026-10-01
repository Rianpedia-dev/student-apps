"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Calendar,
  Clock,
  School,
  User,
  BookOpen,
  Loader2,
  Check,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { compareScheduleTime } from "@/lib/utils";

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
  hari: string;
  jamMulai: string;
  jamSelesai: string;
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
  subjects: Array<{ id: string; nama: string; kode: string }>;
  teachers: Array<{ id: string; nama: string; bidang?: string | null }>;
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

export function SchedulesManager({
  initialSchedules,
  classes,
  subjects,
  teachers,
}: SchedulesManagerProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [selectedJenjang, setSelectedJenjang] = useState<"ALL" | "SD" | "SMP">("ALL");
  const [filterOnlyConflict, setFilterOnlyConflict] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedConflictId, setExpandedConflictId] = useState<string | null>(null);

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ScheduleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form values state for real-time conflict checking inside modal
  const [formKelasId, setFormKelasId] = useState<string>("");
  const [formMapelId, setFormMapelId] = useState<string>("");
  const [formGuruId, setFormGuruId] = useState<string>("");
  const [formHari, setFormHari] = useState<string>("Senin");
  const [formJamMulai, setFormJamMulai] = useState<string>("07:30");
  const [formJamSelesai, setFormJamSelesai] = useState<string>("09:00");
  const [allowConflict, setAllowConflict] = useState<boolean>(false);

  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

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
      const matchClass = selectedClassId === "ALL" || s.kelasId === selectedClassId;
      const matchJenjang = selectedJenjang === "ALL" || s.jenjang === selectedJenjang;
      const matchConflict = !filterOnlyConflict || conflictsMap.has(s.id);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.mapelNama.toLowerCase().includes(q) ||
        s.mapelKode.toLowerCase().includes(q) ||
        s.guruNama.toLowerCase().includes(q) ||
        s.kelasNama.toLowerCase().includes(q) ||
        s.hari.toLowerCase().includes(q);

      return matchClass && matchJenjang && matchConflict && matchSearch;
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
  }, [schedules, selectedClassId, selectedJenjang, filterOnlyConflict, searchQuery, conflictsMap]);

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
    setFormKelasId(classes[0]?.id || "");
    setFormMapelId(subjects[0]?.id || "");
    setFormGuruId(teachers[0]?.id || "");
    setFormHari("Senin");
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
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
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
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const conflictCount = conflictsMap.size;

  return (
    <div className="space-y-4">
      {/* Bentrok Alert Banner */}
      {conflictCount > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-4 sm:p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                    Peringatan: Ditemukan {conflictCount} Jadwal Bentrok!
                  </h3>
                  <Badge variant="amber" size="xs" className="font-semibold">
                    Perlu Penyesuaian
                  </Badge>
                </div>
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  Terdapat tabrakan jam mengajar guru atau jadwal kelas pada hari dan jam yang sama.
                  Gunakan tombol <strong>Edit</strong> pada jadwal terkait untuk menyesuaikan jam atau gurunya.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <Button
                type="button"
                variant={filterOnlyConflict ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterOnlyConflict(!filterOnlyConflict)}
                className={`text-xs font-bold rounded-xl gap-1.5 transition-all ${filterOnlyConflict
                    ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs"
                    : "border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/15"
                  }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>{filterOnlyConflict ? "Tampilkan Semua Jadwal" : `Tampilkan Hanya Yang Bentrok (${conflictCount})`}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Controls: Jenjang filter, Class selector, Search and Add button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["ALL", "SD", "SMP"] as const).map((jenjang) => (
            <button
              key={jenjang}
              type="button"
              onClick={() => {
                setSelectedJenjang(jenjang);
                setSelectedClassId("ALL");
              }}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${selectedJenjang === jenjang
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
            >
              {jenjang === "ALL" ? "Semua Jenjang" : `Jenjang ${jenjang}`}
            </button>
          ))}

          {/* Class Dropdown Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs rounded-xl border border-input bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Semua Kelas</option>
            {classes
              .filter((c) => selectedJenjang === "ALL" || c.jenjang === selectedJenjang)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama} ({c.jenjang})
                </option>
              ))}
          </select>

          {/* Quick conflict toggle button if conflicts exist */}
          {conflictCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterOnlyConflict(!filterOnlyConflict)}
              className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all ${filterOnlyConflict
                  ? "bg-rose-500 text-white shadow-xs"
                  : "bg-card border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>{filterOnlyConflict ? "Filter Aktif (Bentrok Saja)" : `Bentrok (${conflictCount})`}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari mapel, guru, kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <Button
            type="button"
            onClick={handleOpenAdd}
            size="sm"
            className="h-8 text-xs font-bold gap-1.5 rounded-xl shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Jadwal Kelas</span>
          </Button>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="font-semibold text-foreground">Tidak ada jadwal pelajaran ditemukan.</p>
            <p className="text-muted-foreground">
              {filterOnlyConflict
                ? "Tidak ada jadwal yang bentrok untuk filter saat ini."
                : "Coba ubah filter kelas, jenjang, atau kata kunci pencarian Anda."}
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
                  <th className="p-3">Kelas & Jenjang</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3">Guru Pengampu</th>
                  <th className="p-3">Hari & Waktu</th>
                  <th className="p-3 text-right">Aksi</th>
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
                        className={`transition-colors ${hasConflict
                            ? "bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500"
                            : "hover:bg-muted/30"
                          }`}
                      >
                        {/* Kelas & Jenjang */}
                        <td className="p-3 font-bold text-foreground">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant={s.jenjang === "SMP" ? "indigo" : "emerald"} size="sm">
                              {s.jenjang}
                            </Badge>
                            <span>{s.kelasNama}</span>
                          </div>
                        </td>

                        {/* Mata Pelajaran */}
                        <td className="p-3 font-semibold text-foreground">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="purple" size="xs" className="font-mono">
                              {s.mapelKode}
                            </Badge>
                            <span>{s.mapelNama}</span>
                          </div>
                        </td>

                        {/* Guru Pengampu */}
                        <td className="p-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className={`h-3 w-3 shrink-0 ${hasConflict && scheduleConflicts.some(c => c.type === "guru") ? "text-amber-500" : "text-primary"}`} />
                            <span className={hasConflict && scheduleConflicts.some(c => c.type === "guru") ? "font-semibold text-amber-900 dark:text-amber-300" : ""}>
                              {s.guruNama}
                            </span>
                          </div>
                        </td>

                        {/* Hari & Waktu */}
                        <td className="p-3 font-medium text-foreground">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Clock className={`h-3 w-3 shrink-0 ${hasConflict ? "text-amber-500" : "text-primary"}`} />
                              <span>{s.hari}, {s.jamMulai} - {s.jamSelesai}</span>
                            </div>

                            {/* Bentrok Pill & Details Toggle */}
                            {hasConflict && (
                              <button
                                type="button"
                                onClick={() => setExpandedConflictId(isExpanded ? null : s.id)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-all text-left"
                                title="Klik untuk melihat rincian bentrok"
                              >
                                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                <span>Bentrok: {Array.from(new Set(scheduleConflicts.map(c => c.label))).join(" & ")}</span>
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
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-500/10"
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
                            <div className="space-y-2 rounded-xl bg-card/80 border border-amber-500/30 p-3 shadow-2xs">
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
                                      <span className="font-semibold text-amber-700 dark:text-amber-300">[{c.label}]</span>{" "}
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {editTarget ? (
                <>
                  <Pencil className="h-4 w-4 text-amber-500" />
                  <span>Edit Jadwal Pelajaran</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-primary" />
                  <span>Tambah Jadwal Pelajaran</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
            {/* Kelas Selector */}
            <div>
              <label className="text-xs font-bold block mb-1">Rombongan Belajar (Kelas) *</label>
              <select
                name="kelas_id"
                value={formKelasId}
                onChange={(e) => setFormKelasId(e.target.value)}
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <optgroup label="── Sekolah Dasar (SD) ──">
                  {classes
                    .filter((c) => c.jenjang === "SD")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="── Sekolah Menengah Pertama (SMP) ──">
                  {classes
                    .filter((c) => c.jenjang === "SMP")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Mata Pelajaran Selector */}
            <div>
              <label className="text-xs font-bold block mb-1">Mata Pelajaran *</label>
              <select
                name="mapel_id"
                value={formMapelId}
                onChange={(e) => setFormMapelId(e.target.value)}
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kode})
                  </option>
                ))}
              </select>
            </div>

            {/* Guru Pengampu Selector */}
            <div>
              <label className="text-xs font-bold block mb-1">Guru Pengampu *</label>
              <select
                name="guru_id"
                value={formGuruId}
                onChange={(e) => setFormGuruId(e.target.value)}
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama} {t.bidang ? `(${t.bidang})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Hari & Jam */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold block mb-1">Hari *</label>
                <select
                  name="hari"
                  value={formHari}
                  onChange={(e) => setFormHari(e.target.value)}
                  className="w-full text-xs rounded-xl border border-input bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary"
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
                  className="w-full text-xs rounded-xl border border-input bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary"
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
                  className="w-full text-xs rounded-xl border border-input bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary"
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
                className="font-bold text-xs gap-1.5"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-red-600">Hapus Jadwal Pelajaran</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Apakah Anda yakin ingin menghapus jadwal <strong>{deleteTarget?.mapelNama}</strong> di kelas{" "}
            <strong>{deleteTarget?.kelasNama}</strong> ({deleteTarget?.hari}, {deleteTarget?.jamMulai} - {deleteTarget?.jamSelesai})?
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
              className="text-xs font-bold"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Hapus Jadwal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
