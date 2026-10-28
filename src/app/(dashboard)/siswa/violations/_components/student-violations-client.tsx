"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  X,
  Eye,
  Info,
  ShieldCheck,
  Tablet,
  BookOpenCheck,
  Shirt,
  HeartHandshake,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  GraduationCap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/utils";
import {
  VIOLATION_CATEGORIES,
  VIOLATION_SEVERITY_CONFIG,
  SCHOOL_RULES_GUIDE,
  type ViolationSeverity,
} from "@/lib/constants/violations";
import { ViolationDetailModal } from "./violation-detail-modal";
import type { ViolationItem } from "@/types";

interface StudentViolationsClientProps {
  violations: ViolationItem[];
}

export function StudentViolationsClient({ violations }: StudentViolationsClientProps) {
  const [activeTab, setActiveTab] = useState<"riwayat" | "panduan" | "sanksi">("riwayat");
  const [searchQuery, setSearchQuery] = useState("");
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
        if (!keteranganMatch && !tindakanMatch && !kategoriMatch) {
          return false;
        }
      }

      // 2. Category Filter
      if (categoryFilter !== "ALL") {
        if ((v.kategori || "").toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Severity Filter
      if (severityFilter !== "ALL") {
        const curSev = v.severity || "RINGAN";
        if (curSev !== severityFilter) {
          return false;
        }
      }

      return true;
    });
  }, [violations, searchQuery, categoryFilter, severityFilter]);

  const isFiltered =
    Boolean(searchQuery.trim()) || categoryFilter !== "ALL" || severityFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("ALL");
    setSeverityFilter("ALL");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tab Navigation: Fully Responsive Segmented Bar */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("riwayat")}
          className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "riwayat"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Riwayat Catatan</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "riwayat"
                ? "bg-white/20 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {violations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("panduan")}
          className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "panduan"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <BookOpenCheck className="h-4 w-4 shrink-0" />
          <span>Buku Pedoman Tata Tertib</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sanksi")}
          className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "sanksi"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Info className="h-4 w-4 shrink-0" />
          <span>Sistem Poin & Sanksi</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: RIWAYAT CATATAN                                         */}
      {/* ============================================================== */}
      {activeTab === "riwayat" && (
        <div className="space-y-4">
          {/* Filter Toolbar (hanya tampil jika pernah ada catatan atau sedang mencari) */}
          {violations.length > 0 && (
            <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari catatan kejadian atau arahan pembinaan..."
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-muted/40 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Category Filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-muted/40 border border-border/60 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-muted/40 border border-border/60 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="ALL">Semua Tingkat</option>
                    <option value="RINGAN">Ringan (5 Pts)</option>
                    <option value="SEDANG">Sedang (15 Pts)</option>
                    <option value="BERAT">Berat (30 Pts)</option>
                  </select>

                  {/* Reset Filters */}
                  {isFiltered && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="text-xs h-9 px-2 text-muted-foreground hover:text-foreground"
                      title="Reset Filter"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Status Hasil Filter */}
              {isFiltered && (
                <div className="text-[11px] sm:text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                  <span>
                    Menampilkan <strong>{filteredViolations.length}</strong> dari{" "}
                    <strong>{violations.length}</strong> catatan kedisiplinan
                  </span>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-primary hover:underline font-semibold"
                  >
                    Reset Filter
                  </button>
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
              {filteredViolations.map((v) => {
                const sev = v.severity || "RINGAN";
                const sevConfig =
                  VIOLATION_SEVERITY_CONFIG[sev] || VIOLATION_SEVERITY_CONFIG.RINGAN;

                return (
                  <Card
                    key={v.id}
                    className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2.5">
                      {/* Baris 1: Kategori & Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground tracking-tight">
                            {v.kategori || "Pelanggaran Umum"}
                          </span>
                          <Badge variant={sevConfig.badgeVariant} size="sm" className="text-[10px] font-semibold">
                            {sevConfig.label}
                          </Badge>
                        </div>
                        {typeof v.points === "number" && v.points > 0 && (
                          <span className="shrink-0 text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                            -{v.points} Poin
                          </span>
                        )}
                      </div>

                      {/* Baris 2: Deskripsi Keterangan Kejadian */}
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                        {v.cleanKeterangan || v.keterangan}
                      </p>

                      {/* Baris 3: Arahan Pembinaan Wali Kelas (jika ada) */}
                      {v.tindakan && (
                        <div className="rounded-xl bg-muted/40 p-2.5 sm:p-3 text-xs border border-border/50 space-y-0.5">
                          <span className="font-semibold text-foreground text-[11px] sm:text-xs block">
                            Arahan Bimbingan Guru / Wali Kelas:
                          </span>
                          <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                            {v.tindakan}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Baris 4: Footer - Tanggal Kejadian & Tombol Rincian */}
                    <div className="pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{formatShortDate(v.created_at)}</span>
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailViolation(v)}
                        className="text-xs h-8 px-2.5 text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Lihat Rincian</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PANDUAN TATA TERTIB & ADAB AL-AZHAR                     */}
      {/* ============================================================== */}
      {activeTab === "panduan" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {SCHOOL_RULES_GUIDE.map((guide, idx) => {
              // Icon & color styling per card
              const getIconMeta = (index: number) => {
                switch (index) {
                  case 0:
                    return {
                      icon: BookOpenCheck,
                      color: "text-teal-600 dark:text-teal-400",
                      bg: "bg-teal-500/10",
                      badge: "Ibadah & Karakter",
                    };
                  case 1:
                    return {
                      icon: Tablet,
                      color: "text-blue-600 dark:text-blue-400",
                      bg: "bg-blue-500/10",
                      badge: "Kedisiplinan Digital",
                    };
                  case 2:
                    return {
                      icon: Shirt,
                      color: "text-purple-600 dark:text-purple-400",
                      bg: "bg-purple-500/10",
                      badge: "Kerapian Seragam",
                    };
                  default:
                    return {
                      icon: HeartHandshake,
                      color: "text-rose-600 dark:text-rose-400",
                      bg: "bg-rose-500/10",
                      badge: "Akhlakul Karimah",
                    };
                }
              };

              const meta = getIconMeta(idx);
              const GuideIcon = meta.icon;

              return (
                <Card
                  key={guide.title}
                  className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg space-y-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}
                    >
                      <GuideIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {meta.badge}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground truncate mt-0.5">
                        {guide.title}
                      </h3>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-1 text-xs sm:text-sm text-foreground/85 leading-relaxed">
                    {guide.rules.map((rule, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <span className="leading-snug">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>

          {/* Bottom Reminder Banner */}
          <Card className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                Kedisiplinan dan adab adalah fondasi kemuliaan ilmu santri Al-Azhar Cairo. Mari bersama menjaga nama baik sekolah dan menggapai ridho Allah SWT.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SISTEM POIN & SANKSI                                    */}
      {/* ============================================================== */}
      {activeTab === "sanksi" && (
        <div className="space-y-4 sm:space-y-6">
          {/* 3 Tingkat Pelanggaran */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {/* 1. Ringan */}
            <Card className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="amber" size="sm" className="text-xs font-semibold">
                  Tingkat Ringan
                </Badge>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  -5 Poin
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Teguran & Pembiasaan Mandiri
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pelanggaran minor yang diselesaikan secara langsung lewat nasihat santun oleh guru atau wali kelas untuk mengingatkan kesadaran santri.
              </p>
              <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground space-y-1">
                <span className="font-semibold block text-foreground">Contoh Kasus:</span>
                <p>• Terlambat sholat berjamaah (masbuk)</p>
                <p>• Tidak membawa sajadah/mukena</p>
                <p>• iPad belum diisi daya saat jam KBM</p>
              </div>
            </Card>

            {/* 2. Sedang */}
            <Card className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="purple" size="sm" className="text-xs font-semibold">
                  Tingkat Sedang
                </Badge>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                  -15 Poin
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Konseling & Tugas Edukatif
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pelanggaran yang memerlukan sesi bimbingan khusus wali kelas dan penyelesaian tugas bernilai karakter edukatif.
              </p>
              <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground space-y-1">
                <span className="font-semibold block text-foreground">Contoh Kasus:</span>
                <p>• Membuka game / medsos saat guru menjelaskan</p>
                <p>• Bertutur kata kurang santun kepada teman</p>
                <p>• Meninggalkan kelas tanpa izin guru</p>
              </div>
            </Card>

            {/* 3. Berat */}
            <Card className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="destructive" size="sm" className="text-xs font-semibold">
                  Tingkat Berat
                </Badge>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                  -30 Poin
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Pendampingan Khusus BK & Wali
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pelanggaran serius yang melibatkan konseling mendalam dengan guru Bimbingan Konseling (BK), wali kelas, serta komunikasi dengan orang tua.
              </p>
              <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground space-y-1">
                <span className="font-semibold block text-foreground">Contoh Kasus:</span>
                <p>• Memotong kode pembatasan iPad (bypass)</p>
                <p>• Tindakan perundungan (bullying)</p>
                <p>• Sengaja meninggalkan sholat fardhu</p>
              </div>
            </Card>
          </div>

          {/* Skema Penilaian Predikat */}
          <Card className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-card/85 dark:bg-card/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg space-y-3">
            <h4 className="text-sm sm:text-base font-bold text-foreground">
              Rentang Predikat Karakter & Kedisiplinan
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                  Mumtaz
                </span>
                <span className="text-base sm:text-lg font-black text-foreground block">
                  90 - 100
                </span>
                <span className="text-[10px] text-muted-foreground block">Sangat Baik</span>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">
                  Jayyid Jiddan
                </span>
                <span className="text-base sm:text-lg font-black text-foreground block">
                  75 - 89
                </span>
                <span className="text-[10px] text-muted-foreground block">Baik</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                  Maqbul
                </span>
                <span className="text-base sm:text-lg font-black text-foreground block">
                  60 - 74
                </span>
                <span className="text-[10px] text-muted-foreground block">Cukup</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                  Pendampingan
                </span>
                <span className="text-base sm:text-lg font-black text-foreground block">
                  &lt; 60
                </span>
                <span className="text-[10px] text-muted-foreground block">Perlu Bimbingan</span>
              </div>
            </div>
          </Card>
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
