"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Search,
  CheckCircle2,
  Save,
  Trash2,
  MessageSquare,
  X,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createSubjectAttendanceAction,
  deleteSubjectAttendanceAction,
} from "@/actions/guru";
import { formatDateIndo, cn } from "@/lib/utils";
import { toast } from "sonner";

export interface StudentDetailItem {
  id: string;
  name: string;
  nis: string;
  gender: string;
  image?: string | null;
  keterangan: "Hadir" | "Sakit" | "Izin" | "Alpha";
  catatan?: string;
}

interface AdminAttendanceDetailClientProps {
  dateStr: string;
  kelasId: string;
  kelasNama: string;
  kelasJenjang: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  teacherName?: string | null;
  jamKbm?: string | null;
  jadwalId?: string | null;
  initialStudents: StudentDetailItem[];
  isAlreadyFilled: boolean;
}

const STATUS_OPTIONS: Array<"Hadir" | "Sakit" | "Izin" | "Alpha"> = [
  "Hadir",
  "Sakit",
  "Izin",
  "Alpha",
];

export function AdminAttendanceDetailClient({
  dateStr,
  kelasId,
  kelasNama,
  kelasJenjang,
  mapelId,
  mapelNama,
  mapelKode,
  teacherName,
  jamKbm,
  jadwalId,
  initialStudents,
  isAlreadyFilled,
}: AdminAttendanceDetailClientProps) {
  const router = useRouter();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "Hadir" | "Sakit" | "Izin" | "Alpha"
  >("ALL");
  const [selectedDate, setSelectedDate] = useState(dateStr);

  // Attendance Records Map: userId -> { keterangan, catatan }
  const [records, setRecords] = useState<
    Record<
      string,
      { keterangan: "Hadir" | "Sakit" | "Izin" | "Alpha"; catatan: string }
    >
  >(() => {
    const map: Record<
      string,
      { keterangan: "Hadir" | "Sakit" | "Izin" | "Alpha"; catatan: string }
    > = {};
    initialStudents.forEach((s) => {
      map[s.id] = {
        keterangan: s.keterangan || "Hadir",
        catatan: s.catatan || "",
      };
    });
    return map;
  });

  // Note expansion visibility per student
  const [showNotes, setShowNotes] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialStudents.forEach((s) => {
      if (s.catatan && s.catatan.trim().length > 0) {
        map[s.id] = true;
      }
    });
    return map;
  });

  // Delete modal confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Student Photo / Profile Preview Modal state
  const [previewStudent, setPreviewStudent] = useState<StudentDetailItem | null>(null);

  // Real-time Counts
  const counts = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpha = 0;

    Object.values(records).forEach((r) => {
      if (r.keterangan === "Hadir") hadir++;
      else if (r.keterangan === "Sakit") sakit++;
      else if (r.keterangan === "Izin") izin++;
      else if (r.keterangan === "Alpha") alpha++;
    });

    const total = initialStudents.length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { total, hadir, sakit, izin, alpha, rate };
  }, [records, initialStudents.length]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return initialStudents.filter((item) => {
      // Status filter
      if (statusFilter !== "ALL") {
        const itemStatus = records[item.id]?.keterangan || "Hadir";
        if (itemStatus !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchNis = (item.nis || "").toLowerCase().includes(q);
        if (!matchName && !matchNis) return false;
      }

      return true;
    });
  }, [initialStudents, records, statusFilter, searchQuery]);

  // Handlers
  const handleStatusChange = (
    userId: string,
    status: "Hadir" | "Sakit" | "Izin" | "Alpha"
  ) => {
    setRecords((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        keterangan: status,
      },
    }));
  };

  const handleCatatanChange = (userId: string, catatan: string) => {
    setRecords((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        catatan,
      },
    }));
  };

  const handleSetAll = (status: "Hadir" | "Sakit" | "Izin" | "Alpha") => {
    const updated: Record<
      string,
      { keterangan: "Hadir" | "Sakit" | "Izin" | "Alpha"; catatan: string }
    > = {};
    initialStudents.forEach((s) => {
      updated[s.id] = {
        keterangan: status,
        catatan: records[s.id]?.catatan || "",
      };
    });
    setRecords(updated);
    toast.info(`Semua siswa diatur ke status: ${status}`);
  };

  const handleResetToDefault = () => {
    const map: Record<
      string,
      { keterangan: "Hadir" | "Sakit" | "Izin" | "Alpha"; catatan: string }
    > = {};
    initialStudents.forEach((s) => {
      map[s.id] = {
        keterangan: s.keterangan || "Hadir",
        catatan: s.catatan || "",
      };
    });
    setRecords(map);
    toast.info("Perubahan presensi telah di-reset.");
  };

  const handleDateChange = (newDate: string) => {
    if (newDate && newDate !== dateStr) {
      setSelectedDate(newDate);
      router.push(
        `/admin/attendance/detail?kelas=${encodeURIComponent(
          kelasNama
        )}&date=${newDate}&mapel=${encodeURIComponent(mapelNama)}`
      );
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = Object.entries(records).map(([userId, item]) => ({
      userId,
      keterangan: item.keterangan,
      catatan: item.catatan.trim() || undefined,
    }));

    try {
      const res = await createSubjectAttendanceAction({
        date: dateStr,
        kelas: kelasNama,
        kelasId,
        mapelId,
        jadwalId: jadwalId || undefined,
        records: payload,
      });

      if (res.success) {
        toast.success(res.message || "Presensi berhasil disimpan.");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyimpan presensi.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteAttendance = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteSubjectAttendanceAction(
        dateStr,
        kelasNama,
        mapelId
      );

      if (res.success) {
        toast.success(res.message || "Data presensi berhasil dihapus.");
        setDeleteModalOpen(false);
        router.push(`/admin/attendance?date=${dateStr}`);
      } else {
        toast.error(res.error || "Gagal menghapus data presensi.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pb-24 sm:pb-28">
      {/* 1. Header & Navigation Area */}
      <div className="space-y-2">
        <Link
          href={`/admin/attendance?date=${dateStr}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Kembali ke Monitoring Presensi</span>
        </Link>

        {/* Title Card (Lebih Rapi, Bersih, dan Simpel) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            {/* Sisi Kiri: Mapel, Kode, Kelas, Tanggal, Guru, Jam KBM */}
            <div className="space-y-1.5 min-w-0">
              {/* Baris 1: Judul Mapel & Identitas Kelas */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-foreground">
                  {mapelNama}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {kelasNama} 
                </span>
              </div>

              {/* Baris 2: Meta Tanggal KBM, Guru, Jam KBM (Rapi & Terstruktur) */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-muted-foreground">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  {formatDateIndo(dateStr)}
                </span>

                {teacherName && (
                  <>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>
                        Guru: <strong className="text-foreground font-semibold">{teacherName}</strong>
                      </span>
                    </span>
                  </>
                )}

                {jamKbm && (
                  <>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{jamKbm}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Sisi Kanan: Status Presensi & Pemilih Tanggal */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pt-1 md:pt-0">
              <span
                className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 border whitespace-nowrap",
                  isAlreadyFilled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isAlreadyFilled ? "bg-emerald-600" : "bg-amber-600"
                  )}
                />
                <span>{isAlreadyFilled ? `Tercatat ` : "Belum Diisi Guru"}</span>
              </span>

              {/* Pemilih Tanggal */}
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="text-xs font-medium rounded-xl border border-input bg-card px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8 cursor-pointer shadow-2xs"
                  title="Ubah Tanggal Presensi"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari siswa (nama / NIS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 pr-8 h-9 text-xs rounded-xl bg-card border-border shadow-2xs"
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

        {/* Quick Set All Button */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSetAll("Hadir")}
            className="h-9 text-xs font-semibold rounded-xl border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 gap-1.5 cursor-pointer shadow-2xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Set Semua Hadir</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToDefault}
            className="h-9 text-xs text-muted-foreground hover:text-foreground rounded-xl gap-1 cursor-pointer"
            title="Kembalikan status ke awal"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs Active Badge Indicator */}
      {statusFilter !== "ALL" && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs">
          <span className="text-muted-foreground">
            Menampilkan siswa berstatus: <strong className="text-foreground">{statusFilter}</strong>
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Tampilkan Semua Siswa</span>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 4. Student Attendance List (Mobile, iPad, Desktop Optimized) */}
      <div className="space-y-2">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-card border border-border text-muted-foreground text-xs space-y-1.5">
            <p className="font-semibold text-foreground">Tidak ada data siswa ditemukan.</p>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "ALL"
                ? "Coba sesuaikan kata kunci pencarian atau reset filter status."
                : "Belum ada siswa aktif yang terdaftar di kelas ini."}
            </p>
          </div>
        ) : (
          filteredStudents.map((student, idx) => {
            const currentStatus = records[student.id]?.keterangan || "Hadir";
            const currentCatatan = records[student.id]?.catatan || "";
            const isNoteOpen = showNotes[student.id] || Boolean(currentCatatan);

            return (
              <div
                key={student.id}
                className={cn(
                  "p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 bg-card shadow-2xs space-y-2.5",
                  currentStatus === "Hadir" && "border-border hover:border-emerald-500/40",
                  currentStatus === "Sakit" && "border-sky-500/40 bg-sky-500/5",
                  currentStatus === "Izin" && "border-amber-500/40 bg-amber-500/5",
                  currentStatus === "Alpha" && "border-rose-500/40 bg-rose-500/5"
                )}
              >
                {/* Main Row: Info Siswa + Status Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Left: Info Siswa */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground/60 w-5 text-right shrink-0">
                      {idx + 1}.
                    </span>

                    {/* Clickable Profile Photo */}
                    <button
                      type="button"
                      onClick={() => setPreviewStudent(student)}
                      className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0 overflow-hidden ring-2 ring-border/80 hover:ring-primary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs group"
                      title={`Klik untuk melihat foto profil ${student.name}`}
                    >
                      <img
                        src={
                          student.image ||
                          (student.gender === "P"
                            ? "/profil-default-perempuan.avif"
                            : "/profil-default-laki-laki.avif")
                        }
                        alt={student.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src =
                            student.gender === "P"
                              ? "/profil-default-perempuan.avif"
                              : "/profil-default-laki-laki.avif";
                        }}
                      />
                    </button>

                    {/* Nama & NIS */}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate leading-tight">
                        {student.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono leading-tight mt-0.5">
                        NIS: {student.nis || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status Segmented Controls & Note Toggle */}
                  <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-end pt-1 sm:pt-0">
                    <div className="grid grid-cols-4 sm:flex items-center gap-1 w-full sm:w-auto p-1 rounded-xl bg-muted/50 border border-border/60">
                      {STATUS_OPTIONS.map((status) => {
                        const isActive = currentStatus === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleStatusChange(student.id, status)}
                            className={cn(
                              "text-xs font-bold py-1 sm:py-1 px-2.5 sm:px-3 rounded-lg transition-all text-center cursor-pointer",
                              isActive && status === "Hadir" && "bg-emerald-600 text-white shadow-xs",
                              isActive && status === "Sakit" && "bg-sky-600 text-white shadow-xs",
                              isActive && status === "Izin" && "bg-amber-600 text-white shadow-xs",
                              isActive && status === "Alpha" && "bg-rose-600 text-white shadow-xs",
                              !isActive && "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>

                    {/* Note Expander Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowNotes((prev) => ({
                          ...prev,
                          [student.id]: !prev[student.id],
                        }))
                      }
                      title="Tambah Catatan"
                      className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer",
                        currentCatatan.trim()
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                          : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Catatan Khusus Input */}
                {isNoteOpen && (
                  <div className="pt-2 border-t border-border/50 pl-7 sm:pl-9 flex items-center gap-2">
                    <Input
                      placeholder="Catatan khusus (misal: Izin ke UKS, terlambat 15 menit, surat dokter terlampir)..."
                      value={currentCatatan}
                      onChange={(e) => handleCatatanChange(student.id, e.target.value)}
                      className="h-8 text-xs rounded-xl bg-background border-border/80"
                    />
                    {currentCatatan && (
                      <button
                        type="button"
                        onClick={() => handleCatatanChange(student.id, "")}
                        className="text-muted-foreground hover:text-foreground p-1 text-xs"
                        title="Hapus catatan"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Sticky Floating Action Bar (Mobile, iPad, Desktop) */}
      <div className="fixed bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-4 max-w-4xl mx-auto z-30">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-card/95 dark:bg-card/90 backdrop-blur-md border border-border shadow-xl flex items-center justify-between gap-2.5">
          {/* Left: Delete Button (Hanya tampil jika presensi sudah ada) */}
          <div>
            {isAlreadyFilled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
                disabled={isSubmitting}
                className="h-9 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-500/30 rounded-xl gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hapus Presensi</span>
              </Button>
            )}
          </div>

          {/* Right: Batal & Simpan Actions */}
          <div className="flex items-center gap-2">
            <Link href={`/admin/attendance?date=${dateStr}`}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-xs rounded-xl text-muted-foreground hover:text-foreground"
              >
                Batal
              </Button>
            </Link>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-9 px-4 sm:px-5 font-bold text-xs gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan Presensi"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 6. Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Hapus Data Presensi?</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            Apakah Anda yakin ingin menghapus seluruh data presensi untuk mata pelajaran{" "}
            <strong className="text-foreground">{mapelNama}</strong> di kelas{" "}
            <strong className="text-foreground">{kelasNama}</strong> pada tanggal{" "}
            <strong className="text-foreground">{formatDateIndo(dateStr)}</strong>?
            Status kehadiran seluruh siswa pada sesi ini akan di-reset.
          </p>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
              className="text-xs rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteAttendance}
              disabled={isDeleting}
              className="font-bold text-xs gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Hapus Sekarang</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Student Photo Preview Modal (Satu Card Saja, Rapi & Simpel) */}
      <Dialog
        open={!!previewStudent}
        onOpenChange={(open) => !open && setPreviewStudent(null)}
      >
        <DialogContent className="max-w-[280px] sm:max-w-xs rounded-3xl p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl bg-card">
          <DialogTitle className="sr-only">Foto Profil Siswa</DialogTitle>

          {previewStudent && (
            <img
              src={
                previewStudent.image ||
                (previewStudent.gender === "P"
                  ? "/profil-default-perempuan.avif"
                  : "/profil-default-laki-laki.avif")
              }
              alt={previewStudent.name}
              className="w-full aspect-square object-cover block"
            />
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}

