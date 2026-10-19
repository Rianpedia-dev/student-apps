"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiquidGlassCard } from "@/components/ui/liquid-weather-glass";

interface AttendanceEvent {
  id: string;
  title: string;
  start: string;
  backgroundColor: string;
  extendedProps?: {
    keterangan: string;
    kelas: string;
  };
}

export function AttendanceHistoryClient() {
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
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

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
    return events.find((e) => e.start === dStr);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Card in Liquid Glass Style */}
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

        <div className="p-3 sm:p-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-muted-foreground pb-2">
            {dayNames.map((n) => (
              <div key={n} className="py-1">
                <span className="hidden sm:inline">{n}</span>
                <span className="sm:hidden text-[11px]">{n.substring(0, 3)}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((d, index) => {
              if (d === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[50px] sm:min-h-[76px] rounded-lg sm:rounded-xl bg-white/15 dark:bg-white/5 backdrop-blur-xs border border-white/20 dark:border-white/5"
                  />
                );
              }

              const att = getAttendanceForDay(d);
              const ket = att?.extendedProps?.keterangan || att?.title;

              return (
                <div
                  key={`day-${d}`}
                  className="flex flex-col justify-between min-h-[50px] sm:min-h-[76px] rounded-lg sm:rounded-xl border border-white/60 dark:border-white/10 p-1 sm:p-2 text-left bg-white/50 dark:bg-slate-900/40 backdrop-blur-md transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/60 hover:border-emerald-500/50 hover:shadow-xs"
                >
                  <span className="text-[11px] sm:text-xs font-bold text-foreground">{d}</span>
                  {ket ? (
                    <div
                      className="mt-1 rounded-md p-1 text-center font-bold text-white shadow-xs"
                      style={{ backgroundColor: att?.backgroundColor || "#198754" }}
                    >
                      <span className="hidden sm:inline text-[11px]">{ket}</span>
                      <span className="sm:hidden text-[10px] font-extrabold">{ket.charAt(0)}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/40 italic text-center pb-0.5">-</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Legend on Mobile */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shrink-0 shadow-xs" />
              <span>H = Hadir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-600 shrink-0 shadow-xs" />
              <span>S = Sakit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0 shadow-xs" />
              <span>I = Izin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600 shrink-0 shadow-xs" />
              <span>A = Alpha</span>
            </div>
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
}
