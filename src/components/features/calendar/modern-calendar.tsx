"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Sparkles,
  BookOpen,
  Award,
  Palmtree,
  GraduationCap,
  AlertCircle,
  Loader2,
  Filter,
  ChevronDown,
  List as ListIcon,
  Grid as GridIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  color: string;
  category: "Keagamaan" | "Akademik" | "Ujian" | "Libur" | "Ekstrakurikuler" | string;
  kelas: string;
  jenjang?: string;
  from?: string;
  canEdit?: boolean;
}

interface ClassOption {
  id: string;
  nama_kelas: string;
  jenjang?: string;
}

interface ModernCalendarProps {
  canManage?: boolean;
  userRole?: "admin" | "guru" | "siswa";
  userJenjang?: string | null;
  userClass?: string | null;
  classList?: ClassOption[];
  pageTitle?: string;
  pageSubtitle?: string;
}

// Konfigurasi Kategori yang Ramah Anak & Profesional
export const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    dotBg: string;
    badgeVariant: "emerald" | "blue" | "destructive" | "warning" | "purple" | "secondary";
    cardBorder: string;
    lightBg: string;
    textColor: string;
  }
> = {
  Keagamaan: {
    label: "Keagamaan",
    icon: Sparkles,
    dotBg: "bg-emerald-500",
    badgeVariant: "emerald",
    cardBorder: "border-l-emerald-500",
    lightBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    textColor: "text-emerald-400",
  },
  Akademik: {
    label: "Akademik",
    icon: BookOpen,
    dotBg: "bg-sky-500",
    badgeVariant: "blue",
    cardBorder: "border-l-sky-500",
    lightBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    textColor: "text-sky-400",
  },
  Ujian: {
    label: "Ujian",
    icon: GraduationCap,
    dotBg: "bg-rose-500",
    badgeVariant: "destructive",
    cardBorder: "border-l-rose-500",
    lightBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    textColor: "text-rose-400",
  },
  Libur: {
    label: "Libur",
    icon: Palmtree,
    dotBg: "bg-amber-500",
    badgeVariant: "warning",
    cardBorder: "border-l-amber-500",
    lightBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    textColor: "text-amber-400",
  },
  Ekstrakurikuler: {
    label: "Ekskul & Acara",
    icon: Award,
    dotBg: "bg-purple-500",
    badgeVariant: "purple",
    cardBorder: "border-l-purple-500",
    lightBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    textColor: "text-purple-400",
  },
};

