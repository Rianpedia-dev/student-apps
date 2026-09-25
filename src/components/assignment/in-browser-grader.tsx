"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  PenTool,
  Eraser,
  Check,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  Download,
  Sparkles,
  Save,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { gradeTugasAction } from "@/actions/assignment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface SubmissionAttachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size?: number;
}

interface InBrowserGraderProps {
  submission: {
    id: string;
    tugasId: string;
    tugasJudul: string;
    mapelNama: string;
    kelasNama: string;
    deadline: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    attachments?: string | null;
    catatanSiswa?: string | null;
    status: string;
    nilai?: number | null;
    catatanGuru?: string | null;
    annotatedFileUrl?: string | null;
    annotatedData?: string | null;
    submittedAt: string;
    siswa: {
      id: string;
      name: string;
      nis?: string | null;
      image?: string | null;
    };
  };
  prevSubId?: string | null;
  nextSubId?: string | null;
}

export function InBrowserGrader({
  submission,
  prevSubId,
  nextSubId,
}: InBrowserGraderProps) {
  const router = useRouter();

  // Multi-page attachments support
  const attachments: SubmissionAttachment[] = React.useMemo(() => {
    if (submission.attachments) {
      try {
        const parsed = JSON.parse(submission.attachments);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback
      }
    }
    if (submission.fileUrl && submission.fileUrl !== "text_submission") {
      return [
        {
          id: "1",
          url: submission.fileUrl,
          name: submission.fileName || "Lembar Tugas",
          type: submission.fileType || "image",
        },
      ];
    }
    return [];
  }, [submission]);

  const [activePageIndex, setActivePageIndex] = useState(0);

  // Active page file
  const activeFile = attachments[activePageIndex] || {
    url: submission.fileUrl,
    name: submission.fileName,
    type: submission.fileType,
  };

  const isPdf =
    activeFile.type?.toLowerCase() === "pdf" ||
    activeFile.url?.toLowerCase().endsWith(".pdf");

  // Viewer state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Tools: "none" | "pen_red" | "pen_green"
  const [toolMode, setToolMode] = useState<"none" | "pen_red" | "pen_green">("none");

  // Form state
  const [nilai, setNilai] = useState<string>(
    submission.nilai !== null && submission.nilai !== undefined ? String(submission.nilai) : ""
  );
  const [catatanGuru, setCatatanGuru] = useState(submission.catatanGuru || "");
  const [status, setStatus] = useState(submission.status || "sudah_dinilai");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Init canvas for active image
  const initCanvas = () => {
    if (!isPdf && imageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx && img.complete) {
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
      }
    }
  };

  useEffect(() => {
    initCanvas();
  }, [activePageIndex, isPdf]);

  const getPredikat = (scoreStr: string) => {
    const num = parseFloat(scoreStr);
    if (isNaN(num)) return null;
    if (num >= 90) return { label: "Mumtaz! (Istimewa / A)", color: "text-amber-500" };
    if (num >= 80) return { label: "Jayyid Jiddan (Sangat Baik / B)", color: "text-emerald-600" };
    if (num >= 70) return { label: "Jayyid (Baik / C)", color: "text-blue-600" };
    return { label: "Perlu Bimbingan (D)", color: "text-orange-600" };
  };

  // Pen drawing handlers
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;


    // Pen drawing mode
    if (toolMode === "pen_red" || toolMode === "pen_green") {
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = toolMode === "pen_red" ? "#ef4444" : "#10b981";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const handleClearDraw = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      toast.info("Coretan pada lembar ini dibersihkan.");
    }
  };

  const handleSubmitGrade = async (targetStatus: string = "sudah_dinilai", proceedNext: boolean = false) => {
    if (!nilai || isNaN(Number(nilai))) {
      toast.error("Silakan masukkan nilai angka (0 - 100).");
      return;
    }

    const num = Number(nilai);
    if (num < 0 || num > 100) {
      toast.error("Nilai harus berada di rentang 0 hingga 100.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("submission_id", submission.id);
    formData.append("nilai", nilai);
    formData.append("catatan_guru", catatanGuru);
    formData.append("status", targetStatus);

    // Export annotated canvas if drawn
    if (!isPdf && canvasRef.current) {
      try {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        formData.append("annotated_file", dataUrl);
      } catch (e) {
        console.error("Canvas export error:", e);
      }
    }

    try {
      const res = await gradeTugasAction(formData);
      if (res.success) {
        toast.success(res.message);
        setStatus(targetStatus);

        if (proceedNext && nextSubId) {
          router.push(`/guru/tugas/${submission.tugasId}/review/${nextSubId}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.error || "Gagal menyimpan nilai.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background -m-4 sm:-m-6 overflow-hidden">
      {/* TOP HEADER TOOLBAR */}
      <div className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 z-20 gap-2">
        {/* Left: Back & Student Info */}
        <div className="flex items-center gap-3 truncate">
          <Link
            href={`/guru/tugas/${submission.tugasId}`}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-muted shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Daftar Pengumpulan</span>
          </Link>

          <div className="h-4 w-px bg-border shrink-0" />

          <div className="truncate">
            <h2 className="text-xs sm:text-sm font-black text-foreground truncate">
              {submission.siswa.name}
            </h2>
            <p className="text-[11px] text-muted-foreground truncate">
              {submission.tugasJudul} • {submission.kelasNama}
            </p>
          </div>
        </div>

        {/* Center/Right: Speed Grader Fast Navigation */}
        <div className="flex items-center gap-1.5 shrink-0">
          {prevSubId && (
            <Link href={`/guru/tugas/${submission.tugasId}/review/${prevSubId}`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold gap-1 rounded-xl"
                title="Siswa Sebelumnya"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Sebelumnya</span>
              </Button>
            </Link>
          )}

          {nextSubId && (
            <Link href={`/guru/tugas/${submission.tugasId}/review/${nextSubId}`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold gap-1 rounded-xl"
                title="Siswa Berikutnya"
              >
                <span className="hidden md:inline">Berikutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ======================================================== */}
        {/* LEFT PANE: IN-BROWSER WORKSPACE & ANNOTATION CANVAS     */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col bg-muted/20 overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
          {/* Sub Toolbar: Multi-Page Tabs & Annotation Tools */}
          <div className="p-2 sm:px-4 border-b border-border bg-card/80 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Multi-Page Navigation */}
            {attachments.length > 1 ? (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                <span className="text-[11px] font-bold text-muted-foreground mr-1">Lembar:</span>
                {attachments.map((att, idx) => (
                  <button
                    key={att.id || idx}
                    type="button"
                    onClick={() => {
                      setActivePageIndex(idx);
                      setZoom(1);
                      setRotation(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      activePageIndex === idx
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Hal. {idx + 1}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground truncate">
                {activeFile.name || "Lembar Tugas"}
              </span>
            )}

            {/* Drawing & Zoom Tools */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                title="Perkecil"
                className="h-7 w-7 rounded-lg"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                title="Perbesar"
                className="h-7 w-7 rounded-lg"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>

              {!isPdf && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    title="Putar 90°"
                    className="h-7 w-7 rounded-lg"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </Button>

                  <div className="h-4 w-px bg-border mx-0.5" />

                  {/* Red Pen */}
                  <Button
                    type="button"
                    variant={toolMode === "pen_red" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setToolMode(toolMode === "pen_red" ? "none" : "pen_red");
                    }}
                    className={`h-7 px-2 text-xs font-bold rounded-lg gap-1 ${
                      toolMode === "pen_red" ? "bg-red-600 hover:bg-red-700 text-white" : "text-red-600"
                    }`}
                    title="Spidol Merah"
                  >
                    <PenTool className="h-3 w-3" />
                    <span className="hidden sm:inline">Pena Merah</span>
                  </Button>

                  {/* Green Pen */}
                  <Button
                    type="button"
                    variant={toolMode === "pen_green" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setToolMode(toolMode === "pen_green" ? "none" : "pen_green");
                    }}
                    className={`h-7 px-2 text-xs font-bold rounded-lg gap-1 ${
                      toolMode === "pen_green" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-emerald-600"
                    }`}
                    title="Spidol Hijau (Benar)"
                  >
                    <PenTool className="h-3 w-3" />
                    <span className="hidden sm:inline">Pena Hijau</span>
                  </Button>

                  {/* Clear Canvas */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleClearDraw}
                    title="Bersihkan Coretan Halaman Ini"
                    className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-500/10"
                  >
                    <Eraser className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}

              {/* Download original file option for teacher */}
              {activeFile.url && (
                <a
                  href={`/api/download?file=${encodeURIComponent(
                    activeFile.url
                  )}&name=${encodeURIComponent(activeFile.name)}`}
                  download
                  className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted ml-0.5"
                  title="Download lembar asli siswa"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Viewer Area */}
          <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center select-none">
            {isPdf ? (
              <div
                className="w-full h-full bg-card rounded-2xl border border-border shadow-xs overflow-hidden"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
              >
                <iframe
                  src={`${activeFile.url}#toolbar=1&navpanes=0`}
                  title={activeFile.name}
                  className="w-full h-full border-0 min-h-[500px]"
                />
              </div>
            ) : (
              <div
                className="relative transition-transform duration-200 shadow-md rounded-2xl overflow-hidden bg-card border border-border"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={activeFile.url}
                  alt={activeFile.name}
                  className="max-w-[700px] max-h-[750px] object-contain pointer-events-none block"
                  onLoad={initCanvas}
                />
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleDraw}
                  onMouseUp={handleStopDraw}
                  onMouseLeave={handleStopDraw}
                  className={`absolute inset-0 w-full h-full ${
                    toolMode !== "none"
                      ? "cursor-crosshair pointer-events-auto"
                      : "pointer-events-none"
                  }`}
                />
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANE: SPEED GRADING PANEL & FEEDBACK TOOLS        */}
        {/* ======================================================== */}
        <div className="w-full lg:w-[380px] xl:w-[420px] bg-card p-5 overflow-y-auto shrink-0 flex flex-col justify-between border-t lg:border-t-0 shadow-xs z-10 space-y-4">
          <div className="space-y-4">
            {/* Student info card */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    {submission.siswa.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    NIS: {submission.siswa.nis || "-"} • Kelas: {submission.kelasNama}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                    status === "sudah_dinilai"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : status === "perlu_revisi"
                      ? "bg-orange-500/15 text-orange-600"
                      : "bg-sky-500/15 text-sky-600"
                  }`}
                >
                  {status === "sudah_dinilai"
                    ? "Sudah Dinilai ⭐"
                    : status === "perlu_revisi"
                    ? "Perlu Revisi ✏️"
                    : "Menunggu Penilaian ⏳"}
                </span>
              </div>

              {submission.catatanSiswa && (
                <div className="pt-2 border-t border-border/80">
                  <p className="text-[11px] text-muted-foreground font-bold mb-0.5">Pesan Siswa:</p>
                  <p className="text-xs text-foreground italic">&ldquo;{submission.catatanSiswa}&rdquo;</p>
                </div>
              )}
            </div>



            {/* Score Input & Predikat */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Nilai Tugas (0 - 100) *
                </label>
                {getPredikat(nilai) && (
                  <span className={`text-xs font-black ${getPredikat(nilai)!.color}`}>
                    {getPredikat(nilai)!.label}
                  </span>
                )}
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder="Contoh: 95"
                className="w-full text-base font-black rounded-xl border-2 border-input bg-background p-2.5 text-foreground focus:outline-hidden focus:border-primary"
              />
            </div>

            {/* Teacher Notes / Feedback Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Catatan / Evaluasi untuk Siswa:
              </label>
              <textarea
                value={catatanGuru}
                onChange={(e) => setCatatanGuru(e.target.value)}
                rows={3}
                placeholder="Tuliskan apresiasi, ulasan, atau bagian yang perlu diperbaiki..."
                className="w-full text-xs rounded-xl border-2 border-input bg-background p-3 text-foreground focus:outline-hidden focus:border-primary leading-relaxed"
              />
            </div>
          </div>

          {/* ACTION BUTTONS (SPEED GRADER) */}
          <div className="space-y-2 pt-3 border-t border-border">
            {/* Proceed to Next Student Button */}
            {nextSubId ? (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitGrade("sudah_dinilai", true)}
                className="w-full h-11 text-xs sm:text-sm font-black rounded-2xl bg-linear-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700 text-white shadow-md gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Simpan & Lanjut ke Siswa Berikutnya 🚀</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitGrade("sudah_dinilai", false)}
                className="w-full h-11 text-xs sm:text-sm font-black rounded-2xl bg-linear-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700 text-white shadow-md gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Hasil Penilaian ⭐</span>
                  </>
                )}
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleSubmitGrade("perlu_revisi", false)}
                className="flex-1 h-9 text-xs font-bold rounded-xl text-orange-600 border-orange-500/30 hover:bg-orange-500/10"
              >
                Minta Siswa Revisi ✏️
              </Button>

              {nextSubId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitGrade("sudah_dinilai", false)}
                  className="flex-1 h-9 text-xs font-bold rounded-xl"
                >
                  Simpan Saja
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
