"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Edit3,
  Download,
  FileSpreadsheet,
  Loader2,
  Clock,
  Users,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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
import { UserAvatar } from "@/components/shared/user-avatar";
import { LiquidGlassCard } from "@/components/ui/liquid-weather-glass";
import { getStatusConfig } from "@/lib/task-status";
import { exportTaskRecapToExcel, exportTaskRecapToPdf } from "@/lib/export-task-recap";
import { toast } from "sonner";

export interface StudentSubmissionItem {
  siswaId: string;
  siswaName: string;
  siswaNis: string | null;
  siswaImage: string | null;
  siswaGender?: string | null;
  submissionId: string | null;
  submittedAt: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  catatanSiswa: string | null;
  status: "belum_mengumpulkan" | "menunggu_penilaian" | "terlambat" | "sudah_dinilai" | "perlu_revisi" | string;
  nilai: number | null;
  catatanGuru: string | null;
  annotatedFileUrl: string | null;
}

interface TeacherSubmissionsViewProps {
  tugasId: string;
  tugasJudul: string;
  mapelNama?: string;
  kelasNama?: string;
  poinMaksimal: number;
  deadlineFormatted?: string;
  guruNama?: string;
  students: StudentSubmissionItem[];
  fromOrigin?: string;
}

const VIEW_MODE_STORAGE_KEY = "alazhar_guru_tugas_submissions_view_mode";
const VIEW_MODE_EVENT = "guru-tugas-submissions-view-mode-change";

function subscribeViewMode(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(VIEW_MODE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(VIEW_MODE_EVENT, callback);
  };
}

function getViewModeSnapshot(): "card" | "table" {
  try {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (saved === "card" || saved === "table") {
      return saved;
    }
  } catch {
    // Ignore localStorage errors
  }
  return "table";
}

function getServerViewModeSnapshot(): "card" | "table" {
  return "table";
}

