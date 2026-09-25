"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StudentSubmissionItem {
  siswaId: string;
  siswaName: string;
  siswaNis: string | null;
  siswaImage: string | null;
  submissionId: string | null;
  submittedAt: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  catatanSiswa: string | null;
  status: "belum_mengumpulkan" | "menunggu_penilaian" | "terlambat" | "sudah_dinilai" | "perlu_revisi" | string;
  nilai: number | null;
  catatanGuru: string | null;
  annotatedFileUrl: string | null;
}

interface TeacherSubmissionsViewProps {
  tugasId: string;
  tugasJudul: string;
  poinMaksimal: number;
  students: StudentSubmissionItem[];
}

export function TeacherSubmissionsView({
  tugasId,
  poinMaksimal,
  students,
}: TeacherSubmissionsViewProps) {
  const [activeTab, setActiveTab] = useState<"semua" | "perlu_koreksi" | "sudah_dinilai" | "belum">("semua");

  const filteredStudents = students.filter((s) => {
    if (activeTab === "perlu_koreksi") {
      return s.status === "menunggu_penilaian" || s.status === "terlambat";
    }
    if (activeTab === "sudah_dinilai") {
      return s.status === "sudah_dinilai";
    }
    if (activeTab === "belum") {
      return s.status === "belum_mengumpulkan";
    }
    return true;
  });

  const waitingCount = students.filter(
    (s) => s.status === "menunggu_penilaian" || s.status === "terlambat"
  ).length;
  const gradedCount = students.filter((s) => s.status === "sudah_dinilai").length;
  const unsubmittedCount = students.filter((s) => s.status === "belum_mengumpulkan").length;

  return (
    <div className="space-y-5">
      {/* Tab Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
        <button
          onClick={() => setActiveTab("semua")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "semua"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Semua Siswa ({students.length})
        </button>

        <button
          onClick={() => setActiveTab("perlu_koreksi")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "perlu_koreksi"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span>Perlu Dikoreksi</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === "perlu_koreksi" ? "bg-white/20" : "bg-amber-500/10 text-amber-600 font-bold"
          }`}>
            {waitingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sudah_dinilai")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "sudah_dinilai"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span>Sudah Dinilai</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === "sudah_dinilai" ? "bg-white/20" : "bg-emerald-500/10 text-emerald-600 font-bold"
          }`}>
            {gradedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("belum")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "belum"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span>Belum Mengumpulkan</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === "belum" ? "bg-white/20" : "bg-muted text-muted-foreground"
          }`}>
            {unsubmittedCount}
          </span>
        </button>
      </div>

      {/* Daftar Siswa */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs">
            Tidak ada siswa di kategori ini.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const hasSubmitted = !!student.submissionId;
            const isGraded = student.status === "sudah_dinilai";
            const isWaiting = student.status === "menunggu_penilaian" || student.status === "terlambat";
            const isRevision = student.status === "perlu_revisi";

            return (
              <div
                key={student.siswaId}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
              >
                {/* Info Siswa */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                    {student.siswaName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      {student.siswaName}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span>NIS: {student.siswaNis || "-"}</span>
                      {hasSubmitted && student.submittedAt && (
                        <>
                          <span>•</span>
                          <span>
                            {new Date(student.submittedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Tombol Aksi Langsung ke Editor */}
                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  {/* Status Pill */}
                  {isGraded ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Nilai: {student.nilai} / {poinMaksimal}
                    </span>
                  ) : isRevision ? (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      Perlu Revisi
                    </span>
                  ) : isWaiting ? (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Perlu Dikoreksi
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Belum Mengumpulkan
                    </span>
                  )}

                  {/* Tombol Langsung Membuka Editor Tanpa Modal */}
                  {hasSubmitted ? (
                    <Link href={`/guru/tugas/${tugasId}/review/${student.submissionId}`}>
                      <Button
                        size="sm"
                        variant={isGraded ? "outline" : "default"}
                        className="text-xs h-8 px-3 rounded-lg font-semibold gap-1.5 shadow-2xs"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{isGraded ? "Ubah Nilai" : "Koreksi Langsung"}</span>
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      Belum Ada File
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
