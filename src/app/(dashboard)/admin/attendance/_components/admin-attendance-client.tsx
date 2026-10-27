"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  Users,
  Download,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDateIndo } from "@/lib/utils";

interface ScheduleComplianceItem {
  jadwalId: string;
  kelasNama: string;
  jenjang: string;
  mapelNama: string;
  mapelKode: string;
  jamMulai: string;
  jamSelesai: string;
  guruId: string;
  guruNama: string;
  guruNip: string;
  isFilled: boolean;
  recordsCount: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
}

interface AdminAttendanceClientProps {
  dateStr: string;
  hari: string;
  summary: {
    totalScheduledSessions: number;
    filledSessionsCount: number;
    unfilledSessionsCount: number;
    complianceRate: number;
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
    totalAlpha: number;
  };
  scheduleCompliance: ScheduleComplianceItem[];
  classList: { id: string; nama: string }[];
  currentJenjang?: string;
  currentKelas?: string;
}

export function AdminAttendanceClient({
  dateStr,
  hari,
  summary,
  scheduleCompliance,
  classList,
  currentJenjang = "SEMUA",
  currentKelas = "SEMUA",
}: AdminAttendanceClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FILLED" | "UNFILLED">("ALL");
  const [selectedDate, setSelectedDate] = useState(dateStr);

  const updateFilters = (newParams: { date?: string; jenjang?: string; kelas?: string }) => {
    const d = newParams.date !== undefined ? newParams.date : dateStr;
    const j = newParams.jenjang !== undefined ? newParams.jenjang : currentJenjang;
    const k = newParams.kelas !== undefined ? newParams.kelas : currentKelas;

    const query = new URLSearchParams();
    query.set("date", d);
    if (j && j !== "SEMUA") query.set("jenjang", j);
    if (k && k !== "SEMUA") query.set("kelas", k);

    router.push(`/admin/attendance?${query.toString()}`);
  };

  const filteredSchedules = scheduleCompliance.filter((item) => {
    const matchesSearch =
      item.mapelNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kelasNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.guruNama.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "FILLED"
        ? item.isFilled
        : !item.isFilled;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card variant="default">
          <CardContent className="p-4 sm:p-5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Sesi KBM Hari Ini
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {summary.totalScheduledSessions}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Hari {hari}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="emerald">
          <CardContent className="p-4 sm:p-5">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
              Kepatuhan Absen Guru
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {summary.complianceRate}%
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {summary.filledSessionsCount} Sesi Terisi
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="amber">
          <CardContent className="p-4 sm:p-5">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
              Belum Diabsen
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {summary.unfilledSessionsCount}
              </span>
              <span className="text-xs text-amber-600 font-semibold">
                Sesi Menunggu
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="rose">
          <CardContent className="p-4 sm:p-5">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">
              Total Alpha Hari Ini
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                {summary.totalAlpha}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Sakit: {summary.totalSakit} • Izin: {summary.totalIzin}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card variant="default">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4 text-orange-500" /> Tanggal:
              </span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  updateFilters({ date: e.target.value });
                }}
                className="w-36 h-9 text-xs rounded-xl"
              />
            </div>

            {/* Jenjang Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Jenjang:</span>
              <Select
                value={currentJenjang}
                onValueChange={(val) => updateFilters({ jenjang: val ?? undefined })}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl w-28">
                  <SelectValue placeholder="Jenjang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMUA">Semua</SelectItem>
                  <SelectItem value="SD">SD</SelectItem>
                  <SelectItem value="SMP">SMP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kelas Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Kelas:</span>
              <Select
                value={currentKelas}
                onValueChange={(val) => updateFilters({ kelas: val ?? undefined })}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl w-44">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMUA">Semua Kelas</SelectItem>
                  {classList.map((c) => (
                    <SelectItem key={c.id} value={c.nama}>
                      {c.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                statusFilter === "ALL" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
              )}
            >
              Semua ({scheduleCompliance.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("FILLED")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                statusFilter === "FILLED" ? "bg-emerald-600 text-white shadow-2xs" : "text-muted-foreground"
              )}
            >
              Sudah ({summary.filledSessionsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("UNFILLED")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                statusFilter === "UNFILLED" ? "bg-orange-500 text-white shadow-2xs" : "text-muted-foreground"
              )}
            >
              Belum ({summary.unfilledSessionsCount})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan mata pelajaran, nama kelas, atau nama guru pengampu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11 text-xs rounded-xl bg-card border-border/80 shadow-2xs"
        />
      </div>

      {/* Audit Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 w-28 text-center">Jam KBM</th>
                <th className="py-3 px-4 min-w-[150px]">Kelas</th>
                <th className="py-3 px-4 min-w-[180px]">Mata Pelajaran</th>
                <th className="py-3 px-4 min-w-[180px]">Guru Pengampu</th>
                <th className="py-3 px-3 text-center w-32">Status Absensi</th>
                <th className="py-3 px-3 text-center min-w-[140px]">Rincian Kehadiran</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted-foreground text-xs">
                    Tidak ada jadwal KBM yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((item, idx) => (
                  <tr
                    key={item.jadwalId}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      !item.isFilled && "bg-orange-500/5"
                    )}
                  >
                    <td className="py-3 px-3 text-center font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="py-3 px-3 text-center font-mono text-[11px] text-muted-foreground">
                      <span className="block font-semibold text-foreground">
                        {item.jamMulai} - {item.jamSelesai}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground">{item.kelasNama}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground">{item.mapelNama}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-foreground">{item.guruNama}</p>
                      {item.guruNip &&
                        item.guruNip !== "-" &&
                        item.guruNip.toLowerCase() !== "kosong" && (
                          <span className="text-[11px] text-muted-foreground block">
                            NIP: {item.guruNip}
                          </span>
                        )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.isFilled ? (
                        <span className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Sudah Diabsen</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>Belum Diabsen</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.isFilled ? (
                        <div className="inline-flex items-center gap-2 text-[11px] font-mono">
                          <span className="text-emerald-600 font-bold" title="Hadir">{item.hadir} H</span>
                          <span className="text-sky-600 font-bold" title="Sakit">{item.sakit} S</span>
                          <span className="text-amber-600 font-bold" title="Izin">{item.izin} I</span>
                          <span className="text-rose-600 font-bold" title="Alpha">{item.alpha} A</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-[11px] italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Link
                        href={`/admin/attendance/detail?kelas=${encodeURIComponent(item.kelasNama)}&date=${dateStr}&mapel=${encodeURIComponent(item.mapelNama)}`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2 rounded-lg cursor-pointer"
                        >
                          Audit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
