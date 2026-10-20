"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LiquidGlassCard } from "@/components/ui/liquid-weather-glass";
import { cn, formatDateIndo } from "@/lib/utils";
import { SubjectAttendanceSummary } from "@/services/attendance.service";

interface AttendanceEvent {
  id: string;
  title: string;
  start: string;
  backgroundColor: string;
  extendedProps?: {
    keterangan: string;
    kelas: string;
    mapelNama?: string;
    catatan?: string;
  };
}

interface AttendanceHistoryClientProps {
  overallStats: {
    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;
    percentage: number;
  };
  subjectSummaries: SubjectAttendanceSummary[];
  recentLogs: {
    id: string;
    date: string;
    mapelNama: string;
    keterangan: string;
    catatan?: string;
    jamKe?: string;
  }[];
}

export function AttendanceHistoryClient({
  overallStats,
  subjectSummaries,
  recentLogs,
}: AttendanceHistoryClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await fetch("/api/attendance/history");
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const getAttendanceForDay = (d: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return events.filter((e) => e.start === dStr);
  };

  return (
    <div className="space-y-6">
      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <Card variant="emerald">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
              Total Hadir
            </span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {overallStats.hadir}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Sesi KBM</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="sky">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block">
              Total Sakit
            </span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {overallStats.sakit}
              </span>
              <span className="text-xs text-sky-600 font-semibold">Izin Dokter</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="amber">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
              Total Izin
            </span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {overallStats.izin}
              </span>
              <span className="text-xs text-amber-600 font-semibold">Resmi</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="rose">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">
              Total Alpha
            </span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {overallStats.alpha}
              </span>
              <span className="text-xs text-rose-600 font-semibold">Tanpa Ket.</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="default" className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Persentase Kehadiran
            </span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span
                className={cn(
                  "text-2xl font-black",
                  overallStats.percentage >= 85
                    ? "text-emerald-600"
                    : overallStats.percentage >= 75
                    ? "text-amber-600"
                    : "text-rose-600"
                )}
              >
                {overallStats.percentage}%
              </span>
              <span className="text-[10px] text-muted-foreground">Min. 80%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="mapel" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="mapel" className="text-xs rounded-lg gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span>Presensi per Mata Pelajaran</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs rounded-lg gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Kalender Presensi</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs rounded-lg gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Riwayat Sesi Terkini</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Per Mata Pelajaran */}
        <TabsContent value="mapel" className="space-y-4">
          {subjectSummaries.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-card border border-border text-muted-foreground text-xs">
              Belum ada rekaman presensi mata pelajaran yang tercatat.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectSummaries.map((sub) => {
                const isSafe = sub.percentage >= 85;
                const isWarning = sub.percentage >= 75 && sub.percentage < 85;

                return (
                  <Card key={sub.mapelId} className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-xs">
                    <CardContent className="p-4 sm:p-5 space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                            {sub.mapelKode}
                          </span>
                          <h3 className="text-base font-bold text-foreground">
                            {sub.mapelNama}
                          </h3>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs font-semibold",
                            isSafe
                              ? "bg-emerald-600 text-white"
                              : isWarning
                              ? "bg-amber-600 text-white"
                              : "bg-rose-600 text-white"
                          )}
                        >
                          {sub.percentage}% Kehadiran
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              isSafe ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-rose-500"
                            )}
                            style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{sub.hadir} dari {sub.totalPertemuan} pertemuan</span>
                          <span>
                            {isSafe ? "✓ Memenuhi Syarat Asesmen" : "⚠️ Perhatian Kehadiran"}
                          </span>
                        </div>
                      </div>

                      {/* Detail Badges */}
                      <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10">
                          <span className="text-[10px] text-muted-foreground block">Hadir</span>
                          <span className="font-bold text-emerald-600">{sub.hadir}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-sky-500/10">
                          <span className="text-[10px] text-muted-foreground block">Sakit</span>
                          <span className="font-bold text-sky-600">{sub.sakit}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-500/10">
                          <span className="text-[10px] text-muted-foreground block">Izin</span>
                          <span className="font-bold text-amber-600">{sub.izin}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-rose-500/10">
                          <span className="text-[10px] text-muted-foreground block">Alpha</span>
                          <span className="font-bold text-rose-600">{sub.alpha}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Monthly Calendar */}
        <TabsContent value="calendar" className="space-y-4">
          <LiquidGlassCard
            borderRadius="24px"
            blurIntensity="xl"
            shadowIntensity="sm"
            glowIntensity="sm"
            draggable={false}
            className="p-0 border border-white/50 dark:border-white/10 bg-card/65 dark:bg-card/45 shadow-lg overflow-hidden"
          >
            <div className="flex flex-row items-center justify-between border-b border-border/60 p-4 sm:p-6 pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Kalender Presensi: {monthNames[month]} {year}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Titik warna menunjukkan status presensi KBM pada setiap tanggal
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-background/60 backdrop-blur-sm border-white/50 dark:border-white/10 hover:bg-background/90"
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-background/60 backdrop-blur-sm border-white/50 dark:border-white/10 hover:bg-background/90"
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 sm:p-6 pt-3">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-semibold text-muted-foreground">
                {dayNames.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((d, index) => {
                  if (d === null) {
                    return <div key={`empty-${index}`} className="h-14 sm:h-20" />;
                  }

                  const dayEvents = getAttendanceForDay(d);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div
                      key={`day-${d}`}
                      className={cn(
                        "h-14 sm:h-20 border rounded-xl p-1 sm:p-1.5 flex flex-col justify-between transition-all duration-200",
                        hasEvents
                          ? "bg-background/80 dark:bg-card/40 border-border/80 shadow-2xs"
                          : "border-border/30 hover:border-border/60"
                      )}
                    >
                      <span className="text-xs font-bold text-foreground pl-0.5">{d}</span>
                      <div className="flex flex-wrap gap-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            title={e.title}
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: e.backgroundColor }}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 pt-5 border-t border-border/40 mt-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Hadir
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Sakit
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Izin
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Alpha
                </span>
              </div>
            </div>
          </LiquidGlassCard>
        </TabsContent>

        {/* Tab 3: Recent Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="p-4 sm:p-5">
              <CardTitle className="text-base font-bold text-foreground">
                Riwayat Sesi Presensi Terkini
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Belum ada log presensi yang tercatat.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{log.mapelNama}</span>
                          {log.jamKe && (
                            <span className="text-[10px] text-muted-foreground">({log.jamKe})</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDateIndo(log.date)}
                        </p>
                        {log.catatan && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                            Catatan: {log.catatan}
                          </p>
                        )}
                      </div>

                      <Badge
                        className={cn(
                          "text-xs font-semibold",
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
