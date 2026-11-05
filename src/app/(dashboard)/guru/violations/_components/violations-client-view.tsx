"use client";

import React, { useState, useMemo } from "react";
import { ShieldCheck, SearchX, Eye, Pencil, Trash2, Calendar, ShieldAlert, Award, UserCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <Card className="rounded-3xl card-elevation overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30 backdrop-blur-xs border-b border-border/60">
                <TableRow>
                  <TableHead className="w-12 text-center font-bold">No</TableHead>
                  <TableHead className="font-bold">Siswa</TableHead>
                  <TableHead className="font-bold">Tanggal</TableHead>
                  <TableHead className="font-bold">Semester</TableHead>
                  <TableHead className="font-bold">Kategori & Tingkat</TableHead>
                  <TableHead className="font-bold">Deskripsi</TableHead>
                  <TableHead className="font-bold">Dicatat Oleh</TableHead>
                  <TableHead className="w-24 text-center font-bold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredViolations.map((v, idx) => {
                  const severity = (v.tingkatan || v.severity || "RINGAN").toUpperCase() as "RINGAN" | "SEDANG" | "BERAT";
                  const severityConfig =
                    VIOLATION_SEVERITY_CONFIG[severity] ||
                    VIOLATION_SEVERITY_CONFIG.RINGAN;

                  return (
                    <TableRow key={v.id} className="hover:bg-muted/30">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            src={v.studentImage}
                            gender={v.studentGender}
                            name={v.nama || "Siswa"}
                            className="h-8 w-8"
                          />
                          <div>
                            <p className="font-semibold text-xs text-foreground">{v.nama}</p>
                            <p className="text-[11px] text-muted-foreground">{v.kelas}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateIndo(v.created_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {v.semester ? (
                          <Badge variant="outline" size="sm" className="text-[10px] bg-muted/40 font-normal">
                            {v.semester}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="outline" size="sm" className="text-[11px] bg-muted/40">
                            {v.kategori}
                          </Badge>
                          <Badge
                            variant={severityConfig.badgeVariant}
                            size="sm"
                            className="text-[10px]"
                          >
                            {severityConfig.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">
                        {v.cleanKeterangan || v.keterangan}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {v.guru_nama ? (
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-medium text-foreground">{v.guru_nama}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => setDetailViolation(v)}
                            title="Detail"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {canManageViolation(v) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={() => setEditViolation(v)}
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                onClick={() => setDeleteViolation(v)}
                                title="Hapus"
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
