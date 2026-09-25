"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  Calendar,
  X,
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
import { UserAvatar } from "@/components/ui/user-avatar";

export interface SubjectItem {
  id: string;
  kodeMapel: string;
  namaMapel: string;
  jenjang?: string;
  icon?: string | null;
  warna?: string | null;
  guruNama?: string | null;
  guruImage?: string | null;
  jadwalHari?: string | null;
  jadwalWaktu?: string | null;
  ruang?: string | null;
  activeTasksCount?: number;
  detailUrl: string;
}

interface SubjectTableProps {
  subjects: SubjectItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function SubjectTable({
  subjects,
  title = "Daftar Mata Pelajaran",
  subtitle,
  className = "",
}: SubjectTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "scheduled" | "tasks">("all");

  const totalTasks = useMemo(() => {
    return subjects.reduce((acc, curr) => acc + (curr.activeTasksCount || 0), 0);
  }, [subjects]);

  const scheduledCount = useMemo(() => {
    return subjects.filter((s) => !!s.jadwalHari).length;
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    let result = subjects;

    // Filter tab
    if (activeFilter === "scheduled") {
      result = result.filter((s) => !!s.jadwalHari);
    } else if (activeFilter === "tasks") {
      result = result.filter((s) => (s.activeTasksCount || 0) > 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.namaMapel.toLowerCase().includes(q) ||
          s.kodeMapel.toLowerCase().includes(q) ||
          (s.guruNama && s.guruNama.toLowerCase().includes(q)) ||
          (s.jadwalHari && s.jadwalHari.toLowerCase().includes(q)) ||
          (s.ruang && s.ruang.toLowerCase().includes(q))
      );
    }

    return result;
  }, [subjects, activeFilter, searchQuery]);

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {title}
            </h2>
            <Badge variant="outline" className="text-[11px] font-semibold">
              {subjects.length} Mapel
            </Badge>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Buttons */}
          <div className="inline-flex rounded-xl bg-muted/60 p-0.5 border border-border/80 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeFilter === "all"
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({subjects.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("scheduled")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeFilter === "scheduled"
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Terjadwal ({scheduledCount})
            </button>
            {totalTasks > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("tasks")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  activeFilter === "tasks"
                    ? "bg-card text-amber-600 dark:text-amber-400 shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-amber-600"
                }`}
              >
                <span>Ada Tugas</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata pelajaran / guru..."
              className="w-full h-8.5 pl-8 pr-7 text-xs rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                title="Hapus pencarian"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-b border-border/80">
              <TableHead className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                No
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[200px]">
                Mata Pelajaran
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[190px]">
                Guru Pengampu
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[190px]">
                Jadwal
              </TableHead>
              <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[140px]">
                Tugas Aktif
              </TableHead>
              <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground pr-6 min-w-[130px]">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Search className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      Mata pelajaran tidak ditemukan
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm">
                      Tidak ada hasil yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;. Silakan coba kata kunci lain.
                    </p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setSearchQuery("");
                          setActiveFilter("all");
                        }}
                        className="mt-2 text-xs"
                      >
                        Reset Filter
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject, idx) => {
                const hasTasks = (subject.activeTasksCount || 0) > 0;

                return (
                  <TableRow
                    key={subject.id}
                    onClick={() => router.push(subject.detailUrl)}
                    className="group cursor-pointer hover:bg-muted/40 transition-colors border-b border-border/60"
                  >
                    {/* 1. No */}
                    <TableCell className="text-center text-xs font-medium text-muted-foreground/80 py-3.5">
                      {idx + 1}
                    </TableCell>

                    {/* 2. Mata Pelajaran */}
                    <TableCell className="py-3.5">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                        {subject.namaMapel}
                      </p>
                    </TableCell>

                    {/* 3. Guru Pengampu */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          src={subject.guruImage}
                          name={subject.guruNama || "Guru Pengampu"}
                          className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
                          previewable={false}
                        />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {subject.guruNama || "Guru Pengampu"}
                        </span>
                      </div>
                    </TableCell>

                    {/* 4. Jadwal */}
                    <TableCell className="py-3.5">
                      {subject.jadwalHari ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-primary">
                            {subject.jadwalHari}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground text-[11px]">
                            {subject.jadwalWaktu || "07:30 - 09:00"}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/75 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50">
                          <Clock className="h-3 w-3 text-muted-foreground/60" />
                          <span>Fleksibel / Belum Terjadwal</span>
                        </div>
                      )}
                    </TableCell>

                    {/* 5. Status Tugas */}
                    <TableCell className="py-3.5 text-center">
                      {hasTasks ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>{subject.activeTasksCount} Tugas Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Materi & PR Lengkap</span>
                        </span>
                      )}
                    </TableCell>

                    {/* 6. Aksi */}
                    <TableCell className="py-3.5 text-right pr-6">
                      <Link
                        href={subject.detailUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all duration-200 group/btn"
                      >
                        <span>Masuk Mapel</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Summary Info */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>Menampilkan {filteredSubjects.length} dari {subjects.length} mata pelajaran</span>
        <span>Klik baris mata pelajaran untuk membuka detail kelas</span>
      </div>
    </div>
  );
}
