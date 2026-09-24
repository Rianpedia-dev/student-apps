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
  Save, 
  ArrowLeft, 
  FileText, 
  Image as ImageIcon,
  Clock,
  User as UserIcon,
  Award,
  Sparkles,
  Loader2,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { gradeTugasAction } from "@/actions/assignment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    catatanSiswa?: string | null;
    status: string;
    nilai?: number | null;
    catatanGuru?: string | null;
    submittedAt: string;
    siswa: {
      id: string;
      name: string;
      nis?: string | null;
      image?: string | null;
    };
  };
}

export function InBrowserGrader({ submission }: InBrowserGraderProps) {
  const router = useRouter();

  // Viewer state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [penColor, setPenColor] = useState("#ef4444"); // Red by default

  // Grading form state
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

  const isPdf = submission.fileType.toLowerCase() === "pdf" || submission.fileUrl.toLowerCase().endsWith(".pdf");

  // Init canvas for image marking
  useEffect(() => {
    if (!isPdf && imageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx && img.complete) {
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
      }
    }
  }, [isPdf]);

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
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
    }
  };

  const handleQuickScore = (score: number) => {
    setNilai(String(score));
  };

  const handleSubmitGrade = async (targetStatus: string = "sudah_dinilai") => {
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

    // Save annotated canvas if drawn
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
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyimpan nilai.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-background -m-4 sm:-m-6 overflow-hidden">
      {/* Top Header Toolbar */}
      <div className="h-14 border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href={`/guru/tugas/${submission.tugasId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Rekap</span>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div>
            <h2 className="text-sm font-bold text-foreground leading-tight truncate max-w-xs sm:max-w-md">
              {submission.tugasJudul}
            </h2>
            <p className="text-xs text-muted-foreground">
              {submission.mapelNama} • {submission.kelasNama}
            </p>
          </div>
        </div>

        {/* Viewer Tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            title="Perkecil (-)"
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono font-medium text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            title="Perbesar (+)"
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {!isPdf && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Putar 90 Derajat"
                className="h-8 w-8 p-0"
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant={isDrawingMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                title={isDrawingMode ? "Matikan Spidol Coretan" : "Aktifkan Spidol Coretan Koreksi"}
                className="h-8 px-2.5 text-xs gap-1.5"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{isDrawingMode ? "Spidol Aktif" : "Coret/Tandai"}</span>
              </Button>

              {isDrawingMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDraw}
                  title="Hapus Semua Coretan"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              )}
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setZoom(1); setRotation(0); }}
            title="Reset Tampilan"
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANE: ZERO-DOWNLOAD IN-BROWSER DOCUMENT VIEWER */}
        <div className="flex-1 bg-muted/40 relative overflow-auto p-4 flex items-center justify-center select-none border-b lg:border-b-0 lg:border-r border-border">
          {isPdf ? (
            /* PDF INLINE VIEWER (Zero download) */
            <div
              className="w-full h-full bg-card rounded-xl border border-border shadow-lg overflow-hidden transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            >
              <iframe
                src={`${submission.fileUrl}#toolbar=0&navpanes=0`}
                title={submission.fileName}
                className="w-full h-full border-0 min-h-[550px]"
              />
            </div>
          ) : (
            /* IMAGE VIEWER WITH OPTIONAL CANVAS DRAWING OVERLAY */
            <div
              className="relative transition-transform duration-200 shadow-xl rounded-xl overflow-hidden bg-card border border-border"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={submission.fileUrl}
                alt={submission.fileName}
                className="max-w-[700px] max-h-[750px] object-contain pointer-events-none block"
                onLoad={() => {
                  if (canvasRef.current && imageRef.current) {
                    canvasRef.current.width = imageRef.current.naturalWidth || imageRef.current.width;
                    canvasRef.current.height = imageRef.current.naturalHeight || imageRef.current.height;
                  }
                }}
              />
              {/* Annotation Canvas Overlay */}
              <canvas
                ref={canvasRef}
                onMouseDown={handleStartDraw}
                onMouseMove={handleDraw}
                onMouseUp={handleStopDraw}
                onMouseLeave={handleStopDraw}
                className={`absolute inset-0 w-full h-full ${
                  isDrawingMode ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
                }`}
              />
            </div>
          )}
        </div>

        {/* RIGHT PANE: GRADING & EVALUATION FORM */}
        <div className="w-full lg:w-[380px] xl:w-[420px] bg-card p-5 overflow-y-auto shrink-0 flex flex-col justify-between border-t lg:border-t-0 shadow-lg z-10">
          <div className="space-y-5">
            {/* Student Profile & Meta */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-1 ring-primary/20">
                  {submission.siswa.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">
                    {submission.siswa.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    NIS: {submission.siswa.nis || "-"} • {submission.kelasNama}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(submission.submittedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  status === "sudah_dinilai"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : status === "terlambat"
                    ? "bg-red-500/10 text-red-600 border border-red-500/20"
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                }`}>
                  {status === "sudah_dinilai" ? "Sudah Dinilai" : status === "terlambat" ? "Terlambat" : "Menunggu Dinilai"}
                </span>
              </div>

              {submission.catatanSiswa && (
                <div className="p-2.5 rounded-lg bg-background text-xs border border-border/80">
                  <p className="text-muted-foreground font-semibold mb-0.5">💬 Pesan dari Siswa:</p>
                  <p className="text-foreground italic">&ldquo;{submission.catatanSiswa}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Score Input (0 - 100) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-primary" />
                  <span>Nilai Tugas (Skala 0 - 100)</span>
                </label>
                {nilai && (
                  <span className="text-xs font-bold text-primary">
                    Predikat: {Number(nilai) >= 90 ? "A (Sangat Baik)" : Number(nilai) >= 80 ? "B (Baik)" : Number(nilai) >= 70 ? "C (Cukup)" : "D (Perlu Bimbingan)"}
                  </span>
                )}
              </div>

              {/* Quick Score Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[100, 95, 90, 85, 80, 75].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleQuickScore(score)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                      Number(nilai) === score
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={nilai}
                  onChange={(e) => setNilai(e.target.value)}
                  placeholder="Ketik nilai di sini (e.g. 95)"
                  className="w-full text-2xl font-bold font-mono h-14 rounded-xl border border-input bg-background px-4 text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-center"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  / 100
                </span>
              </div>
            </div>

            {/* Teacher Feedback / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Umpan Balik & Catatan Evaluasi Guru:</span>
              </label>
              <textarea
                value={catatanGuru}
                onChange={(e) => setCatatanGuru(e.target.value)}
                rows={4}
                placeholder="Contoh: MasyaAllah pengerjaan nomor 1-4 sangat rapi dan tepat. Perhatikan tanda kurung di nomor 5. Pertahankan prestasimu Ananda!"
                className="w-full text-xs rounded-xl border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 mt-4 border-t border-border space-y-2">
            <Button
              type="button"
              onClick={() => handleSubmitGrade("sudah_dinilai")}
              disabled={isSubmitting || !nilai}
              className="w-full h-11 text-xs font-bold rounded-xl gap-2 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan Nilai...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Simpan & Rilis Nilai ke Siswa
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmitGrade("perlu_revisi")}
              disabled={isSubmitting}
              className="w-full h-9 text-xs font-medium rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 border-amber-500/30"
            >
              Minta Siswa Perbaiki (Revisi)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
