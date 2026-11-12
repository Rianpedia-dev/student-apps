"use client";

import React, { useState, useMemo } from "react";
import { ShieldCheck, SearchX, Eye, Pencil, Trash2, Calendar, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDateIndo } from "@/lib/utils";
import { VIOLATION_SEVERITY_CONFIG } from "@/lib/constants/violations";
import { ViolationToolbar, type ClassScope, type ViewMode } from "./violation-toolbar";
import { ViolationCard } from "./violation-card";
import { ViolationDetailModal } from "./violation-detail-modal";
import { EditViolationModal } from "./edit-violation-modal";
import { DeleteViolationDialog } from "./delete-violation-dialog";
import type { StudentOption } from "./add-violation-modal";
import type { ViolationItem } from "@/types";

interface ViolationsClientViewProps {
  initialViolations: ViolationItem[];
  students: StudentOption[];
  guruClass: string;
  isWaliKelas?: boolean;
  availableSemesters?: string[];
  availableClasses?: string[];
  currentUserId?: string;
  currentUserName?: string;
  userRole?: string;
}

export function ViolationsClientView({
  initialViolations,
  students,
  guruClass,
  isWaliKelas = false,
  availableSemesters = [],
  availableClasses = [],
  currentUserId,
  currentUserName,
  userRole,
}: ViolationsClientViewProps) {
  // Pengecekan otorisasi: hanya guru pembuat catatan atau admin yang boleh mengedit & menghapus
  const canManageViolation = (v: ViolationItem) => {
    if (userRole === "admin") return true;
    if (currentUserId && v.guru_id && String(v.guru_id) === String(currentUserId)) {
      return true;
    }
    if (currentUserName && v.guru_nama) {
      if (v.guru_nama.trim().toLowerCase() === currentUserName.trim().toLowerCase()) {
        return true;
      }
    }
    return false;
  };
  // Filter States
  const [classScope, setClassScope] = useState<ClassScope>(guruClass ? "MY_CLASS" : "ALL_CLASSES");
  const [classFilter, setClassFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Dialog States
  const [detailViolation, setDetailViolation] = useState<ViolationItem | null>(null);
  const [editViolation, setEditViolation] = useState<ViolationItem | null>(null);
  const [deleteViolation, setDeleteViolation] = useState<ViolationItem | null>(null);

  // Compute Filtered & Sorted Violations
  const filteredViolations = useMemo(() => {
    return initialViolations
      .filter((v) => {
        // 1. Class Scope Filter (Khusus Wali Kelas)
        if (classScope === "MY_CLASS" && guruClass) {
          const vClass = (v.kelas || "").trim().toLowerCase();
          const myClass = guruClass.trim().toLowerCase();
          if (!vClass.includes(myClass) && !myClass.includes(vClass)) {
            return false;
          }
        }

        // 2. Specific Class Filter (jika memilih Semua Kelas)
        if (classScope === "ALL_CLASSES" && classFilter !== "ALL") {
          if ((v.kelas || "").trim().toLowerCase() !== classFilter.trim().toLowerCase()) {
            return false;
          }
        }

        // 3. Semester Filter
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

        // 5. Severity / Tingkatan Filter
        if (severityFilter !== "ALL") {
          const currentSeverity = (v.tingkatan || v.severity || "RINGAN").toUpperCase();
          if (currentSeverity !== severityFilter.toUpperCase()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        try {
          return Number(BigInt(b.id) - BigInt(a.id));
        } catch {
          return 0;
        }
      });
  }, [
    initialViolations,
    classScope,
    guruClass,
    classFilter,
    semesterFilter,
    categoryFilter,
    severityFilter,
  ]);

  return (
    <div className="space-y-6">
      {/* Toolbar & Filter Controls */}
      <ViolationToolbar
        classScope={classScope}
        onClassScopeChange={setClassScope}
        classFilter={classFilter}
        onClassFilterChange={setClassFilter}
        availableClasses={availableClasses}
        semesterFilter={semesterFilter}
        onSemesterFilterChange={setSemesterFilter}
        availableSemesters={availableSemesters}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        severityFilter={severityFilter}
        onSeverityFilterChange={setSeverityFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        guruClass={guruClass}
      />

      {/* Main Content: Cards View or Table View */}
      {filteredViolations.length === 0 ? (
        <Card className="border-dashed rounded-3xl glass-card">
          <CardContent className="p-12 text-center text-muted-foreground space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              {categoryFilter !== "ALL" || severityFilter !== "ALL" || semesterFilter !== "ALL" || classFilter !== "ALL" ? (
                <SearchX className="h-7 w-7" />
              ) : (
                <ShieldCheck className="h-7 w-7" />
              )}
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-foreground">
                {categoryFilter !== "ALL" || severityFilter !== "ALL" || semesterFilter !== "ALL" || classFilter !== "ALL"
                  ? "Tidak Ada Catatan yang Cocok"
                  : "Alhamdulillah, Belum Ada Catatan Pelanggaran"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {categoryFilter !== "ALL" || severityFilter !== "ALL" || semesterFilter !== "ALL" || classFilter !== "ALL"
                  ? "Coba sesuaikan opsi filter untuk menampilkan data catatan."
                  : "Seluruh siswa menjaga ketertiban, adab, dan tata tertib sekolah dengan sangat baik."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredViolations.map((v) => (
            <ViolationCard
              key={v.id}
              violation={v}
              onViewDetail={setDetailViolation}
              onEdit={setEditViolation}
              onDelete={setDeleteViolation}
              canEditDelete={canManageViolation(v)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="rounded-3xl card-elevation overflow-hidden shadow-xl border border-border/60">
          {/* Petunjuk Scroll di Mobile & Tablet Portrait */}
          <div className="lg:hidden px-4 py-2 bg-muted/40 border-b border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>← Geser tabel ke samping →</span>
            <span className="font-semibold text-foreground">{filteredViolations.length} Catatan</span>
          </div>

          <Table>
            <TableHeader className="bg-muted/35 backdrop-blur-xs">
              <TableRow className="border-b border-border/70 hover:bg-transparent">
                <TableHead className="w-11 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pl-4">
                  No
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 w-[205px]">
                  Siswa
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 whitespace-nowrap">
                  Waktu &amp; Semester
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">
                  Kategori &amp; Tingkat
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 min-w-[180px]">
                  Deskripsi
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">
                  Dicatat Oleh
                </TableHead>
                <TableHead className="w-[104px] text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pr-4">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredViolations.map((v, idx) => {
                const severity = (v.tingkatan || v.severity || "RINGAN").toUpperCase() as "RINGAN" | "SEDANG" | "BERAT";
                const severityConfig =
                  VIOLATION_SEVERITY_CONFIG[severity] ||
                  VIOLATION_SEVERITY_CONFIG.RINGAN;

                const severityPillClass =
                  severity === "BERAT"
                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                    : severity === "SEDANG"
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";

                const severityDotClass =
                  severity === "BERAT"
                    ? "bg-rose-500"
                    : severity === "SEDANG"
                    ? "bg-purple-500"
                    : "bg-amber-500";

                const descriptionText = v.cleanKeterangan || v.keterangan || "-";

                return (
                  <TableRow
                    key={v.id}
                    className="group hover:bg-muted/35 transition-colors border-b border-border/50 last:border-b-0"
                  >
                    <TableCell className="text-center font-medium text-xs text-muted-foreground py-3.5 pl-4 align-middle">
                      {idx + 1}
                    </TableCell>

                    {/* Siswa */}
                    <TableCell className="py-3.5 align-middle">
                      <div className="flex items-center gap-2.5 w-[185px] sm:w-[195px] min-w-0 overflow-hidden">
                        <UserAvatar
                          src={v.studentImage}
                          gender={v.studentGender}
                          name={v.nama || "Siswa"}
                          className="h-9 w-9 rounded-full object-cover shrink-0 border border-border/60"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-semibold text-xs text-foreground truncate leading-snug"
                            title={v.nama || undefined}
                          >
                            {v.nama || "Tanpa Nama"}
                          </p>
                          <p
                            className="text-[11px] text-muted-foreground truncate mt-0.5"
                            title={v.kelas || undefined}
                          >
                            {v.kelas || "-"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Waktu & Semester */}
                    <TableCell className="py-3.5 align-middle">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/75 shrink-0" />
                          <span>{formatDateIndo(v.created_at)}</span>
                        </div>
                        {v.semester && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium text-muted-foreground border border-border/50">
                            {v.semester}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Kategori & Tingkat */}
                    <TableCell className="py-3.5 align-middle">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span
                          className="inline-flex items-center max-w-[175px] truncate px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium text-foreground border border-border/60"
                          title={v.kategori || undefined}
                        >
                          {v.kategori || "Pelanggaran Umum"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${severityPillClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${severityDotClass}`} />
                          <span>{severityConfig.label}</span>
                        </span>
                      </div>
                    </TableCell>

                    {/* Deskripsi */}
                    <TableCell className="py-3.5 align-middle max-w-[260px]">
                      <p
                        className="text-xs text-foreground/85 whitespace-normal line-clamp-2 leading-relaxed"
                        title={descriptionText}
                      >
                        {descriptionText}
                      </p>
                    </TableCell>

                    {/* Dicatat Oleh */}
                    <TableCell className="py-3.5 align-middle">
                      {v.guru_nama ? (
                        <div className="inline-flex items-center gap-1.5 max-w-[145px] text-xs">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span
                            className="font-medium text-foreground truncate"
                            title={v.guru_nama}
                          >
                            {v.guru_nama}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="py-3.5 pr-4 align-middle text-center">
                      <div className="inline-flex items-center justify-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-7 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                          onClick={() => setDetailViolation(v)}
                          title="Lihat Detail"
                          aria-label="Lihat Detail"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {canManageViolation(v) && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 rounded-lg text-muted-foreground hover:text-sky-600 hover:bg-sky-500/10 cursor-pointer"
                              onClick={() => setEditViolation(v)}
                              title="Edit Catatan"
                              aria-label="Edit Catatan"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                              onClick={() => setDeleteViolation(v)}
                              title="Hapus Catatan"
                              aria-label="Hapus Catatan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Footer Ringkasan */}
          <div className="px-4 py-2.5 bg-muted/25 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>
              Menampilkan <strong className="text-foreground">{filteredViolations.length}</strong> dari{" "}
              {initialViolations.length} catatan kedisiplinan
            </span>
            <span className="hidden sm:inline text-[10px] bg-muted/60 px-2 py-0.5 rounded-md">
              Mode: Tabel
            </span>
          </div>
        </Card>
      )}

      {/* Modals & Dialogs */}
      <ViolationDetailModal
        violation={detailViolation}
        open={!!detailViolation}
        onOpenChange={(open) => !open && setDetailViolation(null)}
      />

      <EditViolationModal
        violation={editViolation}
        open={!!editViolation}
        onOpenChange={(open) => !open && setEditViolation(null)}
      />

      <DeleteViolationDialog
        violation={deleteViolation}
        open={!!deleteViolation}
        onOpenChange={(open) => !open && setDeleteViolation(null)}
      />
    </div>
  );
}
