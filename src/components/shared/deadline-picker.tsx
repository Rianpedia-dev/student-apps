"use client";

import React, { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { id as idLocale } from "date-fns/locale/id";
import { Calendar, Clock, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeadlinePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const BASE_MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55", "59"];

function formatToLocalInputValue(date: Date, hour: string, minute: string): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hour}:${minute}`;
}

function parseDeadlineValue(value: string): {
  date: Date;
  hour: string;
  minute: string;
} {
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 3);

  if (!value) {
    return { date: fallback, hour: "23", minute: "59" };
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    const [, y, m, d, hh, min] = match;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    if (!Number.isNaN(parsed.getTime())) {
      return { date: parsed, hour: hh, minute: min };
    }
  }

  const parsedFallback = new Date(value);
  if (!Number.isNaN(parsedFallback.getTime())) {
    return {
      date: new Date(
        parsedFallback.getFullYear(),
        parsedFallback.getMonth(),
        parsedFallback.getDate()
      ),
      hour: String(parsedFallback.getHours()).padStart(2, "0"),
      minute: String(parsedFallback.getMinutes()).padStart(2, "0"),
    };
  }

  return { date: fallback, hour: "23", minute: "59" };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DeadlinePicker({ value, onChange }: DeadlinePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { date: selectedDate, hour, minute } = useMemo(
    () => parseDeadlineValue(value),
    [value]
  );

  const minuteOptions = useMemo(() => {
    if (BASE_MINUTES.includes(minute)) return BASE_MINUTES;
    return [...BASE_MINUTES, minute].sort();
  }, [minute]);

  const displayDate = useMemo(() => {
    return selectedDate.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [selectedDate]);

  const presets = useMemo(() => {
    const makeDate = (daysAhead: number) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + daysAhead);
      return d;
    };
    return [
      { label: "Hari Ini", date: makeDate(0) },
      { label: "Besok", date: makeDate(1) },
      { label: "+3 Hari", date: makeDate(3) },
      { label: "+7 Hari", date: makeDate(7) },
    ];
  }, []);

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;
    onChange(formatToLocalInputValue(day, hour, minute));
    setIsOpen(false);
  };

  const handleHourChange = (newHour: string) => {
    onChange(formatToLocalInputValue(selectedDate, newHour, minute));
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(formatToLocalInputValue(selectedDate, hour, newMinute));
  };

  const handlePresetClick = (presetDate: Date) => {
    onChange(formatToLocalInputValue(presetDate, "23", "59"));
  };

  return (
    <div className="space-y-2">
      {/* Main Row: Date Button + Time Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Date Picker Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex-1 h-10 rounded-xl border border-input bg-background/80 hover:bg-muted/40 px-3 flex items-center justify-between gap-2 text-xs sm:text-sm font-medium text-foreground cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{displayDate}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>

        {/* Time Picker (Jam : Menit WIB) */}
        <div className="h-10 rounded-xl border border-input bg-background/80 px-2.5 flex items-center justify-between sm:justify-start gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0 mr-1" />
            <select
              aria-label="Jam deadline"
              value={hour}
              onChange={(e) => handleHourChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-foreground focus:outline-none cursor-pointer px-1 py-0.5 rounded-md hover:bg-muted"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-muted-foreground">:</span>
            <select
              aria-label="Menit deadline"
              value={minute}
              onChange={(e) => handleMinuteChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-foreground focus:outline-none cursor-pointer px-1 py-0.5 rounded-md hover:bg-muted"
            >
              {minuteOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground pl-1">
            WIB
          </span>
        </div>
      </div>

      {/* Quick Preset Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((preset) => {
          const isActive =
            isSameDay(selectedDate, preset.date) && hour === "23" && minute === "59";
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetClick(preset.date)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Calendar Picker Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-sm p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-bold">
              Pilih Tanggal Tenggat
            </DialogTitle>
          </DialogHeader>

          <DayPicker
            mode="single"
            locale={idLocale}
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={handleDateSelect}
            classNames={{
              root: "w-full select-none",
              months: "flex flex-col w-full",
              month: "relative space-y-3 w-full",
              month_caption: "flex items-center justify-center h-9",
              caption_label: "text-sm font-bold text-foreground capitalize",
              nav: "flex items-center justify-between absolute inset-x-0 top-0 h-9 pointer-events-none z-10",
              button_previous:
                "pointer-events-auto h-8 w-8 rounded-xl border border-border/70 bg-background/80 hover:bg-muted inline-flex items-center justify-center text-foreground cursor-pointer transition-colors",
              button_next:
                "pointer-events-auto h-8 w-8 rounded-xl border border-border/70 bg-background/80 hover:bg-muted inline-flex items-center justify-center text-foreground cursor-pointer transition-colors",
              chevron: "h-4 w-4 fill-current",
              month_grid: "w-full border-collapse",
              weekdays: "grid grid-cols-7 mb-1",
              weekday:
                "text-[11px] font-bold uppercase text-muted-foreground text-center py-1",
              weeks: "space-y-1",
              week: "grid grid-cols-7 gap-1",
              day: "flex items-center justify-center p-0",
              day_button:
                "h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-xs sm:text-sm font-medium inline-flex items-center justify-center hover:bg-muted transition-colors cursor-pointer",
              selected:
                "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:font-bold [&>button]:hover:bg-primary/90",
              today:
                "[&>button]:border [&>button]:border-primary/50 [&>button]:text-primary [&>button]:font-bold",
              outside: "[&>button]:text-muted-foreground/40",
              disabled:
                "[&>button]:text-muted-foreground/30 [&>button]:pointer-events-none",
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

