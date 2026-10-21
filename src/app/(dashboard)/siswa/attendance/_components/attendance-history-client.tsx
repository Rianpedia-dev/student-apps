"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  Activity,
  Search,
  ShieldCheck,
  HeartPulse,
  User,
  Info,
  ArrowRight,
  Eye,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LiquidGlassCard } from "@/components/ui/liquid-weather-glass";
import { cn, formatDateIndo } from "@/lib/utils";
import {
  SubjectAttendanceSummary,
  StudentAttendanceEvent,
  StudentAttendanceLogItem,
} from "@/services/attendance.service";

interface AttendanceHistoryClientProps {
  overallStats: {
    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;
    percentage: number;
  };
  subjectSummaries: SubjectAttendanceSummary[];
  recentLogs: StudentAttendanceLogItem[];
  allLogs?: StudentAttendanceLogItem[];
  calendarEvents?: StudentAttendanceEvent[];
}

export function AttendanceHistoryClient({
  overallStats,
  subjectSummaries,
  recentLogs,
  allLogs = recentLogs,
  calendarEvents = [],
}: AttendanceHistoryClientProps) {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState("mapel");

  // Calendar State
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(
    () =>
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`,
    [today]
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Subject Modal State
  const [selectedSubject, setSelectedSubject] = useState<SubjectAttendanceSummary | null>(null);
  const [subjectSearch, setSubjectSearch] = useState("");

  // Log Tab Filter State
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  const [displayLogsLimit, setDisplayLogsLimit] = useState(25);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [firstDay, daysInMonth]);

  // Calendar event helpers
  const getAttendanceForDay = (d: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return calendarEvents.filter((e) => e.start === dStr);
  };

  const selectedDateEvents = useMemo(() => {
    return calendarEvents.filter((e) => e.start === selectedDate);
  }, [calendarEvents, selectedDate]);

  // Filtered Subject Summaries
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjectSummaries;
    const q = subjectSearch.toLowerCase();
    return subjectSummaries.filter(
      (sub) =>
        sub.mapelNama.toLowerCase().includes(q) ||
        sub.mapelKode.toLowerCase().includes(q)
    );
  }, [subjectSummaries, subjectSearch]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const matchStatus =
        logStatusFilter === "all" || log.keterangan.toLowerCase() === logStatusFilter.toLowerCase();

      if (!matchStatus) return false;

      if (!logSearch.trim()) return true;
      const q = logSearch.toLowerCase();
      return (
        log.mapelNama.toLowerCase().includes(q) ||
        (log.mapelKode && log.mapelKode.toLowerCase().includes(q)) ||
        (log.catatan && log.catatan.toLowerCase().includes(q)) ||
        (log.guruNama && log.guruNama.toLowerCase().includes(q)) ||
        log.date.toLowerCase().includes(q)
      );
    });
  }, [allLogs, logStatusFilter, logSearch]);

  // Sessions for Selected Subject Modal
  const subjectSessions = useMemo(() => {
    if (!selectedSubject) return [];
    return allLogs.filter(
      (l) =>
        l.mapelId === selectedSubject.mapelId ||
        l.mapelKode?.toLowerCase() === selectedSubject.mapelKode.toLowerCase() ||
        l.mapelNama.toLowerCase() === selectedSubject.mapelNama.toLowerCase()
    );
  }, [allLogs, selectedSubject]);

  return (
    <div className="space-y-6">

      {/* Main Tab Navigation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
        <Button
          type="button"
          variant={activeTab === "mapel" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("mapel")}
          className={cn(
            "h-11 sm:h-10 px-3.5 rounded-xl text-xs font-bold gap-2 transition-all cursor-pointer shadow-xs justify-center",
            activeTab === "mapel"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              : "bg-card/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
          )}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span>Presensi per Mata Pelajaran</span>
        </Button>

        <Button
          type="button"
          variant={activeTab === "calendar" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("calendar")}
          className={cn(
            "h-11 sm:h-10 px-3.5 rounded-xl text-xs font-bold gap-2 transition-all cursor-pointer shadow-xs justify-center",
            activeTab === "calendar"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              : "bg-card/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
          )}
        >
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Kalender Presensi</span>
        </Button>

        <Button
          type="button"
          variant={activeTab === "logs" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("logs")}
          className={cn(
            "h-11 sm:h-10 px-3.5 rounded-xl text-xs font-bold gap-2 transition-all cursor-pointer shadow-xs justify-center",
            activeTab === "logs"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              : "bg-card/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
          )}
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span>Riwayat Sesi Terkini</span>
        </Button>
      </div>

      {/* Tab 1: Presensi per Mata Pelajaran */}
      {activeTab === "mapel" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari mata pelajaran..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="pl-9 text-xs h-9.5 rounded-xl bg-card/60 backdrop-blur-xs border-border/80"
              />
            </div>
            {subjectSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSubjectSearch("")}
                className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground self-end sm:self-auto"
              >
                Reset Pencarian
              </Button>
            )}
          </div>

              {filteredSubjects.length === 0 ? (
                <div className="p-8 sm:p-10 text-center rounded-2xl bg-card border border-border text-muted-foreground text-xs space-y-2">
                  <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p className="font-semibold text-foreground">Tidak ada mata pelajaran yang cocok.</p>
                  <p>Coba sesuaikan kata kunci pencarian.</p>
                </div>
              ) : (
                <Card className="border border-border/80 shadow-xs overflow-hidden bg-card/60 backdrop-blur-xs">
                  {/* Mobile Scroll Hint Banner */}
                  <div className="md:hidden px-3.5 py-1.5 bg-muted/40 border-b border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>← Geser tabel ke samping →</span>
                    <span className="font-semibold text-foreground">{filteredSubjects.length} Mapel</span>
                  </div>

                  <div className="relative w-full overflow-x-auto scrollbar-thin">
                    <Table className="text-xs min-w-[660px]">
                      <TableHeader className="bg-muted/50 border-b border-border/70 sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-12 text-center font-bold">No</TableHead>
                          <TableHead className="font-bold min-w-[200px]">Mata Pelajaran</TableHead>
                          <TableHead className="text-center font-bold whitespace-nowrap">Pertemuan</TableHead>
                          <TableHead className="text-center font-bold text-emerald-600 dark:text-emerald-400">Hadir</TableHead>
                          <TableHead className="text-center font-bold text-sky-600 dark:text-sky-400">Sakit</TableHead>
                          <TableHead className="text-center font-bold text-amber-600 dark:text-amber-400">Izin</TableHead>
                          <TableHead className="text-center font-bold text-rose-600 dark:text-rose-400">Alpha</TableHead>
                          <TableHead className="text-center font-bold whitespace-nowrap">Kehadiran (%)</TableHead>
                          <TableHead className="text-center font-bold w-20">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-border/50">
                        {filteredSubjects.map((sub, idx) => {
                          const isSafe = sub.percentage >= 85;
                          const isWarning = sub.percentage >= 75 && sub.percentage < 85;

                          return (
                            <TableRow
                              key={sub.mapelId}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="text-center font-mono text-muted-foreground py-3">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-bold text-foreground py-3">
                                {sub.mapelNama}
                              </TableCell>
                              <TableCell className="text-center font-semibold text-foreground py-3 whitespace-nowrap">
                                {sub.totalPertemuan} Sesi
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <span className="inline-block min-w-6 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                                  {sub.hadir}
                                </span>
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <span className="inline-block min-w-6 px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
                                  {sub.sakit}
                                </span>
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <span className="inline-block min-w-6 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                  {sub.izin}
                                </span>
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <span className="inline-block min-w-6 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                                  {sub.alpha}
                                </span>
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <span
                                  className={cn(
                                    "font-bold text-xs",
                                    isSafe
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : isWarning
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-rose-600 dark:text-rose-400"
                                  )}
                                >
                                  {sub.percentage}%
                                </span>
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 gap-1 rounded-lg"
                                  onClick={() => setSelectedSubject(sub)}
                                  title="Lihat rincian sesi presensi mapel ini"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Detail</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter className="bg-muted/40 font-semibold border-t border-border/80">
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={2} className="text-right font-bold text-foreground py-3">
                            Total Rekapitulasi:
                          </TableCell>
                          <TableCell className="text-center font-bold text-foreground py-3 whitespace-nowrap">
                            {subjectSummaries.reduce((acc, s) => acc + s.totalPertemuan, 0)} Sesi
                          </TableCell>
                          <TableCell className="text-center font-black text-emerald-600 dark:text-emerald-400 py-3">
                            {overallStats.hadir}
                          </TableCell>
                          <TableCell className="text-center font-black text-sky-600 dark:text-sky-400 py-3">
                            {overallStats.sakit}
                          </TableCell>
                          <TableCell className="text-center font-black text-amber-600 dark:text-amber-400 py-3">
                            {overallStats.izin}
                          </TableCell>
                          <TableCell className="text-center font-black text-rose-600 dark:text-rose-400 py-3">
                            {overallStats.alpha}
                          </TableCell>
                          <TableCell className="text-center font-bold text-foreground py-3 whitespace-nowrap">
                            Rata-rata: {overallStats.percentage}%
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground py-3">
                            -
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </Card>
              )}
        </div>
      )}

      {/* Tab 2: Monthly Calendar */}
      {activeTab === "calendar" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {/* Left 2 Cols: Interactive Calendar */}
            <div className="md:col-span-2">
              <LiquidGlassCard
                borderRadius="24px"
                blurIntensity="xl"
                shadowIntensity="sm"
                glowIntensity="sm"
                draggable={false}
                className="p-0 border border-white/50 dark:border-white/10 bg-card/65 dark:bg-card/45 shadow-lg overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 p-4 sm:p-5 pb-3">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Kalender Presensi: {monthNames[month]} {year}</span>
                    </h2>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      Klik tanggal untuk melihat rincian sesi belajar dan jam ke
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 px-2.5 rounded-lg bg-background/60"
                      onClick={() => {
                        setCurrentDate(new Date());
                        setSelectedDate(todayStr);
                      }}
                    >
                      Hari Ini
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-background/60 backdrop-blur-sm border-white/50 dark:border-white/10 hover:bg-background/90"
                      onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                      title="Bulan sebelumnya"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-background/60 backdrop-blur-sm border-white/50 dark:border-white/10 hover:bg-background/90"
                      onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                      title="Bulan berikutnya"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 sm:p-5 pt-3">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] sm:text-xs font-semibold text-muted-foreground">
                    {dayNames.map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Day Grid */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
                    {calendarDays.map((d, index) => {
                      if (d === null) {
                        return <div key={`empty-${index}`} className="min-h-[50px] sm:min-h-[64px] md:min-h-[72px]" />;
                      }

                      const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                        d
                      ).padStart(2, "0")}`;
                      const dayEvents = getAttendanceForDay(d);
                      const hasEvents = dayEvents.length > 0;
                      const isSelected = selectedDate === dStr;
                      const isToday = todayStr === dStr;

                      return (
                        <button
                          key={`day-${d}`}
                          type="button"
                          onClick={() => setSelectedDate(dStr)}
                          className={cn(
                            "min-h-[50px] sm:min-h-[64px] md:min-h-[72px] border rounded-xl p-1 sm:p-1.5 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer focus:outline-none",
                            isSelected
                              ? "ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/60 shadow-sm"
                              : hasEvents
                              ? "bg-background/80 dark:bg-card/40 border-border/80 hover:border-emerald-400 hover:bg-muted/40 shadow-2xs"
                              : "border-border/30 hover:border-border/60 hover:bg-muted/20"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={cn(
                                "text-[11px] sm:text-xs font-bold pl-0.5",
                                isToday
                                  ? "h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] sm:text-xs"
                                  : isSelected
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-foreground"
                              )}
                            >
                              {d}
                            </span>
                            {hasEvents && (
                              <span className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground bg-muted/80 px-1 py-0.2 rounded">
                                {dayEvents.length}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-0.5 sm:gap-1 overflow-hidden mt-0.5 sm:mt-1">
                            {dayEvents.slice(0, 3).map((e) => (
                              <span
                                key={e.id}
                                title={e.title}
                                className="inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0"
                                style={{ backgroundColor: e.backgroundColor }}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold">
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border/40 mt-3 sm:mt-4 text-[11px] sm:text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500" /> Hadir
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-sky-500" /> Sakit
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-500" /> Izin
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-rose-500" /> Alpha
                    </span>
                  </div>
                </div>
              </LiquidGlassCard>
            </div>

            {/* Right Col: Selected Date Detail Panel */}
            <div className="space-y-3 md:col-span-1">
              <Card className="border border-border/80 shadow-xs h-full flex flex-col">
                <CardHeader className="p-4 border-b border-border/60 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Detail Presensi Harian
                      </span>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {formatDateIndo(selectedDate)}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {selectedDateEvents.length} Sesi KBM
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 flex-1 overflow-y-auto max-h-[460px] space-y-3">
                  {selectedDateEvents.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                      <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="font-semibold text-foreground">Tidak ada catatan presensi</p>
                      <p className="max-w-[220px] mx-auto">
                        Tidak ada sesi KBM yang dipresensi pada tanggal {formatDateIndo(selectedDate)}.
                      </p>
                      <p className="text-[10px] text-muted-foreground/75 pt-2">
                        Pilih tanggal di kalender yang memiliki titik warna untuk melihat rincian jam pelajaran.
                      </p>
                    </div>
                  ) : (
                    selectedDateEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl border border-border/70 bg-card space-y-2 hover:border-emerald-500/40 transition-colors shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">
                              {ev.mapelKode}
                            </span>
                            <h4 className="text-xs font-bold text-foreground">
                              {ev.mapelNama}
                            </h4>
                          </div>

                          <Badge
                            className={cn(
                              "text-[10px] font-semibold py-0.5",
                              ev.keterangan === "Hadir" && "bg-emerald-600 text-white",
                              ev.keterangan === "Sakit" && "bg-sky-600 text-white",
                              ev.keterangan === "Izin" && "bg-amber-600 text-white",
                              ev.keterangan === "Alpha" && "bg-rose-600 text-white"
                            )}
                          >
                            {ev.keterangan}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          {ev.jamKe && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              Jam Ke: {ev.jamKe}
                            </span>
                          )}
                          {ev.guruNama && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {ev.guruNama}
                            </span>
                          )}
                        </div>

                        {ev.catatan && (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
                            <strong>Catatan:</strong> {ev.catatan}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Riwayat Sesi Terkini */}
      {activeTab === "logs" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                    Riwayat Sesi Presensi Siswa
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Menampilkan {Math.min(filteredLogs.length, displayLogsLimit)} dari{" "}
                    {filteredLogs.length} rekaman presensi
                  </p>
                </div>

                {/* Filter Status Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogStatusFilter("all")}
                    className={cn(
                      "text-xs rounded-xl h-8 px-3 font-semibold transition-all cursor-pointer shadow-2xs shrink-0",
                      logStatusFilter === "all"
                        ? "bg-foreground text-background border-foreground hover:bg-foreground/90 hover:text-background"
                        : "bg-card/70 text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                    )}
                  >
                    Semua
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogStatusFilter("Hadir")}
                    className={cn(
                      "text-xs rounded-xl h-8 px-3 font-semibold transition-all cursor-pointer shadow-2xs shrink-0",
                      logStatusFilter === "Hadir"
                        ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:text-white"
                        : "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/60"
                    )}
                  >
                    Hadir
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogStatusFilter("Sakit")}
                    className={cn(
                      "text-xs rounded-xl h-8 px-3 font-semibold transition-all cursor-pointer shadow-2xs shrink-0",
                      logStatusFilter === "Sakit"
                        ? "bg-sky-600 text-white border-sky-600 hover:bg-sky-700 hover:text-white"
                        : "border-sky-500/40 text-sky-700 dark:text-sky-300 hover:bg-sky-500/10 hover:border-sky-500/60"
                    )}
                  >
                    Sakit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogStatusFilter("Izin")}
                    className={cn(
                      "text-xs rounded-xl h-8 px-3 font-semibold transition-all cursor-pointer shadow-2xs shrink-0",
                      logStatusFilter === "Izin"
                        ? "bg-amber-600 text-white border-amber-600 hover:bg-amber-700 hover:text-white"
                        : "border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/60"
                    )}
                  >
                    Izin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogStatusFilter("Alpha")}
                    className={cn(
                      "text-xs rounded-xl h-8 px-3 font-semibold transition-all cursor-pointer shadow-2xs shrink-0",
                      logStatusFilter === "Alpha"
                        ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 hover:text-white"
                        : "border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/60"
                    )}
                  >
                    Alpha
                  </Button>
                </div>
              </div>

              {/* Search Bar in Logs */}
              <div className="relative pt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari mapel, tanggal (YYYY-MM-DD), guru, atau catatan dispensasi..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-8 text-xs h-8.5 rounded-lg bg-card/60"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredLogs.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground space-y-2">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <p className="font-semibold text-foreground">Tidak ada catatan presensi ditemukan.</p>
                  <p>Sesuaikan filter status atau kata kunci pencarian Anda.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredLogs.slice(0, displayLogsLimit).map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">
                            {log.mapelNama}
                          </span>
                          {log.mapelKode && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded">
                              {log.mapelKode}
                            </span>
                          )}
                          {log.jamKe && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              (Jam: {log.jamKe})
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDateIndo(log.date)}
                          </span>
                          {log.guruNama && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              Guru: {log.guruNama}
                            </span>
                          )}
                        </div>

                        {log.catatan && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 italic bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block mt-0.5">
                            Catatan: {log.catatan}
                          </p>
                        )}
                      </div>

                      <Badge
                        className={cn(
                          "text-xs font-semibold px-3 py-1 self-start sm:self-auto",
                          log.keterangan === "Hadir" && "bg-emerald-600 text-white",
                          log.keterangan === "Sakit" && "bg-sky-600 text-white",
                          log.keterangan === "Izin" && "bg-amber-600 text-white",
                          log.keterangan === "Alpha" && "bg-rose-600 text-white"
                        )}
                      >
                        {log.keterangan}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {filteredLogs.length > displayLogsLimit && (
                <div className="p-4 border-t border-border/60 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg"
                    onClick={() => setDisplayLogsLimit((prev) => prev + 25)}
                  >
                    Tampilkan Lebih Banyak ({filteredLogs.length - displayLogsLimit} tersisa)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Detail Presensi per Mapel */}
      <Dialog
        open={!!selectedSubject}
        onOpenChange={(open) => !open && setSelectedSubject(null)}
      >
        <DialogContent className="w-[94vw] sm:max-w-xl max-h-[88vh] p-4 sm:p-6 overflow-y-auto rounded-2xl">
          {selectedSubject && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-sm sm:text-base font-bold truncate">
                      {selectedSubject.mapelNama}
                    </DialogTitle>
                    <DialogDescription className="text-xs truncate">
                      Kode: {selectedSubject.mapelKode} • Rincian kehadiran semua sesi KBM
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Subject Summary Pills */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Hadir</span>
                    <span className="text-sm sm:text-base font-black text-emerald-600">
                      {selectedSubject.hadir}
                    </span>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Sakit</span>
                    <span className="text-sm sm:text-base font-black text-sky-600">
                      {selectedSubject.sakit}
                    </span>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Izin</span>
                    <span className="text-sm sm:text-base font-black text-amber-600">
                      {selectedSubject.izin}
                    </span>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground block">Alpha</span>
                    <span className="text-sm sm:text-base font-black text-rose-600">
                      {selectedSubject.alpha}
                    </span>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                  <span className="font-medium text-muted-foreground">Persentase Kehadiran:</span>
                  <Badge
                    className={cn(
                      "self-start sm:self-auto",
                      selectedSubject.percentage >= 85
                        ? "bg-emerald-600 text-white"
                        : selectedSubject.percentage >= 75
                        ? "bg-amber-600 text-white"
                        : "bg-rose-600 text-white"
                    )}
                  >
                    {selectedSubject.percentage}% ({selectedSubject.hadir} dari{" "}
                    {selectedSubject.totalPertemuan} pertemuan)
                  </Badge>
                </div>

                {/* Session List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    Daftar Rekaman Sesi Belajar:
                  </h4>

                  {subjectSessions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      Belum ada catatan presensi KBM untuk mata pelajaran ini.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] sm:max-h-[320px] overflow-y-auto pr-1">
                      {subjectSessions.map((s) => (
                        <div
                          key={s.id}
                          className="p-2.5 sm:p-3 rounded-xl border border-border/80 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="font-semibold text-foreground">
                                {formatDateIndo(s.date)}
                              </span>
                              {s.jamKe && (
                                <span className="text-[10px] text-muted-foreground">
                                  (Jam: {s.jamKe})
                                </span>
                              )}
                            </div>
                            {s.guruNama && (
                              <p className="text-[11px] text-muted-foreground">
                                Guru: {s.guruNama}
                              </p>
                            )}
                            {s.catatan && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 italic break-words">
                                Catatan: {s.catatan}
                              </p>
                            )}
                          </div>

                          <Badge
                            className={cn(
                              "text-xs font-semibold self-start sm:self-auto shrink-0",
                              s.keterangan === "Hadir" && "bg-emerald-600 text-white",
                              s.keterangan === "Sakit" && "bg-sky-600 text-white",
                              s.keterangan === "Izin" && "bg-amber-600 text-white",
                              s.keterangan === "Alpha" && "bg-rose-600 text-white"
                            )}
                          >
                            {s.keterangan}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