const DEFAULT_CATEGORY = CATEGORY_CONFIG["Akademik"];

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function ModernCalendar({
  canManage = false,
  userRole = "siswa",
  userJenjang = "ALL",
  userClass = null,
  classList = [],
  pageTitle = "Kalender Kegiatan Sekolah",
  pageSubtitle = "Agenda kegiatan resmi, jadwal ujian, keagamaan, dan hari libur sekolah.",
}: ModernCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [formTitle, setFormTitle] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("Keagamaan");
  const [formStartDate, setFormStartDate] = useState<string>("");
  const [formStartTime, setFormStartTime] = useState<string>("07:30");
  const [formEndDate, setFormEndDate] = useState<string>("");
  const [formEndTime, setFormEndTime] = useState<string>("09:00");
  const [formKelas, setFormKelas] = useState<string>("Semua Kelas");
  const [formJenjang, setFormJenjang] = useState<string>(userJenjang === "SMP" ? "SMP" : userJenjang === "SD" ? "SD" : "ALL");
  const [formDescription, setFormDescription] = useState<string>("");

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // 1. Fetch Events dari API
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } else {
        toast.error("Gagal memuat agenda kalender.");
      }
    } catch (e) {
      console.error("Error fetching events:", e);
      toast.error("Terjadi kesalahan saat memuat agenda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      try {
        const res = await fetch("/api/events");
        if (res.ok && !ignore) {
          const data = await res.json();
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Error loading events:", e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  // 2. Filter Events (Search & Category)
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Category filter
      if (selectedCategory !== "ALL" && ev.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title?.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q);
        const matchKelas = ev.kelas?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchKelas) return false;
      }
      return true;
    });
  }, [events, selectedCategory, searchQuery]);

  // 3. Grid Kalender 7 Hari (Senin - Ahad)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Dapatkan hari dalam minggu (0: Min, 1: Sen, ..., 6: Sab). Ubah ke Senin=0, ..., Ahad=6
    let startingDay = firstDayOfMonth.getDay() - 1;
    if (startingDay === -1) startingDay = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Hari dari bulan sebelumnya
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Hari bulan saat ini
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Hari dari bulan berikutnya untuk melengkapi baris 7 kolom (kelipatan 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Ambil event untuk tanggal tertentu
  const getEventsForDate = useCallback(
    (d: Date) => {
      const targetStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      return filteredEvents.filter((ev) => {
        const start = new Date(ev.startTime);
        const end = new Date(ev.endTime || ev.startTime);

        const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

        return targetStr >= startStr && targetStr <= endStr;
      });
    },
    [filteredEvents]
  );

  // Agenda untuk tanggal yang sedang dipilih
  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(selectedDate);
  }, [getEventsForDate, selectedDate]);

  // Navigasi Bulan
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Helper format tanggal Indonesia
  const formatFullDate = (d: Date) => {
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (d: Date) => {
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimeOnly = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  // 4. Modal Handlers
  const handleOpenCreate = (date?: Date) => {
    setEditingEvent(null);
    const target = date || selectedDate || new Date();
    const dateStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;

    setFormTitle("");
    setFormCategory("Keagamaan");
    setFormStartDate(dateStr);
    setFormStartTime("07:30");
    setFormEndDate(dateStr);
    setFormEndTime("09:00");
    setFormKelas(userClass || "Semua Kelas");
    setFormJenjang(userJenjang === "SMP" ? "SMP" : userJenjang === "SD" ? "SD" : "ALL");
    setFormDescription("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    const start = new Date(ev.startTime);
    const end = new Date(ev.endTime || ev.startTime);

    const sDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const sTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;

    const eDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    const eTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

    setFormTitle(ev.title);
    setFormCategory(ev.category || "Akademik");
    setFormStartDate(sDate);
    setFormStartTime(sTime);
    setFormEndDate(eDate);
    setFormEndTime(eTime);
    setFormKelas(ev.kelas || "Semua Kelas");
    setFormJenjang(ev.jenjang || "ALL");
    setFormDescription(ev.description || "");
    setIsDialogOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Judul agenda kegiatan wajib diisi.");
      return;
    }
    if (!formStartDate) {
      toast.error("Tanggal mulai kegiatan wajib dipilih.");
      return;
    }

    try {
      setIsSubmitting(true);

      const startDateTime = new Date(`${formStartDate}T${formStartTime || "00:00"}:00`);
      const endDateTime = formEndDate
        ? new Date(`${formEndDate}T${formEndTime || "23:59"}:00`)
        : startDateTime;

      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        kelas: formKelas,
        jenjang: formJenjang,
        description: formDescription.trim(),
        color: CATEGORY_CONFIG[formCategory]?.dotBg.replace("bg-", "").replace("-500", "") || "emerald",
      };

      if (editingEvent) {
        // UPDATE
        const res = await fetch(`/api/events/${editingEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (res.ok && result.success) {
          toast.success("Agenda kegiatan berhasil diperbarui!");
          setIsDialogOpen(false);
          fetchEvents();
        } else {
          toast.error(result.error || "Gagal memperbarui agenda.");
        }
      } else {
        // CREATE
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (res.ok && result.success) {
          toast.success("Agenda kegiatan baru berhasil ditambahkan!");
          setIsDialogOpen(false);
          fetchEvents();
        } else {
          toast.error(result.error || "Gagal menambahkan agenda.");
        }
      }
    } catch (err) {
      console.error("Error submitting event:", err);
      toast.error("Terjadi kesalahan sistem saat menyimpan agenda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/events/${deletingId}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Agenda kegiatan berhasil dihapus.");
        setIsDeleteDialogOpen(false);
        setDeletingId(null);
        fetchEvents();
      } else {
        toast.error(result.error || "Gagal menghapus agenda.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus agenda.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header Judul Halaman */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <span>{pageTitle}</span>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-emerald-500 shrink-0" />}
        </h1>
      </div>

      {/* 2. Bar Navigasi Bulan / Pencarian & Toolbar Aksi (Dibungkus 1 Card) */}
      <Card elevationSize="sm" className="border border-border/50 bg-card shadow-sm rounded-2xl p-2.5 sm:p-3.5">
        <div className="flex flex-col lg:flex-row lg:flex-wrap xl:flex-nowrap lg:items-center justify-between gap-3">
          {/* Kiri: Navigasi Bulan (Mode Kalender) atau Pencarian (Mode Daftar) */}
          {viewMode === "calendar" ? (
            <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-foreground"
                  onClick={handlePrevMonth}
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-base sm:text-lg font-bold text-foreground capitalize px-1 select-none whitespace-nowrap">
                  {MONTH_NAMES[month]} {year}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-foreground"
                  onClick={handleNextMonth}
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-8 sm:h-9 px-3 rounded-xl border-border/60 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10 active:scale-95"
              >
                Hari Ini
              </Button>
            </div>
          ) : (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul kegiatan atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-8 sm:h-9 text-xs sm:text-sm rounded-xl bg-background/60 border-border/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Kanan: Category Filter Dropdown, View Switcher & Add Button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-start lg:justify-end w-full lg:w-auto shrink-0">
            {/* Dropdown Filter Kategori */}
            <div className="relative flex-1 min-w-[140px] sm:flex-none sm:min-w-[165px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={cn(
                  "w-full h-8 sm:h-9 pl-7 pr-7 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs cursor-pointer appearance-none transition-colors",
                  selectedCategory !== "ALL"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-card border-border/60 text-foreground hover:border-border"
                )}
                aria-label="Filter Kategori Kegiatan"
              >
                <option value="ALL">Semua Kategori</option>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <Filter
                className={cn(
                  "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none",
                  selectedCategory !== "ALL" ? "text-emerald-500" : "text-muted-foreground"
                )}
              />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Switcher Tampilan: Kalender vs Daftar */}
            <div className="flex items-center p-0.5 sm:p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/40 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all text-xs cursor-pointer active:scale-95",
                  viewMode === "calendar"
                    ? "bg-emerald-600 text-white shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <GridIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Kalender</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all text-xs cursor-pointer active:scale-95",
                  viewMode === "list"
                    ? "bg-emerald-600 text-white shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ListIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Daftar</span>
              </button>
            </div>

            {canManage && (
              <Button
                type="button"
                onClick={() => handleOpenCreate(selectedDate)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Agenda Baru</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Tampilan Kalender Bulanan (Month View) - 2-Column pada Desktop XL, Full Width pada Mobile & iPad */}
      {viewMode === "calendar" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5 items-start">
          {/* Kolom Kalender Grid:
              - Mobile & iPad (< 1280px, xl): 100% full width
              - Large Desktop (>= 1280px, xl): 8 columns
          */}
          <div className="xl:col-span-8 min-w-0">
            {/* Grid Kalender */}
            <Card className="border border-border/50 overflow-hidden shadow-sm bg-card">
              {/* Header Nama Hari (Sen - Min) */}
              <div className="grid grid-cols-7 border-b border-border/40 bg-muted/40 text-center select-none">
                {DAY_NAMES.map((dayName, idx) => (
                  <div
                    key={dayName}
                    className={cn(
                      "py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold",
                      idx === 6 ? "text-rose-400" : idx === 4 ? "text-emerald-400" : "text-muted-foreground"
                    )}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Grid Tanggal */}
              <div className="grid grid-cols-7 divide-x divide-y divide-border/30">
                {calendarDays.map((dayObj, index) => {
                  const dayEvents = getEventsForDate(dayObj.date);
                  const isToday =
                    dayObj.date.toDateString() === new Date().toDateString();
                  const isSelected =
                    dayObj.date.toDateString() === selectedDate.toDateString();

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(dayObj.date)}
                      className={cn(
                        // Responsive height: mobile h-16 (60px), tablet/iPad (82px), desktop (96px)
                        "min-h-[60px] sm:min-h-[82px] xl:min-h-[96px] p-1 sm:p-1.5 transition-all cursor-pointer relative flex flex-col justify-between group touch-manipulation active:scale-[0.98]",
                        !dayObj.isCurrentMonth
                          ? "bg-muted/10 text-muted-foreground/35"
                          : "bg-card hover:bg-accent/30 text-foreground",
                        isSelected && "ring-2 ring-emerald-500 bg-emerald-500/10 z-10 rounded-sm"
                      )}
                    >
                      {/* Nomor Tanggal & Counter Badge */}
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full text-[11px] sm:text-xs font-semibold transition-colors",
                            isToday
                              ? "bg-emerald-600 text-white font-bold shadow-xs"
                              : isSelected
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold"
                              : "text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                          )}
                        >
                          {dayObj.date.getDate()}
                        </span>

                        {/* Indikator angka di tablet, iPad, & desktop */}
                        {dayEvents.length > 0 && (
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium hidden sm:inline">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Indicator di Sel Tanggal */}
                      <div className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1 overflow-hidden">
                        {/* Tablet, iPad, & Desktop (sm+): Pill Event Cantik */}
                        <div className="hidden sm:flex flex-col gap-1">
                          {dayEvents.slice(0, 2).map((ev) => {
                            const catConfig = CATEGORY_CONFIG[ev.category] || DEFAULT_CATEGORY;
                            return (
                              <div
                                key={ev.id}
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded truncate font-medium border flex items-center gap-1",
                                  catConfig.lightBg
                                )}
                                title={ev.title}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", catConfig.dotBg)} />
                                <span className="truncate">{ev.title}</span>
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[9px] text-muted-foreground font-medium pl-1">
                              +{dayEvents.length - 2} lainnya
                            </div>
                          )}
                        </div>

                        {/* Mobile (< sm): Dot Ceria yang Jelas & Ramah Anak */}
                        <div className="flex sm:hidden items-center justify-center gap-1 flex-wrap pt-0.5 pb-0.5">
                          {dayEvents.slice(0, 3).map((ev) => {
                            const catConfig = CATEGORY_CONFIG[ev.category] || DEFAULT_CATEGORY;
                            return (
                              <span
                                key={ev.id}
                                className={cn(
                                  "h-2 w-2 rounded-full shrink-0 ring-1 ring-background shadow-xs",
                                  catConfig.dotBg
                                )}
                                title={ev.title}
                              />
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/60 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Kolom Detail Agenda Hari Terpilih:
              - Mobile & iPad/Tablet (< 1280px, xl): Tampil leluasa di bawah kalender
              - Large Desktop (>= 1280px, xl): 4 kolom di samping kanan (sticky)
          */}
          <div className="xl:col-span-4 space-y-3 min-w-0">
            <Card className="border border-border/60 bg-card shadow-xs xl:sticky xl:top-4 overflow-hidden rounded-2xl">
              <div className="p-3 sm:p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
                      Agenda Hari Terpilih
                    </span>
                    {selectedDateEvents.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        {selectedDateEvents.length}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-foreground truncate mt-0.5">
                    {formatFullDate(selectedDate)}
                  </h3>
                </div>

                {canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenCreate(selectedDate)}
                    aria-label="Tambah Agenda"
                    className="h-7 sm:h-8 text-xs gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Tambah</span>
                  </Button>
                )}
              </div>

              <CardContent className="p-3 sm:p-4 xl:max-h-[580px] xl:overflow-y-auto scrollbar-thin">
                {selectedDateEvents.length === 0 ? (
                  <div className="py-8 sm:py-10 px-3 text-center space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      Tidak ada agenda khusus
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      Belum ada jadwal kegiatan sekolah pada tanggal ini. Waktunya belajar dan berkegiatan dengan ceria! ✨
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
                    {selectedDateEvents.map((ev) => {
                      const catConfig = CATEGORY_CONFIG[ev.category] || DEFAULT_CATEGORY;
                      const IconComp = catConfig.icon;

                      return (
                        <div
                          key={ev.id}
                          className={cn(
                            "p-3 rounded-xl border bg-card/60 transition-all shadow-xs space-y-2",
                            catConfig.cardBorder,
                            "border-l-4 hover:border-border"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant={catConfig.badgeVariant} size="sm" className="gap-1 text-[10px]">
                                <IconComp className="h-3 w-3" />
                                {catConfig.label}
                              </Badge>
                              {ev.kelas && (
                                <Badge variant="outline" size="sm" className="text-[10px]">
                                  {ev.kelas}
                                </Badge>
                              )}
                            </div>

                            {ev.canEdit && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleOpenEdit(ev)}
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  title="Edit Agenda"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    setDeletingId(ev.id);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                                  title="Hapus Agenda"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                              {ev.title}
                            </h4>
                            {ev.description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {ev.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/30">
                            <span className="flex items-center gap-1 font-medium text-foreground/80">
                              <Clock className="h-3 w-3 text-emerald-400" />
                              {formatTimeOnly(ev.startTime)} - {formatTimeOnly(ev.endTime)} WIB
                            </span>
                            {ev.from && (
                              <span className="text-[10px] text-muted-foreground/80 truncate max-w-[110px]">
                                Oleh: {ev.from}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 4. Tampilan Daftar Agenda (List View) - 1 col (mobile), 2 col (iPad), 3 col (Desktop XL) */}
      {viewMode === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Menampilkan {filteredEvents.length} agenda kegiatan
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <Card className="border border-border/50 bg-card p-10 sm:p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Tidak ada agenda kegiatan
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Belum ada agenda yang cocok dengan filter atau pencarian Anda saat ini.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredEvents.map((ev) => {
                const catConfig = CATEGORY_CONFIG[ev.category] || DEFAULT_CATEGORY;
                const IconComp = catConfig.icon;
                const startDate = new Date(ev.startTime);

                return (
                  <Card
                    key={ev.id}
                    className={cn(
                      "border border-border/50 bg-card p-3.5 sm:p-4 transition-all shadow-xs space-y-3 flex flex-col justify-between",
                      catConfig.cardBorder,
                      "border-l-4 hover:border-border"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={catConfig.badgeVariant} size="sm" className="gap-1 text-[10px]">
                            <IconComp className="h-3 w-3" />
                            {catConfig.label}
                          </Badge>
                          {ev.kelas && (
                            <Badge variant="outline" size="sm" className="text-[10px]">
                              {ev.kelas}
                            </Badge>
                          )}
                          {ev.jenjang && ev.jenjang !== "ALL" && (
                            <Badge variant="secondary" size="sm" className="text-[10px]">
                              {ev.jenjang}
                            </Badge>
                          )}
                        </div>

                        {ev.canEdit && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleOpenEdit(ev)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Edit Agenda"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setDeletingId(ev.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                              title="Hapus Agenda"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                          {ev.title}
                        </h4>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                        <CalendarIcon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{formatShortDate(startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeOnly(ev.startTime)} WIB</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Modal Dialog Form Tambah / Edit Agenda (Mobile & iPad friendly) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[94vw] sm:max-w-xl max-h-[88vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <span>{editingEvent ? "Edit Agenda Kegiatan" : "Tambah Agenda Baru"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Isi informasi kegiatan kalender sekolah dengan rapi dan jelas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-3.5 sm:space-y-4 pt-2">
            {/* Pilihan Kategori Kegiatan (Dropdown List) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Kategori Kegiatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                required
                className="w-full h-9 sm:h-10 rounded-md border border-input bg-card px-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Judul Kegiatan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Judul Agenda Kegiatan <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Sholat Dhuha Bersama / Penilaian Tengah Semester"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                className="text-xs sm:text-sm h-9 sm:h-10"
              />
            </div>

            {/* Tanggal & Waktu Mulai */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tanggal Mulai <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Jam Mulai
                </label>
                <Input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
            </div>

            {/* Tanggal & Waktu Selesai */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tanggal Selesai (Opsional)
                </label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Jam Selesai
                </label>
                <Input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
            </div>

            {/* Target Jenjang & Kelas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Jenjang (Hanya Admin yang bisa ubah) */}
              {userRole === "admin" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Target Jenjang Sekolah
                  </label>
                  <select
                    value={formJenjang}
                    onChange={(e) => setFormJenjang(e.target.value)}
                    className="w-full h-9 sm:h-10 rounded-md border border-input bg-card px-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="ALL">Semua Jenjang (SD & SMP)</option>
                    <option value="SD">Khusus Jenjang SD</option>
                    <option value="SMP">Khusus Jenjang SMP</option>
                  </select>
                </div>
              )}

              {/* Sasaran Kelas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Sasaran Kelas
                </label>
                <select
                  value={formKelas}
                  onChange={(e) => setFormKelas(e.target.value)}
                  className="w-full h-9 sm:h-10 rounded-md border border-input bg-card px-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  {classList.map((c) => (
                    <option key={c.id} value={c.nama_kelas}>
                      {c.nama_kelas} {c.jenjang ? `(${c.jenjang})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Keterangan Tambahan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Keterangan / Catatan Tambahan (Opsional)
              </label>
              <Textarea
                placeholder="Tuliskan catatan perlengkapan yang perlu dibawa, lokasi kegiatan, atau hal penting lainnya..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="text-xs sm:text-sm"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 sm:h-10 text-xs sm:text-sm font-semibold active:scale-95"
              >
                {isSubmitting ? "Menyimpan..." : editingEvent ? "Perbarui Agenda" : "Terbitkan Agenda"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Modal Konfirmasi Hapus Agenda */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[92vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>Konfirmasi Hapus Agenda</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Apakah Anda yakin ingin menghapus agenda kegiatan ini? Agenda yang dihapus tidak dapat dipulihkan kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-9 text-xs sm:text-sm"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="h-9 text-xs sm:text-sm font-semibold"
            >
              Ya, Hapus Agenda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
