"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Save,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  UserCheck,
  Info,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { applyWaliKelasFullDayAction } from "@/actions/guru";
import { toast } from "sonner";
import { cn, formatClassDisplay } from "@/lib/utils";
import { ClassSubjectMatrixItem } from "@/services/attendance.service";

interface ScheduleCol {
  jadwalId: string;
  mapelId: string;
  mapelNama: string;
  jamMulai: string;
  jamSelesai: string;
  guruNama: string;
  isFilled: boolean;
}

interface ClassMatrixClientProps {
  kelasNama: string;
  dateStr: string;
  todayStr?: string;
  hari: string;
  schedules: ScheduleCol[];
  matrix: ClassSubjectMatrixItem[];
}

type OverallStatus = ClassSubjectMatrixItem["overallStatus"];
type ExcuseStatus = "Sakit" | "Izin" | "Alpha" | "Hadir";

const SUBJECT_STATUS_META: Record<
  string,
  { code: string; label: string; cellClass: string; chipClass: string }
> = {
  Hadir: {
    code: "H",
    label: "Hadir",
    cellClass: "bg-emerald-500 text-white",
    chipClass:
      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30",
  },
  Sakit: {
    code: "S",
    label: "Sakit",
    cellClass: "bg-sky-500 text-white",
    chipClass:
      "bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-500/30",
  },
  Izin: {
    code: "I",
    label: "Izin",
    cellClass: "bg-amber-500 text-white",
    chipClass:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30",
  },
  Alpha: {
    code: "A",
    label: "Alpha",
    cellClass: "bg-rose-600 text-white ring-2 ring-rose-400/70",
    chipClass:
      "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-500/30",
  },
};

const OVERALL_STATUS_META: Record<
  OverallStatus,
  { label: string; pillClass: string; showAlertIcon?: boolean }
> = {
  "Bolos Terdeteksi": {
    label: "Bolos Mapel",
    pillClass:
      "bg-rose-600 text-white border-rose-500 shadow-xs animate-pulse",
    showAlertIcon: true,
  },
  "Sakit Seharian": {
    label: "Sakit Seharian",
    pillClass:
      "bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-500/30",
  },
  "Izin Seharian": {
    label: "Izin Seharian",
    pillClass:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30",
  },
  Lengkap: {
    label: "✓ Lengkap",
    pillClass:
      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30",
  },
  "Belum Lengkap": {
    label: "Belum Lengkap",
    pillClass:
      "bg-slate-200/80 text-slate-700 dark:bg-slate-800/90 dark:text-slate-300 border-slate-300/70 dark:border-slate-700/80",
  },
};

const EXCUSE_OPTIONS: {
  value: ExcuseStatus;
  title: string;
  desc: string;
  activeClass: string;
}[] = [
  {
    value: "Sakit",
    title: "Sakit",
    desc: "Surat dokter / izin orang tua",
    activeClass:
      "border-sky-500 bg-sky-500/15 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500/40",
  },
  {
    value: "Izin",
    title: "Izin",
    desc: "Kepentingan keluarga / syar'i",
    activeClass:
      "border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200 ring-1 ring-amber-500/40",
  },
  {
    value: "Alpha",
    title: "Alpha",
    desc: "Tidak hadir tanpa keterangan",
    activeClass:
      "border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200 ring-1 ring-rose-500/40",
  },
  {
    value: "Hadir",
    title: "Hadir",
    desc: "Koreksi kehadiran penuh",
    activeClass:
      "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/40",
  },
];

const EXCUSE_NOTE_PRESETS = [
  "Surat dokter dari orang tua siswa",
  "Izin keperluan keluarga",
  "Sakit (konfirmasi orang tua)",
  "Dispensasi kegiatan sekolah",
];

function OverallStatusPill({ status }: { status: OverallStatus }) {
  const meta = OVERALL_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap shrink-0",
        meta.pillClass
      )}
    >
      {meta.showAlertIcon && <AlertTriangle className="h-3 w-3 shrink-0" />}
      <span>{meta.label}</span>
    </span>
  );
}

