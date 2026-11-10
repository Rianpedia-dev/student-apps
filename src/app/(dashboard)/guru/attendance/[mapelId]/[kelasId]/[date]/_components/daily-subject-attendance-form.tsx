"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Trash2,
  CheckCircle2,
  User,
  ArrowLeft,
  Calendar,
  Clock,
  Search,
  MessageSquare,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSubjectAttendanceAction, deleteSubjectAttendanceAction } from "@/actions/guru";
import { toast } from "sonner";
import { cn, getUserProfileImage } from "@/lib/utils";

interface StudentRecordItem {
  id: string;
  name: string;
  nis: string;
  gender: string;
  image?: string | null;
  keterangan: "Hadir" | "Sakit" | "Izin" | "Alpha";
  catatan?: string;
}

interface DailySubjectAttendanceFormProps {
  dateStr: string;
  kelasId: string;
  kelasNama: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  mapelWarna?: string;
  jadwalId?: string;
  jamKe?: string;
  initialStudents: StudentRecordItem[];
  isAlreadyFilled: boolean;
}

export function DailySubjectAttendanceForm({
  dateStr,
  kelasId,
  kelasNama,
  mapelId,
  mapelNama,
  mapelKode,
  mapelWarna = "emerald",
  jadwalId,
  jamKe,
  initialStudents,
  isAlreadyFilled,
}: DailySubjectAttendanceFormProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(dateStr);
  const [previewStudent, setPreviewStudent] = useState<StudentRecordItem | null>(null);

  const [records, setRecords] = useState<
    Record<string, { keterangan: "Hadir" | "Sakit" | "Izin" | "Alpha"; catatan: string }>
  >(() => {
    const map: Record<string, { keterangan: "Hadir" | "Sakit" | "Izin" | "Alpha"; catatan: string }> = {};
    initialStudents.forEach((s) => {
      map[s.id] = {
        keterangan: s.keterangan || "Hadir",
        catatan: s.catatan || "",
      };
    });
    return map;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotes, setShowNotes] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialStudents.forEach((s) => {
      if (s.catatan) map[s.id] = true;
    });
    return map;
  });

  const handleStatusChange = (userId: string, status: "Hadir" | "Sakit" | "Izin" | "Alpha") => {
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
    toast.info(`Seluruh siswa diatur ke status: ${status}`);
  };

  const filteredStudents = initialStudents.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nis || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        jadwalId,
        jamKe,
        records: payload,
      });

      if (res.success) {
        toast.success(res.message);
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/guru/attendance");
        }
      } else {
        toast.error(res.error || "Gagal menyimpan presensi.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Hapus seluruh data presensi ${mapelNama} di ${kelasNama} tanggal ${dateStr}?`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await deleteSubjectAttendanceAction(dateStr, kelasNama, mapelId);
      if (res.success) {
        toast.success(res.message);
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/guru/attendance");
        }
      } else {
        toast.error(res.error || "Gagal menghapus data presensi.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    if (newDate && newDate !== dateStr) {
      router.replace(`/guru/attendance/${mapelId}/${kelasId}/${newDate}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pb-20">
      {/* Top Controls Toolbar: Date Picker, Quick Set 1-Click, & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Date Switcher & Quick Set All */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-border/80 bg-card/95 dark:bg-card/90 shadow-2xs backdrop-blur-md">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 shrink-0">
              <Calendar className="h-4 w-4 text-orange-500" /> Tanggal KBM:
            </span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                handleDateChange(e.target.value);
              }}
              className="w-38 h-8 text-xs rounded-xl bg-background border border-border/50 font-semibold px-2"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSetAll("Hadir")}
            className="gap-2 text-xs font-bold rounded-2xl border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 h-10 px-4 cursor-pointer shadow-2xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Semua Hadir (1-Click)</span>
          </Button>
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full md:w-72 lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari siswa berdasarkan nama atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-10 text-xs rounded-2xl bg-card/95 dark:bg-card/90 border-border/80 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Compact & Wide Student List Container */}
      <div className="rounded-3xl border border-border/80 bg-card/95 dark:bg-card/90 shadow-sm backdrop-blur-md overflow-hidden divide-y divide-border/60">
        {/* Table Header (Desktop & Tablet) */}
        <div className="hidden md:flex items-center px-4 sm:px-6 py-3 bg-muted/40 border-b border-border/60 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <span className="w-8 text-center shrink-0">No</span>
          <span className="w-10 shrink-0 text-center">Foto</span>
          <span className="flex-1 min-w-0 pl-2">Nama & NIS Siswa</span>
          <span className="w-72 lg:w-80 text-center shrink-0">Status Kehadiran</span>
          <span className="w-12 text-center shrink-0">Catatan</span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs space-y-1">
            <p className="font-semibold text-foreground">Tidak ada siswa yang sesuai.</p>
            <p className="text-[11px]">Coba ubah kata kunci pencarian Anda.</p>
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
                  "transition-colors",
                  currentStatus === "Hadir" && "hover:bg-muted/30",
                  currentStatus === "Sakit" && "bg-sky-500/5 hover:bg-sky-500/10",
                  currentStatus === "Izin" && "bg-amber-500/5 hover:bg-amber-500/10",
                  currentStatus === "Alpha" && "bg-rose-500/8 hover:bg-rose-500/12"
                )}
              >
                {/* Desktop & Tablet Row (md and up) */}
                <div className="hidden md:flex items-center px-4 sm:px-6 py-2.5 sm:py-3 gap-0">
                  {/* No */}
                  <span className="w-8 text-center text-xs font-bold text-muted-foreground/70 shrink-0">
                    {idx + 1}
                  </span>

                  {/* Foto Profil Siswa */}
                  <div className="w-10 shrink-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setPreviewStudent(student)}
                      className="relative h-8 w-8 rounded-full overflow-hidden ring-1.5 ring-border/80 hover:ring-primary hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-2xs group"
                      title={`Klik untuk melihat foto profil ${student.name}`}
                    >
                      <img
                        src={getUserProfileImage(student.image, student.gender, student.name)}
                        alt={student.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src = getUserProfileImage(null, student.gender, student.name);
                        }}
                      />
                    </button>
                  </div>

                  {/* Nama & NIS Siswa */}
                  <div className="flex-1 min-w-0 pl-2 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {student.name}
                      </p>
                      {currentCatatan && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md truncate max-w-[220px]">
                          {currentCatatan}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-muted-foreground font-mono">
                      NIS: {student.nis || "-"}
                    </p>
                  </div>

                  {/* Status Kehadiran (Pill Segmented Group) */}
                  <div className="w-72 lg:w-80 shrink-0 flex items-center justify-center">
                    <div className="grid grid-cols-4 w-full p-1 rounded-xl bg-muted/70 dark:bg-muted/40 border border-border/70 gap-1">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, "Hadir")}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                          currentStatus === "Hadir"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        title="Tandai Hadir"
                      >
                        Hadir
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, "Sakit")}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                          currentStatus === "Sakit"
                            ? "bg-sky-600 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        title="Tandai Sakit"
                      >
                        Sakit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, "Izin")}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                          currentStatus === "Izin"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        title="Tandai Izin"
                      >
                        Izin
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, "Alpha")}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                          currentStatus === "Alpha"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        title="Tandai Alpha"
                      >
                        Alpha
                      </button>
                    </div>
                  </div>

                  {/* Tombol Catatan */}
                  <div className="w-12 shrink-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setShowNotes((prev) => ({
                          ...prev,
                          [student.id]: !prev[student.id],
                        }))
                      }
                      title={currentCatatan ? `Catatan: ${currentCatatan}` : "Tambah Catatan KBM"}
                      className={cn(
                        "p-2 rounded-xl text-xs transition-all shrink-0 cursor-pointer border",
                        currentCatatan
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-2xs"
                          : "border-transparent text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile Row (sm and down) */}
                <div className="md:hidden flex flex-col gap-2.5 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground/70 w-5 shrink-0 text-center">
                        {idx + 1}.
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewStudent(student)}
                        className="relative h-9 w-9 rounded-full overflow-hidden ring-1.5 ring-border/80 shrink-0"
                      >
                        <img
                          src={getUserProfileImage(student.image, student.gender, student.name)}
                          alt={student.name}
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {student.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          NIS: {student.nis || "-"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowNotes((prev) => ({
                          ...prev,
                          [student.id]: !prev[student.id],
                        }))
                      }
                      className={cn(
                        "p-2 rounded-xl text-xs shrink-0 border",
                        currentCatatan
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                          : "border-transparent text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Status buttons on mobile: full width grid with 4 equal columns */}
                  <div className="grid grid-cols-4 p-1 rounded-xl bg-muted/70 dark:bg-muted/40 border border-border/70 gap-1">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "Hadir")}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg text-center transition-all cursor-pointer",
                        currentStatus === "Hadir"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-muted-foreground"
                      )}
                    >
                      Hadir
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "Sakit")}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg text-center transition-all cursor-pointer",
                        currentStatus === "Sakit"
                          ? "bg-sky-600 text-white shadow-xs"
                          : "text-muted-foreground"
                      )}
                    >
                      Sakit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "Izin")}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg text-center transition-all cursor-pointer",
                        currentStatus === "Izin"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-muted-foreground"
                      )}
                    >
                      Izin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "Alpha")}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg text-center transition-all cursor-pointer",
                        currentStatus === "Alpha"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-muted-foreground"
                      )}
                    >
                      Alpha
                    </button>
                  </div>
                </div>

                {/* Optional Catatan Input Box */}
                {isNoteOpen && (
                  <div className="px-4 pb-3 sm:px-6 sm:pb-3.5 pt-0">
                    <Input
                      placeholder="Tulis alasan / catatan (misal: Sakit demam, Izin lomba, dll)..."
                      value={currentCatatan}
                      onChange={(e) => handleCatatanChange(student.id, e.target.value)}
                      className="h-8.5 text-xs rounded-xl bg-background border-border/80 shadow-2xs"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Floating Bottom Action Bar */}
      <div className="sticky bottom-3 sm:bottom-4 z-20 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-card/95 dark:bg-card/90 backdrop-blur-xl border border-border/80 shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          {isAlreadyFilled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus Presensi</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/guru/attendance");
              }
            }}
            className="text-xs rounded-xl cursor-pointer flex-1 sm:flex-none"
          >
            Batal / Kembali
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl px-5 h-10 shadow-md shadow-emerald-600/20 cursor-pointer flex-1 sm:flex-none justify-center"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Menyimpan..." : "Simpan Presensi Kelas"}</span>
          </Button>
        </div>
      </div>

      {/* Student Photo Preview Modal (Hanya Foto, Tanpa Teks Lainnya) */}
      <Dialog
        open={!!previewStudent}
        onOpenChange={(open) => !open && setPreviewStudent(null)}
      >
        <DialogContent className="max-w-[280px] sm:max-w-xs rounded-3xl p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl bg-card">
          <DialogTitle className="sr-only">Foto Profil Siswa</DialogTitle>

          {previewStudent && (
            <img
              src={getUserProfileImage(
                previewStudent.image,
                previewStudent.gender,
                previewStudent.name
              )}
              alt={previewStudent.name}
              className="w-full aspect-square object-cover block"
            />
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
