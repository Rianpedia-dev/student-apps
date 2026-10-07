"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  BookOpen,
  ListTodo,
  Search,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ScheduleItemData {
  id: string;
  kelasId: string;
  kelasNama: string;
  jenjang: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  mapelWarna: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  ruang?: string | null;
  meetingsCount: number;
  tasksCount: number;
}

interface GuruMapelTableProps {
  schedules: ScheduleItemData[];
}

export function GuruMapelTable({ schedules }: GuruMapelTableProps) {
  const [search, setSearch] = useState("");
  const [selectedHari, setSelectedHari] = useState<string>("all");
  const [selectedJenjang, setSelectedJenjang] = useState<string>("all");

  // Daftar hari unik yang ada di jadwal
  const availableDays = useMemo(() => {
    const daysOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const foundDays = new Set(schedules.map((s) => s.hari));
    return daysOrder.filter((d) => foundDays.has(d));
  }, [schedules]);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.mapelNama.toLowerCase().includes(q) ||
        s.mapelKode.toLowerCase().includes(q) ||
        s.kelasNama.toLowerCase().includes(q) ||
        s.hari.toLowerCase().includes(q) ||
        (s.ruang && s.ruang.toLowerCase().includes(q));

      const matchHari = selectedHari === "all" || s.hari.toLowerCase() === selectedHari.toLowerCase();
      const matchJenjang =
        selectedJenjang === "all" || s.jenjang.toUpperCase() === selectedJenjang.toUpperCase();

      return matchSearch && matchHari && matchJenjang;
    });
  }, [schedules, search, selectedHari, selectedJenjang]);

  const getDayBadgeVariant = (hari: string) => {
    switch (hari.toLowerCase()) {
      case "senin":
        return "emerald";
      case "selasa":
        return "sky";
      case "rabu":
        return "amber";
      case "kamis":
        return "purple";
      case "jumat":
        return "teal";
      case "sabtu":
        return "rose";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">

      {/* 2. Filter & Pencarian Bar */}
      <div className="rounded-2xl bg-card border border-border/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Kolom Pencarian */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari mata pelajaran, kelas, atau hari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-background text-sm border-border"
          />
        </div>

        {/* Filter Hari & Jenjang */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Hari Tabs */}
          <div className="inline-flex rounded-xl bg-muted/50 p-1 border border-border/60 text-xs font-medium gap-1 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSelectedHari("all")}
              className={`rounded-lg px-3 py-1.5 transition-all text-xs font-semibold cursor-pointer ${
                selectedHari === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua Hari
            </button>
            {availableDays.map((hari) => (
              <button
                key={hari}
                type="button"
                onClick={() => setSelectedHari(hari)}
                className={`rounded-lg px-2.5 py-1.5 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedHari.toLowerCase() === hari.toLowerCase()
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {hari}
              </button>
            ))}
          </div>

          {/* Reset Filter jika aktif */}
          {(search || selectedHari !== "all" || selectedJenjang !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedHari("all");
                setSelectedJenjang("all");
              }}
              className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground rounded-xl"
            >
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* 3. TAMPILAN TABEL JADWAL MENGAJAR */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  No
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[170px]">
                  Hari & Sesi Waktu
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[240px]">
                  Mata Pelajaran
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[200px]">
                  Rombel / Kelas
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-center min-w-[220px]">
                  Aksi & Pengelolaan
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-muted-foreground/70" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        Tidak ada jadwal mengajar yang sesuai
                      </p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        {search || selectedHari !== "all"
                          ? "Coba sesuaikan kata kunci pencarian atau ganti filter hari Anda."
                          : "Jadwal mengajar untuk akun ini belum didaftarkan oleh administrator."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((sch, index) => {
                  const dayVariant = getDayBadgeVariant(sch.hari);
                  return (
                    <TableRow
                      key={sch.id}
                      className="hover:bg-muted/30 transition-colors border-b border-border/60 group"
                    >
                      {/* Nomor Urut */}
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {index + 1}
                      </TableCell>

                      {/* Hari & Waktu */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={dayVariant as any}
                              size="sm"
                              className="font-bold text-xs"
                            >
                              {sch.hari}
                            </Badge>
                            {sch.ruang && (
                              <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
                                {sch.ruang}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <Clock className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                            <span>
                              {sch.jamMulai} - {sch.jamSelesai} WIB
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Mata Pelajaran */}
                      <TableCell>
                        <Link
                          href={`/guru/mapel/${sch.mapelId}?kelasId=${sch.kelasId}`}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors block leading-snug group-hover:text-primary"
                        >
                          {sch.mapelNama}
                        </Link>
                      </TableCell>

                      {/* Kelas & Jenjang */}
                      <TableCell>
                        <div className="space-y-1">
                          <span className="text-sm font-semibold text-foreground block">
                            {sch.kelasNama}
                          </span>
                          <div>
                            <Badge
                              variant={sch.jenjang === "SMP" ? "smp" : "amber"}
                              size="sm"
                              className="text-[10px] font-bold"
                            >
                              Jenjang {sch.jenjang}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      {/* Aksi Cepat */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/guru/mapel/${sch.mapelId}?kelasId=${sch.kelasId}`}>
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 px-3 text-xs font-bold gap-1.5 rounded-xl shadow-xs"
                              title="Buka modul materi pertemuan belajar"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>Materi</span>
                            </Button>
                          </Link>

                          <Link
                            href={`/guru/tugas?mapelId=${sch.mapelId}&kelasId=${sch.kelasId}`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs font-semibold rounded-xl border-border/80 hover:border-primary/40 hover:bg-muted/50 gap-1.5"
                              title="Lihat daftar tugas dan penilaian siswa"
                            >
                              <ListTodo className="h-3.5 w-3.5 text-primary" />
                              <span>Tugas</span>
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer info bar */}
        {filteredSchedules.length > 0 && (
          <div className="px-5 py-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Menampilkan <strong>{filteredSchedules.length}</strong> dari total{" "}
              <strong>{schedules.length}</strong> jadwal mengajar
            </span>
            <span className="hidden sm:inline">
              Klik <strong>Materi</strong> untuk membuka silabus pertemuan, atau <strong>Tugas</strong> untuk penugasan siswa
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