function SubjectStatusLegend() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground inline-flex items-center gap-1.5 mr-0.5">
          <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          Keterangan:
        </span>
        {Object.values(SUBJECT_STATUS_META).map((item) => (
          <span
            key={item.code}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-background/80 dark:bg-muted/50 border border-border/60 text-[11px] font-medium text-foreground/90"
          >
            <span
              className={cn(
                "inline-flex items-center justify-center h-4.5 w-4.5 rounded-md text-[10px] font-black",
                item.cellClass
              )}
            >
              {item.code}
            </span>
            <span>{item.label}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-background/80 dark:bg-muted/50 border border-border/60 text-[11px] font-medium text-foreground/90">
          <span className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-md bg-muted text-muted-foreground font-mono text-[11px] font-bold">
            -
          </span>
          <span>Belum Diabsen</span>
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Gunakan tombol <strong className="text-foreground">Izin Seharian</strong> untuk menerapkan status ke seluruh mapel hari ini.
      </p>
    </div>
  );
}

function getScheduleGridClass(count: number): string {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
}

function ScheduleSummaryCard({
  kelasNama,
  hari,
  schedules,
}: {
  kelasNama: string;
  hari: string;
  schedules: ScheduleCol[];
}) {
  // Di layar HP, otomatis ringkas jika jadwal mapel lebih dari 3 agar daftar siswa cepat terjangkau
  const [mobileExpanded, setMobileExpanded] = useState(schedules.length <= 3);
  const filledCount = schedules.filter((s) => s.isFilled).length;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Mata Pelajaran Terjadwal</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {formatClassDisplay(kelasNama)} • Hari {hari}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {schedules.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted/70 border border-border/70 text-[11px] font-semibold text-foreground">
                {filledCount}/{schedules.length} Sudah Diabsen
              </span>
            )}
            {schedules.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMobileExpanded((prev) => !prev)}
                className="md:hidden h-8 px-2.5 text-[11px] rounded-xl gap-1 cursor-pointer"
              >
                <span>{mobileExpanded ? "Tutup" : "Lihat"}</span>
                {mobileExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "p-4 sm:p-5 pt-3.5 sm:pt-4",
          !mobileExpanded && schedules.length > 0 && "hidden md:block"
        )}
      >
        {schedules.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground italic">
            Tidak ada jadwal KBM pada hari {hari}. Anda tetap dapat menetapkan status harian siswa di bawah ini.
          </div>
        ) : (
          <div className={cn("grid gap-2.5 sm:gap-3", getScheduleGridClass(schedules.length))}>
            {schedules.map((sch, i) => (
              <div
                key={sch.jadwalId}
                className={cn(
                  "p-3.5 sm:p-4 rounded-2xl border bg-background/70 dark:bg-muted/35 flex justify-between gap-3 shadow-2xs transition-colors",
                  schedules.length === 1
                    ? "flex-col sm:flex-row sm:items-center"
                    : "flex-col",
                  sch.isFilled ? "border-emerald-500/35" : "border-border/80"
                )}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {sch.jamMulai} - {sch.jamSelesai} WIB
                    </span>
                    {schedules.length > 1 && (
                      <ScheduleStatusPill isFilled={sch.isFilled} />
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-2">
                    {i + 1}. {sch.mapelNama}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {sch.guruNama}
                  </p>
                </div>

                {schedules.length === 1 && (
                  <div className="shrink-0">
                    <ScheduleStatusPill isFilled={sch.isFilled} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduleStatusPill({ isFilled }: { isFilled: boolean }) {
  return isFilled ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold whitespace-nowrap shrink-0">
      <CheckCircle2 className="h-3 w-3 shrink-0" />
      <span>Diabsen</span>
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30 text-[11px] font-semibold whitespace-nowrap shrink-0">
      Belum Diabsen
    </span>
  );
}

function StudentSubMeta({ gender, nis }: { gender: string; nis: string }) {
  const hasNis = nis && nis !== "-";
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/80 font-semibold text-[10px] leading-none text-foreground/85">
        {gender}
      </span>
      {hasNis && <span className="font-mono">NIS: {nis}</span>}
    </div>
  );
}

function StudentMatrixTable({
  filteredMatrix,
  schedules,
  hasActiveFilters,
  onResetFilters,
  onOpenModal,
}: {
  filteredMatrix: ClassSubjectMatrixItem[];
  schedules: ScheduleCol[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onOpenModal: (student: ClassSubjectMatrixItem) => void;
}) {
  // Sticky kolom kiri hanya perlu aktif saat tabel berpotensi scroll horizontal
  const enableStickyName = schedules.length > 2;

  return (
    <div className="hidden md:block">
      {enableStickyName && (
        <div className="lg:hidden px-4 py-1.5 bg-muted/50 border-b border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>← Geser tabel ke samping untuk melihat semua mata pelajaran →</span>
          <span className="font-semibold text-foreground">{schedules.length} Mapel</span>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs text-left min-w-[680px]">
          <thead className="bg-muted/60 border-b border-border/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th
                className={cn(
                  "py-3.5 px-4 sm:px-5 min-w-[240px]",
                  enableStickyName &&
                    "sticky left-0 z-20 bg-muted/95 backdrop-blur-md border-r border-border/50"
                )}
              >
                Siswa
              </th>
              {schedules.map((sch) => (
                <th key={sch.jadwalId} className="py-3 px-3 text-center min-w-[125px]">
                  <span className="block font-bold text-foreground leading-tight line-clamp-2">
                    {sch.mapelNama}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium normal-case mt-0.5 block">
                    {sch.jamMulai} WIB
                  </span>
                </th>
              ))}
              <th className="py-3.5 px-3 text-center min-w-[140px]">Status Harian</th>
              <th className="py-3.5 px-4 sm:px-5 text-center w-36">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50">
            {filteredMatrix.length === 0 ? (
              <tr>
                <td colSpan={schedules.length + 3} className="py-10 text-center space-y-2.5">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tidak ada data siswa yang cocok dengan filter saat ini.
                  </p>
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onResetFilters}
                      className="h-8 text-xs rounded-xl gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Filter & Pencarian
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              filteredMatrix.map((item, idx) => {
                const isTruant = item.overallStatus === "Bolos Terdeteksi";

                return (
                  <tr
                    key={item.studentId}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      isTruant && "bg-rose-500/10"
                    )}
                  >
                    {/* Student Name Column */}
                    <td
                      className={cn(
                        "py-3 px-4 sm:px-5",
                        enableStickyName &&
                          cn(
                            "sticky left-0 z-10 backdrop-blur-md border-r border-border/50",
                            isTruant
                              ? "bg-rose-50/95 dark:bg-rose-950/75"
                              : "bg-card/95"
                          )
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-lg bg-muted/80 text-[11px] font-mono font-semibold text-muted-foreground shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-xs sm:text-[13px] leading-snug">
                            {item.studentName}
                          </p>
                          <StudentSubMeta gender={item.gender} nis={item.nis} />
                        </div>
                      </div>
                    </td>

                    {/* Subject Status Cells */}
                    {schedules.map((sch) => {
                      const statusObj = item.subjectStatuses[sch.mapelId];
                      const ket = statusObj?.keterangan;
                      const meta = ket ? SUBJECT_STATUS_META[ket] : undefined;

                      return (
                        <td key={sch.jadwalId} className="py-3 px-3 text-center">
                          {meta ? (
                            <span
                              title={statusObj?.catatan || meta.label}
                              className={cn(
                                "inline-flex items-center justify-center h-8 w-8 rounded-xl text-xs font-black shadow-2xs",
                                meta.cellClass
                              )}
                            >
                              {meta.code}
                            </span>
                          ) : (
                            <span
                              title="Belum diabsen"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-muted/40 text-muted-foreground/60 font-mono text-xs"
                            >
                              -
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Overall Status Pill */}
                    <td className="py-3 px-3 text-center">
                      <OverallStatusPill status={item.overallStatus} />
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 sm:px-5 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenModal(item)}
                        className="h-8 text-xs px-3 rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer font-semibold"
                      >
                        Izin Seharian
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentMobileCards({
  filteredMatrix,
  schedules,
  hasActiveFilters,
  onResetFilters,
  onOpenModal,
}: {
  filteredMatrix: ClassSubjectMatrixItem[];
  schedules: ScheduleCol[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onOpenModal: (student: ClassSubjectMatrixItem) => void;
}) {
  return (
    <div className="block md:hidden divide-y divide-border/60">
      {filteredMatrix.length === 0 ? (
        <div className="py-10 px-4 text-center space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            Tidak ada data siswa yang cocok dengan filter saat ini.
          </p>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-9 text-xs rounded-xl gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filter & Pencarian
            </Button>
          )}
        </div>
      ) : (
        filteredMatrix.map((item, idx) => {
          const isTruant = item.overallStatus === "Bolos Terdeteksi";

          return (
            <div
              key={item.studentId}
              className={cn("p-3.5 space-y-3", isTruant && "bg-rose-500/10")}
            >
              {/* Student Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-lg bg-muted text-[11px] font-mono font-semibold text-muted-foreground shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground leading-snug">
                      {item.studentName}
                    </p>
                    <StudentSubMeta gender={item.gender} nis={item.nis} />
                  </div>
                </div>

                <OverallStatusPill status={item.overallStatus} />
              </div>

              {/* Per-Subject Attendance Pills */}
              {schedules.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">
                  Tidak ada jadwal KBM pada hari ini.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-1.5">
                  {schedules.map((sch) => {
                    const statusObj = item.subjectStatuses[sch.mapelId];
                    const ket = statusObj?.keterangan;
                    const meta = ket ? SUBJECT_STATUS_META[ket] : undefined;

                    return (
                      <div
                        key={sch.jadwalId}
                        className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-muted/45 border border-border/50 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground block truncate">
                            {sch.mapelNama}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {sch.jamMulai} - {sch.jamSelesai} WIB
                          </span>
                        </div>
                        {meta ? (
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold shrink-0",
                              meta.chipClass
                            )}
                          >
                            {meta.label} ({meta.code})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-border/60 bg-muted/60 text-[11px] text-muted-foreground shrink-0">
                            Belum Diabsen
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full-Width Touch Action */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenModal(item)}
                className="w-full h-9 text-xs rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer font-semibold gap-1.5"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Atur Izin / Status Seharian</span>
              </Button>
            </div>
          );
        })
      )}
    </div>
  );
}

export function ClassMatrixClient({
  kelasNama,
  dateStr,
  todayStr,
  hari,
  schedules,
  matrix,
}: ClassMatrixClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(dateStr);

  // Modal dialog state for applying full-day excuse
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ClassSubjectMatrixItem | null>(null);
  const [excuseStatus, setExcuseStatus] = useState<ExcuseStatus>("Sakit");
  const [excuseNote, setExcuseNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMatrix = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return matrix.filter((item) => {
      if (!query) return true;
      return (
        item.studentName.toLowerCase().includes(query) ||
        item.nis.toLowerCase().includes(query)
      );
    });
  }, [matrix, searchQuery]);

  const hasActiveFilters = searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSearchQuery("");
  };

  const handleOpenModal = (student: ClassSubjectMatrixItem) => {
    setSelectedStudent(student);
    setExcuseStatus("Sakit");
    setExcuseNote("Surat dokter dari orang tua siswa");
    setIsModalOpen(true);
  };

  const handleApplyFullDay = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);

    try {
      const res = await applyWaliKelasFullDayAction({
        dateStr,
        kelasNama,
        studentId: selectedStudent.studentId,
        keterangan: excuseStatus,
        catatan: excuseNote,
      });

      if (res.success) {
        toast.success(res.message);
        setIsModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menerapkan izin seharian.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    setSelectedDate(newDate);
    if (newDate !== dateStr) {
      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();
      params.set("date", newDate);
      router.push(`/guru/attendance/matrix?${params.toString()}`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Control & Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Date Picker + Day Badge */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                <Calendar className="h-4 w-4 text-emerald-600" /> Tanggal:
              </span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="min-w-[145px] flex-1 sm:flex-none sm:w-44 h-10 text-xs sm:text-sm rounded-xl bg-background/85"
              />
              <span className="inline-flex items-center h-9 px-3 text-xs font-semibold rounded-xl border border-border/70 bg-muted/50 text-foreground">
                Hari: {hari}
              </span>
              {todayStr && dateStr !== todayStr && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateChange(todayStr)}
                  className="h-9 px-3 text-xs rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                >
                  Hari Ini
                </Button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIS siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10 text-xs sm:text-sm rounded-xl bg-background/85 border-border/80 shadow-2xs w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Subjects Summary Card */}
      <ScheduleSummaryCard
        kelasNama={kelasNama}
        hari={hari}
        schedules={schedules}
      />

      {/* Student Attendance List / Matrix */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <CardTitle className="text-sm sm:text-base font-bold">
                Daftar Kehadiran Siswa
              </CardTitle>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted/70 border border-border/70 text-[11px] font-semibold text-foreground">
                {filteredMatrix.length} / {matrix.length} Siswa
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset filter
              </button>
            )}
          </div>
        </CardHeader>

        {/* Desktop & iPad Matrix Table */}
        <StudentMatrixTable
          filteredMatrix={filteredMatrix}
          schedules={schedules}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onOpenModal={handleOpenModal}
        />

        {/* Mobile Friendly Card List */}
        <StudentMobileCards
          filteredMatrix={filteredMatrix}
          schedules={schedules}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onOpenModal={handleOpenModal}
        />

        {/* Legend Footer (Bottom) */}
        <CardFooter className="p-4 sm:px-5 sm:py-3.5 border-t border-border/60 bg-muted/25">
          <SubjectStatusLegend />
        </CardFooter>
      </Card>

      {/* Dialog Modal: Apply Full Day Status */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Terapkan Izin / Status Seharian
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Wali Kelas dapat menetapkan status kehadiran untuk{" "}
              <strong>seluruh mata pelajaran</strong> pada tanggal {dateStr}.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4 py-1">
              <div className="p-3 rounded-xl bg-muted/60 border border-border/60 text-xs space-y-0.5">
                <p className="font-bold text-sm text-foreground">
                  {selectedStudent.studentName}
                </p>
                <p className="text-muted-foreground">
                  NIS: {selectedStudent.nis} • {formatClassDisplay(kelasNama)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Pilih Status Kehadiran:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXCUSE_OPTIONS.map((opt) => {
                    const isSelected = excuseStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setExcuseStatus(opt.value)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                          isSelected
                            ? opt.activeClass
                            : "bg-background hover:bg-muted/50 border-border/70"
                        )}
                      >
                        <span className="text-xs font-bold block">{opt.title}</span>
                        <span className="text-[10px] opacity-80 block mt-0.5 leading-tight">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Catatan / Alasan:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EXCUSE_NOTE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExcuseNote(preset)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer",
                        excuseNote === preset
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                          : "bg-muted/40 hover:bg-muted border-border/60 text-muted-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Input
                  value={excuseNote}
                  onChange={(e) => setExcuseNote(e.target.value)}
                  placeholder="Misal: Surat dokter dari RS Islam Palembang..."
                  className="h-10 text-xs sm:text-sm rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto h-9 text-xs rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyFullDay}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl gap-1.5 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Menerapkan..." : "Terapkan ke Semua Mapel"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
