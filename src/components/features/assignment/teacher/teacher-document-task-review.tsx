"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Award,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  User,
  Clock,
  Sparkles,
  FileText,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DocumentCanvasEditor } from "../canvas/document-canvas-editor";
import { gradeDocumentTaskAction, requestTaskRevisionAction } from "@/actions/assignment";

export interface TeacherDocumentTaskReviewProps {
  tugasId: string;
  tugasJudul: string;
  mapelNama: string;
  kelasNama: string;
  poinMaksimal: number;
  submission: {
    id: string;
    nilai: number | null;
    status: string;
    catatanGuru: string | null;
    catatanSiswa?: string | null;
    fileUrl: string | null;
    annotatedFileUrl?: string | null;
    annotatedData?: string | null;
    submittedAt: string | null;
    siswa: {
      id: string;
      name: string;
      nis: string | null;
      image: string | null;
      gender?: string | null;
    };
  };
  fileSoalUrl: string;
  prevSubId: string | null;
  nextSubId: string | null;
  fromOrigin?: string;
}

export function TeacherDocumentTaskReview({
  tugasId,
  tugasJudul,
  mapelNama,
  kelasNama,
  poinMaksimal,
  submission,
  fileSoalUrl,
  prevSubId,
  nextSubId,
  fromOrigin,
}: TeacherDocumentTaskReviewProps) {
  const router = useRouter();
  const [nilai, setNilai] = useState<number>(
    typeof submission.nilai === "number" ? submission.nilai : poinMaksimal
  );
  const [catatanGuru, setCatatanGuru] = useState<string>(submission.catatanGuru || "");
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [isRequestingRevision, setIsRequestingRevision] = useState<boolean>(false);

  // Fullscreen Review Workspace state
  const [isReviewFullscreen, setIsReviewFullscreen] = useState<boolean>(false);
  const reviewContainerRef = React.useRef<HTMLDivElement>(null);
  const [isFloatingGradingOpen, setIsFloatingGradingOpen] = useState<boolean>(false);

  const toggleReviewFullscreen = async () => {
    try {
      if (!isReviewFullscreen) {
        if (reviewContainerRef.current?.requestFullscreen && !document.fullscreenElement) {
          await reviewContainerRef.current.requestFullscreen().catch(() => {});
        }
        setIsReviewFullscreen(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
        setIsReviewFullscreen(false);
      }
    } catch {
      setIsReviewFullscreen((prev) => !prev);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isReviewFullscreen) {
        e.preventDefault();
        toggleReviewFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReviewFullscreen]);

  React.useEffect(() => {
    const handleNativeFs = () => {
      const isNative = Boolean(document.fullscreenElement);
      if (!isNative && isReviewFullscreen) {
        setIsReviewFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleNativeFs);
    document.addEventListener("webkitfullscreenchange", handleNativeFs);
    return () => {
      document.removeEventListener("fullscreenchange", handleNativeFs);
      document.removeEventListener("webkitfullscreenchange", handleNativeFs);
    };
  }, [isReviewFullscreen]);

  // Annotation data and rendered canvas data from editor
  const canvasEditorRef = React.useRef<{
    getFlattenedCanvasDataUrl?: () => string;
    getAnnotationDataJson?: () => string;
  }>({});

  const [currentAnnotationData, setCurrentAnnotationData] = useState<string>(
    submission.annotatedData || ""
  );

  const backHref = fromOrigin === "mapel"
    ? `/guru/tugas/${tugasId}?from=mapel`
    : `/guru/tugas/${tugasId}`;

  // Handle Save Grade
  const handleGradeSubmit = async () => {
    setIsGrading(true);
    try {
      const res = await gradeDocumentTaskAction({
        submissionId: submission.id,
        nilai: Number(nilai) || 0,
        catatanGuru: catatanGuru.trim(),
        annotatedData: currentAnnotationData,
      });

      if (res.success) {
        toast.success(res.message);
        if (nextSubId) {
          router.push(`/guru/tugas/${tugasId}/review/${nextSubId}${fromOrigin ? `?from=${fromOrigin}` : ""}`);
        } else {
          router.push(backHref);
        }
      } else {
        toast.error(res.error || "Gagal menyimpan nilai.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat menyimpan nilai.");
    } finally {
      setIsGrading(false);
    }
  };

  // Handle Request Revision
  const handleRevisionSubmit = async () => {
    if (!catatanGuru.trim()) {
      toast.error("Mohon tuliskan instruksi revisi untuk siswa pada kolom catatan.");
      return;
    }

    setIsRequestingRevision(true);
    try {
      const res = await requestTaskRevisionAction({
        submissionId: submission.id,
        catatanRevisi: catatanGuru.trim(),
        annotatedData: currentAnnotationData,
      });

      if (res.success) {
        toast.success(res.message);
        if (nextSubId) {
          router.push(`/guru/tugas/${tugasId}/review/${nextSubId}${fromOrigin ? `?from=${fromOrigin}` : ""}`);
        } else {
          router.push(backHref);
        }
      } else {
        toast.error(res.error || "Gagal mengirim permintaan revisi.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat meminta revisi.");
    } finally {
      setIsRequestingRevision(false);
    }
  };

  // Worksheet URL to display:
  // If student did the assignment via in-app canvas (has annotatedData), load the original worksheet PDF (fileSoalUrl)
  // so the teacher sees the pristine document with student's vector annotations overlaid.
  // Otherwise, if student submitted by uploading a file directly (no annotatedData), annotate their uploaded file.
  const hasInAppAnnotations = Boolean(
    submission.annotatedData && submission.annotatedData.trim().length > 0
  );
  const documentToAnnotate =
    (hasInAppAnnotations ? (fileSoalUrl || submission.fileUrl) : (submission.fileUrl || fileSoalUrl)) || "";

  return (
    <div
      ref={reviewContainerRef}
      className={cn(
        "flex flex-col transition-all duration-200",
        isReviewFullscreen
          ? "fixed inset-0 z-[90] w-screen h-screen bg-background p-3 space-y-3 overflow-hidden"
          : "h-[calc(100vh-4.5rem)] space-y-3 max-w-[1600px] mx-auto"
      )}
    >
      {/* Top Header & Speed-Grader Navigation */}
      <div className="h-12 px-3 sm:px-4 bg-card rounded-2xl border border-border shadow-xs flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 truncate">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 px-2.5 py-1.5 rounded-xl border border-border transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Daftar Pengumpulan</span>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="truncate">
            <span className="text-xs font-bold text-foreground truncate block">
              {tugasJudul}
            </span>
            <span className="text-[10px] text-muted-foreground truncate hidden sm:block">
              {mapelNama} • {kelasNama}
            </span>
          </div>
        </div>

        {/* Speed-Grader Navigation & Fullscreen Review Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Fullscreen Review Workspace Button */}
          <Button
            type="button"
            variant={isReviewFullscreen ? "default" : "outline"}
            size="sm"
            onClick={toggleReviewFullscreen}
            className={cn(
              "h-8 px-2.5 gap-1.5 text-xs font-semibold rounded-xl",
              isReviewFullscreen && "bg-primary text-primary-foreground font-bold shadow-xs"
            )}
            title={isReviewFullscreen ? "Keluar Layar Penuh Koreksi (Esc)" : "Mode Layar Penuh Koreksi (Zen Speed-Grader)"}
          >
            {isReviewFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Keluar Penuh</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Layar Penuh Koreksi</span>
              </>
            )}
          </Button>

          {/* Sibling navigation */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
            {prevSubId ? (
              <Link
                href={`/guru/tugas/${tugasId}/review/${prevSubId}${fromOrigin ? `?from=${fromOrigin}` : ""}`}
                title="Siswa Sebelumnya"
              >
                <Button variant="ghost" size="icon-xs" className="h-7 w-7 rounded-lg">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="icon-xs" disabled className="h-7 w-7 rounded-lg opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            <div className="flex items-center gap-2 px-2">
              <div className="h-5 w-5 rounded-full overflow-hidden border border-border shrink-0 bg-muted">
                <UserAvatar
                  src={submission.siswa.image}
                  gender={submission.siswa.gender}
                  name={submission.siswa.name}
                  alt={submission.siswa.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-foreground max-w-[120px] sm:max-w-[180px] truncate">
                {submission.siswa.name}
              </span>
            </div>

            {nextSubId ? (
              <Link
                href={`/guru/tugas/${tugasId}/review/${nextSubId}${fromOrigin ? `?from=${fromOrigin}` : ""}`}
                title="Siswa Berikutnya"
              >
                <Button variant="ghost" size="icon-xs" className="h-7 w-7 rounded-lg">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="icon-xs" disabled className="h-7 w-7 rounded-lg opacity-40">
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace (Side-by-Side: Canvas Editor on Left, Grading Panel on Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Sisi Kiri: Document Canvas Editor (Teacher Mode) */}
        <div className="lg:col-span-8 xl:col-span-9 h-full min-h-[400px]">
          <DocumentCanvasEditor
            fileUrl={documentToAnnotate}
            fileName={`Lembar Siswa - ${submission.siswa.name}`}
            mode="teacher"
            initialAnnotationData={submission.annotatedData}
            onAnnotationChange={setCurrentAnnotationData}
            onSaveDraft={async ({ annotationData }) => {
              setCurrentAnnotationData(annotationData);
            }}
            onSubmit={async ({ annotationData }) => {
              setCurrentAnnotationData(annotationData);
              await handleGradeSubmit();
            }}
            isSubmitting={isGrading}
            submitButtonText="Simpan Nilai & Koreksi"
            readOnly={false}
            floatingOverlay={
              <div className="absolute top-14 right-4 z-40">
                {!isFloatingGradingOpen ? (
                  <Button
                    type="button"
                    onClick={() => setIsFloatingGradingOpen(true)}
                    className="h-9 px-3 gap-2 rounded-xl bg-card/95 hover:bg-card text-foreground border border-border shadow-xl backdrop-blur-md text-xs font-bold transition-all hover:scale-105"
                  >
                    <Award className="h-4 w-4 text-primary" />
                    <span>Nilai: <strong>{nilai}/{poinMaksimal}</strong></span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                ) : (
                  <Card className="w-80 shadow-2xl border-2 border-primary/30 bg-card/98 backdrop-blur-md animate-in fade-in zoom-in-95 rounded-2xl overflow-hidden">
                    <CardHeader className="p-3 bg-muted/50 border-b border-border flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <span>Koreksi: {submission.siswa.name}</span>
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setIsFloatingGradingOpen(false)}
                        className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="floating-nilai" className="font-bold text-[11px]">
                            Nilai Siswa (0 - {poinMaksimal})
                          </Label>
                          <div className="flex items-center gap-1">
                            {[100, 90, 80, 75].filter((p) => p <= poinMaksimal).map((quickScore) => (
                              <button
                                key={quickScore}
                                type="button"
                                onClick={() => setNilai(quickScore)}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-muted hover:bg-primary/20 text-foreground font-semibold"
                              >
                                {quickScore}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Input
                          id="floating-nilai"
                          type="number"
                          min={0}
                          max={poinMaksimal}
                          value={nilai}
                          onChange={(e) => setNilai(Number(e.target.value) || 0)}
                          className="h-8 font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="floating-catatan" className="font-bold text-[11px]">
                          Catatan Bimbingan Guru
                        </Label>
                        <Textarea
                          id="floating-catatan"
                          rows={2}
                          value={catatanGuru}
                          onChange={(e) => setCatatanGuru(e.target.value)}
                          placeholder="Catatan apresiasi atau revisi..."
                          className="text-xs resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          disabled={isGrading || isRequestingRevision}
                          onClick={handleGradeSubmit}
                          size="sm"
                          className="flex-1 h-8 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                        >
                          {isGrading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Beri Nilai ({nilai})</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isGrading || isRequestingRevision}
                          onClick={handleRevisionSubmit}
                          size="sm"
                          className="h-8 text-[11px] font-bold text-amber-600 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl"
                          title="Minta Siswa Revisi"
                        >
                          Revisi
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            }
          />
        </div>

        {/* Sisi Kanan: Panel Penilaian Guru */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full bg-card rounded-2xl border border-border shadow-md overflow-hidden">
          <div className="p-4 border-b border-border bg-card flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Evaluasi & Nilai Guru
            </h3>
            <Badge
              variant={
                submission.status === "sudah_dinilai"
                  ? "emerald"
                  : submission.status === "perlu_revisi"
                  ? "outline"
                  : "secondary"
              }
              size="sm"
              className="text-[10px]"
            >
              {submission.status === "sudah_dinilai"
                ? "Sudah Dinilai"
                : submission.status === "perlu_revisi"
                ? "Perlu Revisi"
                : "Menunggu Koreksi"}
            </Badge>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
            {/* Student Info Card */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full overflow-hidden border border-border shrink-0 bg-muted">
                  <UserAvatar
                    src={submission.siswa.image}
                    gender={submission.siswa.gender}
                    name={submission.siswa.name}
                    alt={submission.siswa.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{submission.siswa.name}</p>
                  <p className="text-[11px] text-muted-foreground">NIS: {submission.siswa.nis || "-"}</p>
                </div>
              </div>

              {submission.submittedAt && (
                <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>
                    Dikumpulkan:{" "}
                    {new Date(submission.submittedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {submission.catatanSiswa && (
                <div className="p-2 rounded-lg bg-card border border-border text-[11px] text-foreground">
                  <strong>Pesan Siswa:</strong> &ldquo;{submission.catatanSiswa}&rdquo;
                </div>
              )}
            </div>

            {/* Teacher Tips for In-App Grading */}
            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground space-y-1">
              <p className="font-bold text-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Tips Koreksi Digital:
              </p>
              <p>
                Gunakan pena merah untuk melingkari/menggarisbawahi, dan gunakan stempel centang (✓) atau silang (✗) di toolbar kiri lembar pengerjaan.
              </p>
            </div>

            {/* Input Nilai */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="nilai" className="font-bold text-foreground">
                  Nilai Siswa (0 - {poinMaksimal})
                </Label>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Maks: {poinMaksimal} Poin
                </span>
              </div>
              <Input
                id="nilai"
                type="number"
                min={0}
                max={poinMaksimal}
                value={nilai}
                onChange={(e) => setNilai(Number(e.target.value) || 0)}
                className="text-base font-bold text-foreground h-11"
              />
            </div>

            {/* Input Catatan Guru */}
            <div className="space-y-1.5">
              <Label htmlFor="catatanGuru" className="font-bold text-foreground">
                Catatan Bimbingan / Revisi Guru
              </Label>
              <Textarea
                id="catatanGuru"
                rows={4}
                value={catatanGuru}
                onChange={(e) => setCatatanGuru(e.target.value)}
                placeholder="Tuliskan catatan apresiasi atau poin perbaikan untuk siswa..."
                className="text-xs"
              />
            </div>
          </div>

          {/* Action Buttons (Beri Nilai vs Minta Siswa Revisi) */}
          <div className="p-4 border-t border-border bg-card/90 space-y-2 shrink-0">
            {/* Tombol Beri Nilai */}
            <Button
              type="button"
              disabled={isGrading || isRequestingRevision}
              onClick={handleGradeSubmit}
              className="w-full h-10 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              {isGrading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan Nilai...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan & Beri Nilai ({nilai} Poin)</span>
                </>
              )}
            </Button>

            {/* Tombol Minta Revisi */}
            <Button
              type="button"
              variant="outline"
              disabled={isGrading || isRequestingRevision}
              onClick={handleRevisionSubmit}
              className="w-full h-9 text-xs font-bold gap-2 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl"
            >
              {isRequestingRevision ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Mengirim Revisi...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span>Minta Siswa Revisi Tugas</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
