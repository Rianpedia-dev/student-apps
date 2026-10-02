"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getStatusConfig } from "@/lib/task-status";

export interface StudentSubmissionItem {
  siswaId: string;
  siswaName: string;
  siswaNis: string | null;
  siswaImage: string | null;
  siswaGender?: string | null;
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
  fromOrigin?: string;
}

export function TeacherSubmissionsView({
  tugasId,
  poinMaksimal,
  students,
  fromOrigin,
}: TeacherSubmissionsViewProps) {
  const waitingCount = students.filter(
    (s) => s.status === "menunggu_penilaian" || s.status === "terlambat" || s.status === "perlu_revisi"
  ).length;
  const gradedCount = students.filter((s) => s.status === "sudah_dinilai").length;
  const unsubmittedCount = students.filter((s) => s.status === "belum_mengumpulkan").length;

  const filterStudents = (tab: string) => {
    return students.filter((s) => {
      if (tab === "perlu_koreksi") return s.status === "menunggu_penilaian" || s.status === "terlambat" || s.status === "perlu_revisi";
      if (tab === "sudah_dinilai") return s.status === "sudah_dinilai";
      if (tab === "belum") return s.status === "belum_mengumpulkan";
      return true;
    });
  };

  const renderStudentList = (tab: string) => {
    const filtered = filterStudents(tab);

    if (filtered.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-xs">
            Tidak ada siswa di kategori ini.
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {/* Desktop: Table */}
        <div className="hidden sm:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nama Siswa</TableHead>
                  <TableHead className="text-xs">NIS</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Nilai</TableHead>
                  <TableHead className="text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => {
                  const config = getStatusConfig(student.status);
                  const hasSubmitted = !!student.submissionId;
                  const isGraded = student.status === "sudah_dinilai";

                  return (
                    <TableRow key={student.siswaId}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full overflow-hidden border border-border shrink-0 bg-muted/40">
                            <UserAvatar
                              src={student.siswaImage}
                              gender={student.siswaGender}
                              name={student.siswaName}
                              alt={student.siswaName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span className="text-xs font-semibold text-foreground">{student.siswaName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{student.siswaNis || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant} size="sm">{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">
                        {isGraded ? `${student.nilai}/${poinMaksimal}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasSubmitted ? (
                          <Link href={`/guru/tugas/${tugasId}/review/${student.submissionId}${fromOrigin ? `?from=${fromOrigin}` : ""}`}>
                            <Button variant={isGraded ? "outline" : "default"} size="sm" className="text-xs h-7 gap-1.5">
                              <Edit3 className="h-3 w-3" />
                              {isGraded ? "Ubah" : "Koreksi"}
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mobile: Card List */}
        <div className="sm:hidden space-y-2">
          {filtered.map((student) => {
            const config = getStatusConfig(student.status);
            const hasSubmitted = !!student.submissionId;
            const isGraded = student.status === "sudah_dinilai";

            return (
              <Card key={student.siswaId}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-full overflow-hidden border border-border shrink-0 bg-muted/40">
                      <UserAvatar
                        src={student.siswaImage}
                        gender={student.siswaGender}
                        name={student.siswaName}
                        alt={student.siswaName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{student.siswaName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant={config.variant} size="sm">{config.label}</Badge>
                        {isGraded && (
                          <span className="text-[11px] text-muted-foreground font-medium">{student.nilai}/{poinMaksimal}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {hasSubmitted && (
                    <Link href={`/guru/tugas/${tugasId}/review/${student.submissionId}${fromOrigin ? `?from=${fromOrigin}` : ""}`}>
                      <Button variant={isGraded ? "outline" : "default"} size="sm" className="text-xs h-8 shrink-0">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="semua">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="semua">Semua ({students.length})</TabsTrigger>
          <TabsTrigger value="perlu_koreksi">Dikoreksi ({waitingCount})</TabsTrigger>
          <TabsTrigger value="sudah_dinilai">Dinilai ({gradedCount})</TabsTrigger>
          <TabsTrigger value="belum">Belum ({unsubmittedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="semua">{renderStudentList("semua")}</TabsContent>
        <TabsContent value="perlu_koreksi">{renderStudentList("perlu_koreksi")}</TabsContent>
        <TabsContent value="sudah_dinilai">{renderStudentList("sudah_dinilai")}</TabsContent>
        <TabsContent value="belum">{renderStudentList("belum")}</TabsContent>
      </Tabs>
    </div>
  );
}
