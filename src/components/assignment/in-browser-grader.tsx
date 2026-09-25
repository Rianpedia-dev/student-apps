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
  FileText, 
  Image as ImageIcon,
  Loader2,
  ExternalLink
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

  const isPdf =
    submission.fileType.toLowerCase() === "pdf" ||
    submission.fileUrl.toLowerCase().endsWith(".pdf");

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
    ctx.strokeStyle = "#ef4444";
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

  const handleSubmitGrade = async (targetStatus: string = "sudah_dinilai", redirectBack: boolean = false) => {
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
        if (redirectBack) {
          router.push(`/guru/tugas/${submission.tugasId}`);
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
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-background -m-4 sm:-m-6 overflow-hidden">
      {/* Top Header Toolbar */}
      <div className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 truncate">
          <Link
            href={`/guru/tugas/${submission.tugasId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Link>
          <div className="h-4 w-px bg-border shrink-0" />
          <div className="truncate">
            <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">
              {submission.siswa.name}
            </h2>
            <p className="text-[11px] text-muted-foreground truncate">
              {submission.tugasJudul} • {submission.kelasNama}
            </p>
          </div>
        </div>

        {/* Viewer Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            title="Perkecil"
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            title="Perbesar"
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
                title="Putar 90°"
                className="h-8 w-8 p-0"
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant={isDrawingMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isDrawingMode ? "Spidol Aktif" : "Coret Lembar"}</span>
              </Button>

              {isDrawingMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDraw}
                  title="Hapus Coretan"
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
            onClick={() => {
              setZoom(1);
              setRotation(0);
            }}
            title="Reset"
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANE: DOCUMENT VIEWER */}
        <div className="flex-1 bg-muted/30 relative overflow-auto p-4 flex items-center justify-center select-none border-b lg:border-b-0 lg:border-r border-border">
          {isPdf ? (
            <div
              className="w-full h-full bg-card rounded-xl border border-border shadow-xs overflow-hidden"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            >
              <iframe
                src={`${submission.fileUrl}#toolbar=0&navpanes=0`}
                title={submission.fileName}
                className="w-full h-full border-0 min-h-[500px]"
              />
            </div>
          ) : (
            <div
              className="relative transition-transform duration-200 shadow-md rounded-xl overflow-hidden bg-card border border-border"
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

        {/* RIGHT PANE: FORM PENILAIAN */}
        <div className="w-full lg:w-[360px] xl:w-[400px] bg-card p-5 overflow-y-auto shrink-0 flex flex-col justify-between border-t lg:border-t-0 shadow-xs z-10 space-y-4">
          <div className="space-y-4">
            {/* Info Siswa Sederhana */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">
                    {submission.siswa.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    NIS: {submission.siswa.nis || "-"} • {submission.kelasNama}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  status === "sudah_dinilai"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : status === "perlu_revisi"
                    ? "bg-rose-500/10 text-rose-600"
                    : "bg-amber-500/10 text-amber-600"
                }`}>
                  {status === "sudah_dinilai" ? "Sudah Dinilai" : status === "perlu_revisi" ? "Perlu Revisi" : "Menunggu"}
                </span>
              </div>

              {submission.catatanSiswa && (
                <div className="pt-2 border-t border-border/60">
                  <p className="text-[11px] text-muted-foreground font-semibold mb-0.5">Pesan Siswa:</p>
                  <p className="text-xs text-foreground italic">&ldquo;{submission.catatanSiswa}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Input Nilai */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Nilai Tugas (0 - 100) *
                </label>
                <div className="flex items-center gap-1">
                  {[100, 95, 90, 85, 80].map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setNilai(String(sc))}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${
                        Number(nilai) === sc
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder="Masukkan nilai"
                className="w-full text-xl font-bold font-mono h-11 rounded-xl border border-input bg-background px-3 text-center text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Catatan Evaluasi Guru */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Catatan / Evaluasi Guru:
              </label>
              <textarea
                value={catatanGuru}
                onChange={(e) => setCatatanGuru(e.target.value)}
                rows={4}
                placeholder="Tuliskan umpan balik atau pesan untuk siswa..."
                className="w-full text-xs sm:text-sm rounded-xl border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 leading-relaxed"
              />
            </div>
          </div>

          {/* Tombol Aksi Simpan */}
          <div className="pt-3 border-t border-border space-y-2">
            <Button
              type="button"
              onClick={() => handleSubmitGrade("sudah_dinilai", true)}
              disabled={isSubmitting || !nilai}
              className="w-full h-10 text-xs font-bold rounded-xl gap-2 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Simpan Nilai & Selesai</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmitGrade("perlu_revisi", true)}
              disabled={isSubmitting}
              className="w-full h-8 text-xs font-medium rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30"
            >
              Minta Siswa Perbaiki (Revisi)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