function formatSubmittedAt(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export function TeacherSubmissionsView({
  tugasId,
  tugasJudul,
  mapelNama,
  kelasNama,
  poinMaksimal,
  deadlineFormatted,
  guruNama,
  students,
  fromOrigin,
}: TeacherSubmissionsViewProps) {
  const viewMode = useSyncExternalStore(
    subscribeViewMode,
    getViewModeSnapshot,
    getServerViewModeSnapshot
  );
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleViewModeChange = (mode: "card" | "table") => {
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
      window.dispatchEvent(new Event(VIEW_MODE_EVENT));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportTaskRecapToExcel(
        {
          tugasId,
          judul: tugasJudul,
          mapelNama: mapelNama || "Mata Pelajaran",
          kelasNama: kelasNama || "Kelas",
          poinMaksimal,
          deadlineFormatted: deadlineFormatted || "-",
          guruNama: guruNama || "Dewan Guru",
        },
        students.map((s) => ({
          siswaId: s.siswaId,
          siswaName: s.siswaName,
          siswaNis: s.siswaNis,
          siswaGender: s.siswaGender,
          status: s.status,
          submittedAt: s.submittedAt,
          nilai: s.nilai,
          catatanGuru: s.catatanGuru,
        }))
      );
      toast.success("File Rekap Nilai Excel (.xlsx) berhasil diunduh!");
    } catch (e: unknown) {
      console.error(e);
      toast.error("Gagal mengunduh rekap Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportTaskRecapToPdf(
        {
          tugasId,
          judul: tugasJudul,
          mapelNama: mapelNama || "Mata Pelajaran",
          kelasNama: kelasNama || "Kelas",
          poinMaksimal,
          deadlineFormatted: deadlineFormatted || "-",
          guruNama: guruNama || "Dewan Guru",
        },
        students.map((s) => ({
          siswaId: s.siswaId,
          siswaName: s.siswaName,
          siswaNis: s.siswaNis,
          siswaGender: s.siswaGender,
          status: s.status,
          submittedAt: s.submittedAt,
          nilai: s.nilai,
          catatanGuru: s.catatanGuru,
        }))
      );
      toast.success("Dokumen Rekap Nilai PDF berhasil diunduh!");
    } catch (e: unknown) {
      console.error(e);
      toast.error("Gagal mengunduh rekap PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Export Actions and Card/Table Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExportingExcel}
            onClick={handleExportExcel}
            className="text-xs h-9 gap-1.5 rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold"
            title="Unduh Rekap Nilai ke Excel"
          >
            {isExportingExcel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span>Excel (.xlsx)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExportingPdf}
            onClick={handleExportPdf}
            className="text-xs h-9 gap-1.5 rounded-xl border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold"
            title="Unduh Rekap Nilai Cetak PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 text-rose-600" />
            )}
            <span>PDF (.pdf)</span>
          </Button>
        </div>

        <div className="inline-flex items-center p-1 bg-muted/80 dark:bg-muted/60 rounded-full border border-border/60 shadow-xs ml-auto">
          <button
            type="button"
            onClick={() => handleViewModeChange("card")}
            title="Tampilan Card"
            aria-label="Tampilan Card"
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              viewMode === "card"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange("table")}
            title="Tampilan Tabel"
            aria-label="Tampilan Tabel"
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Rendering: Empty vs Card View vs Table View */}
      {students.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="text-base font-bold text-foreground">
            Belum Ada Siswa
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Belum ada siswa yang terdaftar pada kelas ini.
          </p>
        </div>
      ) : viewMode === "card" ? (
        /* CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {students.map((student) => {
            const config = getStatusConfig(student.status);
            const hasSubmitted = !!student.submissionId;
            const isGraded = student.status === "sudah_dinilai";
            const submittedFormatted = formatSubmittedAt(student.submittedAt);

            return (
              <LiquidGlassCard
                key={student.siswaId}
                borderRadius="28px"
                blurIntensity="xl"
                shadowIntensity="md"
                glowIntensity="sm"
                draggable={false}
                className="p-5 bg-card/75 dark:bg-card/45 border border-white/50 dark:border-white/10 group flex flex-col justify-between hover:border-primary/50 transition-all duration-200 shadow-2xl"
              >
                <div className="space-y-3">
                  {/* Row 1: Status Badge & Score Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={config.variant} size="xs" className="font-bold">
                      {config.label}
                    </Badge>

                    {isGraded ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>{student.nilai}/{poinMaksimal}</span>
                      </div>
                    ) : hasSubmitted ? (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>Perlu Koreksi</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Row 2: Student Info */}
                  <div className="flex items-center gap-3 pt-1">
                    <UserAvatar
                      src={student.siswaImage}
                      gender={student.siswaGender}
                      name={student.siswaName}
                      alt={student.siswaName}
                      className="h-10 w-10 rounded-full border border-border object-cover shrink-0"
                      previewable={false}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors truncate">
                        {student.siswaName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                        NIS: {student.siswaNis || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Submission Time */}
                  <div className="pt-3 border-t border-border/60">
                    {submittedFormatted ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Dikumpulkan {submittedFormatted}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Belum mengumpulkan tugas
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 mt-3 border-t border-border/60">
                  {hasSubmitted ? (
                    <Link
                      href={`/guru/tugas/${tugasId}/review/${student.submissionId}${fromOrigin ? `?from=${fromOrigin}` : ""}`}
                      className="w-full block"
                    >
                      <Button
                        variant={isGraded ? "outline" : "default"}
                        size="sm"
                        className="w-full h-8 text-xs font-bold gap-1.5 rounded-xl"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{isGraded ? "Ubah Nilai" : "Koreksi Tugas"}</span>
                      </Button>
                    </Link>
                  ) : (
                    <div className="h-8 flex items-center justify-center rounded-xl bg-muted/40 text-xs font-medium text-muted-foreground">
                      Menunggu Pengumpulan
                    </div>
                  )}
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-3xl card-elevation overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/30 backdrop-blur-xs">
              <TableRow className="border-b border-border/80">
                <TableHead className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  No
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[220px]">
                  Nama Siswa
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[120px]">
                  NIS
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[160px]">
                  Status
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[110px]">
                  Nilai
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[140px]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, idx) => {
                const config = getStatusConfig(student.status);
                const hasSubmitted = !!student.submissionId;
                const isGraded = student.status === "sudah_dinilai";
                const submittedFormatted = formatSubmittedAt(student.submittedAt);

                return (
                  <TableRow
                    key={student.siswaId}
                    className="group hover:bg-muted/40 transition-colors border-b border-border/60"
                  >
                    {/* No */}
                    <TableCell className="text-center text-xs font-medium text-muted-foreground/80 py-3.5">
                      {idx + 1}
                    </TableCell>

                    {/* Nama Siswa */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          src={student.siswaImage}
                          gender={student.siswaGender}
                          name={student.siswaName}
                          alt={student.siswaName}
                          className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
                          previewable={false}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground leading-tight truncate">
                            {student.siswaName}
                          </p>
                          {submittedFormatted && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 text-primary/70 shrink-0" />
                              <span>Dikumpulkan {submittedFormatted}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* NIS */}
                    <TableCell className="py-3.5">
                      <span className="font-mono text-xs text-muted-foreground">
                        {student.siswaNis || "-"}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3.5">
                      <Badge variant={config.variant} size="sm">
                        {config.label}
                      </Badge>
                    </TableCell>

                    {/* Nilai */}
                    <TableCell className="text-center py-3.5">
                      {isGraded ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
                          {student.nilai}/{poinMaksimal}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/70">-</span>
                      )}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center justify-center">
                        {hasSubmitted ? (
                          <Link
                            href={`/guru/tugas/${tugasId}/review/${student.submissionId}${fromOrigin ? `?from=${fromOrigin}` : ""}`}
                          >
                            <Button
                              variant={isGraded ? "outline" : "default"}
                              size="sm"
                              className="h-8 text-xs font-bold gap-1.5 rounded-xl"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>{isGraded ? "Ubah" : "Koreksi"}</span>
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer */}
      {students.length > 0 && (
        <div className="text-[11px] text-muted-foreground px-1 flex items-center justify-between">
          <span>
            Menampilkan {students.length} siswa
          </span>
          <span className="capitalize text-[10px] bg-muted/60 px-2 py-0.5 rounded-md">
            Mode: {viewMode === "card" ? "Kartu (Grid)" : "Tabel"}
          </span>
        </div>
      )}
    </div>
  );
}
