"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSubjectAttendanceAction, deleteSubjectAttendanceAction } from "@/actions/guru";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StudentRecordItem {
  id: string;
  name: string;
  nis: string;
  gender: string;
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
    toast.info(`Seluruh santri diatur ke status: ${status}`);
  };

  const countHadir = Object.values(records).filter((v) => v.keterangan === "Hadir").length;
  const countSakit = Object.values(records).filter((v) => v.keterangan === "Sakit").length;
  const countIzin = Object.values(records).filter((v) => v.keterangan === "Izin").length;
  const countAlpha = Object.values(records).filter((v) => v.keterangan === "Alpha").length;

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
        router.refresh();
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
        router.push("/guru/attendance");
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
      router.push(`/guru/attendance/${mapelId}/${kelasId}/${newDate}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Control Bar: Date Selector, Quick Set All, and Live Counter */}
      <Card className="rounded-3xl card-elevation shadow-2xl">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Date Switcher */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-orange-500" /> Tanggal KBM:
              </span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  handleDateChange(e.target.value);
                }}
                className="w-40 h-9 text-xs rounded-xl"
              />
            </div>

            {/* Quick Set All Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSetAll("Hadir")}
                className="gap-1.5 text-xs font-semibold rounded-xl border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 w-full sm:w-auto cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Semua Hadir (1-Click)</span>
              </Button>
            </div>
          </div>

          {/* Live Attendance Counter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Hadir</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{countHadir}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Sakit</span>
              <span className="text-lg font-black text-sky-600 dark:text-sky-400">{countSakit}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Izin</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">{countIzin}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Alpha</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">{countAlpha}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari santri berdasarkan nama atau NIS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11 text-xs rounded-xl bg-card border-border/80 shadow-2xs"
        />
      </div>

      {/* Student Attendance List */}
      <div className="space-y-2.5">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-card border border-border text-muted-foreground text-xs">
            Tidak ada santri yang sesuai dengan pencarian.
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
                  "p-3.5 sm:p-4 rounded-3xl border transition-all duration-150 card-elevation flex flex-col gap-3",
                  currentStatus === "Hadir" && "border-border/80 hover:border-emerald-500/50",
                  currentStatus === "Sakit" && "border-sky-500/40 bg-sky-500/5",
                  currentStatus === "Izin" && "border-amber-500/40 bg-amber-500/5",
                  currentStatus === "Alpha" && "border-rose-500/50 bg-rose-500/5 shadow-xs"
                )}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground/60 w-5 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-foreground">
                      {student.gender === "P" ? "P" : "L"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {student.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        NIS: {student.nis || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Status Buttons */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "Hadir")}
                      className={cn(
                        "flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        currentStatus === "Hadir"
                          ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 ring-2 ring-emerald-500/30"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Hadir
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "Sakit")}
                      className={cn(
                        "flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        currentStatus === "Sakit"
                          ? "bg-sky-600 text-white shadow-xs shadow-sky-600/30 ring-2 ring-sky-500/30"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Sakit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "Izin")}
                      className={cn(
                        "flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        currentStatus === "Izin"
                          ? "bg-amber-600 text-white shadow-xs shadow-amber-600/30 ring-2 ring-amber-500/30"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Izin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "Alpha")}
                      className={cn(
                        "flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        currentStatus === "Alpha"
                          ? "bg-rose-600 text-white shadow-xs shadow-rose-600/30 ring-2 ring-rose-500/30"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Alpha
                    </button>

                    {/* Note toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowNotes((prev) => ({
                          ...prev,
                          [student.id]: !prev[student.id],
                        }))
                      }
                      title="Tambah Catatan KBM"
                      className={cn(
                        "p-1.5 rounded-xl text-xs transition-colors shrink-0 ml-1 cursor-pointer",
                        currentCatatan
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Optional Catatan Input */}
                {isNoteOpen && (
                  <div className="pt-2 border-t border-border/40 pl-8">
                    <Input
                      placeholder="Tulis catatan (misal: Izin ke UKS pukul 08.15, terlambat 15 menit, dll)..."
                      value={currentCatatan}
                      onChange={(e) => handleCatatanChange(student.id, e.target.value)}
                      className="h-8 text-xs rounded-lg bg-background"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating or Bottom Action Buttons */}
      <div className="sticky bottom-4 z-20 p-4 rounded-3xl bg-card/85 dark:bg-card/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isAlreadyFilled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Hapus Presensi Tanggal Ini</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/guru/attendance">
            <Button type="button" variant="ghost" size="sm" className="text-xs rounded-xl">
              Kembali
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-5 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Menyimpan..." : "Simpan Presensi Kelas"}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
