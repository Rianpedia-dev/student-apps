"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  X,
  Eye,
  RotateCcw,
  UserCheck,
  BookOpenCheck,
  Tablet,
  Shirt,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/utils";
import { VIOLATION_CATEGORIES } from "@/lib/constants/violations";
import { ViolationDetailModal } from "./violation-detail-modal";
import type { ViolationItem } from "@/types";

interface StudentViolationsClientProps {
  violations: ViolationItem[];
  availableSemesters?: string[];
  availableClasses?: string[];
}

export function StudentViolationsClient({
  violations,
  availableSemesters = [],
  availableClasses = [],
}: StudentViolationsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [detailViolation, setDetailViolation] = useState<ViolationItem | null>(null);

  // Filter violations
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const keteranganMatch = (v.cleanKeterangan || v.keterangan || "").toLowerCase().includes(q);
        const tindakanMatch = (v.tindakan || "").toLowerCase().includes(q);
        const kategoriMatch = (v.kategori || "").toLowerCase().includes(q);
        const guruMatch = (v.guru_nama || "").toLowerCase().includes(q);
        if (!keteranganMatch && !tindakanMatch && !kategoriMatch && !guruMatch) {
          return false;
        }
      }

      // 2. Class Filter (Histori di kelas berapa)
      if (classFilter !== "ALL") {
        if ((v.kelas || "").trim().toLowerCase() !== classFilter.trim().toLowerCase()) {
          return false;
        }
      }

      // 3. Semester Filter (Histori di semester berapa)
      if (semesterFilter !== "ALL") {
        if ((v.semester || "").trim().toLowerCase() !== semesterFilter.trim().toLowerCase()) {
          return false;
        }
      }

      // 4. Category Filter
      if (categoryFilter !== "ALL") {
        if ((v.kategori || "").toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
      }

      // 5. Severity Filter
      if (severityFilter !== "ALL") {
        const curSev = (v.tingkatan || v.severity || "RINGAN").toUpperCase();
        if (curSev !== severityFilter.toUpperCase()) {
          return false;
        }
      }

      return true;
    });
  }, [violations, searchQuery, classFilter, semesterFilter, categoryFilter, severityFilter]);

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    classFilter !== "ALL" ||
    semesterFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    severityFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setClassFilter("ALL");
    setSemesterFilter("ALL");
    setCategoryFilter("ALL");
    setSeverityFilter("ALL");
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar (hanya tampil jika pernah ada catatan atau sedang mencari) */}
      {violations.length > 0 && (
        <div className="space-y-2.5 bg-transparent">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan pelanggaran..."
                className="w-full pl-9 pr-8 h-9 text-xs sm:text-sm rounded-xl bg-background/50 dark:bg-muted/20 border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all text-foreground placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Class Filter (Filter Kelas berapa) */}
              {availableClasses.length > 0 && (
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  aria-label="Filter Berdasarkan Kelas"
                  className="h-9 px-3 text-xs font-medium rounded-xl bg-background/50 dark:bg-muted/20 border border-border/70 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="ALL">Semua Kelas</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              )}

              {/* Semester Filter (Filter Semester berapa) */}
              {availableSemesters.length > 0 && (
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  aria-label="Filter Berdasarkan Semester"
                  className="h-9 px-3 text-xs font-medium rounded-xl bg-background/50 dark:bg-muted/20 border border-border/70 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="ALL">Semua Semester</option>
                  {availableSemesters.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              )}

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter Berdasarkan Kategori"
                className="h-9 px-3 text-xs font-medium rounded-xl bg-background/50 dark:bg-muted/20 border border-border/70 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              >
                <option value="ALL">Semua Kategori</option>
                {VIOLATION_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                aria-label="Filter Berdasarkan Tingkat"
                className="h-9 px-3 text-xs font-medium rounded-xl bg-background/50 dark:bg-muted/20 border border-border/70 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              >
                <option value="ALL">Semua Tingkat</option>
                <option value="RINGAN">Ringan</option>
                <option value="SEDANG">Sedang</option>
              </select>

              {/* Reset Filter Button */}
              {isFiltered && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-xl bg-background/50 cursor-pointer"
                  title="Reset Filter"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              )}
            </div>
          </div>

          {/* Status Hasil Filter */}
          {isFiltered && (
            <div className="text-[11px] sm:text-xs text-muted-foreground flex items-center justify-between px-1">
              <span>
                Menampilkan <strong className="text-foreground">{filteredViolations.length}</strong> dari{" "}
                <strong className="text-foreground">{violations.length}</strong> catatan kedisiplinan
              </span>
            </div>
          )}
        </div>
      )}

          {/* Kondisi 1: Tidak ada riwayat catatan sama sekali (Clean Record) */}
          {violations.length === 0 ? (
            <div className="space-y-4">
              <Card className="rounded-2xl sm:rounded-3xl border border-white/60 dark:border-white/10 bg-card/85 dark:bg-card/45 backdrop-blur-xl p-6 sm:p-10 text-center space-y-4 shadow-xl">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-500/20">
                  <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    Alhamdulillah, Rekam Jejak Bersih!
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Tidak ada catatan pelanggaran tata tertib atas nama Anda. Pertahankan kedisiplinan beribadah,
                    etika iPad edukasi, serta adab santun terhadap guru dan sesama teman.
                  </p>
                </div>
              </Card>

              {/* 3 Quick Guidance Cards on Discipline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Card className="rounded-2xl p-4 bg-muted/30 border border-border/50 space-y-2 hover:border-emerald-500/30 transition-all">
                  <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <BookOpenCheck className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    Ibadah & Sholat Berjamaah
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    Hadir tepat waktu untuk sholat Dhuha dan Dzuhur berjamaah di masjid dengan mukena/peci bersih.
                  </p>
                </Card>

                <Card className="rounded-2xl p-4 bg-muted/30 border border-border/50 space-y-2 hover:border-blue-500/30 transition-all">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Tablet className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    Kedisiplinan iPad Edukasi
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    Pastikan baterai terisi penuh dari rumah dan gunakan hanya untuk materi pelajaran selama KBM.
                  </p>
                </Card>

                <Card className="rounded-2xl p-4 bg-muted/30 border border-border/50 space-y-2 hover:border-purple-500/30 transition-all">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Shirt className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    Kerapian Atribut & Seragam
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    Mengenakan seragam harian resmi sesuai jadwal dengan atribut upacara lengkap dan rapi.
                  </p>
                </Card>
              </div>
            </div>
          ) : filteredViolations.length === 0 ? (
            /* Kondisi 2: Hasil filter kosong */
            <Card className="rounded-2xl sm:rounded-3xl border border-dashed border-border/60 p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                <Search className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-semibold text-foreground">
                  Tidak Ada Catatan yang Sesuai
                </h4>
                <p className="text-xs text-muted-foreground">
                  Tidak ditemukan catatan kedisiplinan yang cocok dengan kriteria pencarian atau filter yang dipilih.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                Reset Filter
              </Button>
            </Card>
          ) : (
            /* Kondisi 3: Ada catatan pelanggaran (Tampilan Grid Card Responsif) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredViolations.map((v) => (
                <Card
                  key={v.id}
                  className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Isi Pelanggaran */}
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                      {v.cleanKeterangan || v.keterangan}
                    </p>

                    {/* Dicatat Oleh */}
                    {v.guru_nama && (
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-xl border border-border/30">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">
                          Dicatat oleh: <strong className="font-medium text-foreground">{v.guru_nama}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer: Tanggal Terjadi & Tombol Lihat Detail */}
                  <div className="pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
                    <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatShortDate(v.created_at)}</span>
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailViolation(v)}
                      className="text-xs h-8 px-2.5 text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Lihat Detail</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

      {/* Modal Dialog Detail Pelanggaran */}
      <ViolationDetailModal
        violation={detailViolation}
        open={Boolean(detailViolation)}
        onOpenChange={(open) => !open && setDetailViolation(null)}
      />
    </div>
  );
}
