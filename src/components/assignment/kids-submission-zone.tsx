"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Download,
  Loader2,
  Edit3,
  Sparkles,
  Trophy,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitTugasAction } from "@/actions/assignment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { InBrowserDocViewer } from "./in-browser-doc-viewer";
import { KidsCelebrationModal } from "./kids-celebration-modal";

export interface AttachmentItem {
  id: string;
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface SubmissionData {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number | null;
  attachments?: string | null; // JSON string
  catatanSiswa?: string | null;
  status: string;
  nilai?: number | null;
  catatanGuru?: string | null;
  annotatedFileUrl?: string | null;
  annotatedData?: string | null;
  submittedAt?: string | null;
}

interface KidsSubmissionZoneProps {
  tugasId: string;
  tugasJudul?: string;
  poinMaksimal: number;
  existingSubmission?: SubmissionData | null;
}

export function KidsSubmissionZone({
  tugasId,
  tugasJudul = "Tugas Siswa",
  poinMaksimal,
  existingSubmission,
}: KidsSubmissionZoneProps) {
  const router = useRouter();

  // Parse existing attachments if available
  const initialAttachments: AttachmentItem[] = React.useMemo(() => {
    if (!existingSubmission) return [];
    if (existingSubmission.attachments) {
      try {
        return JSON.parse(existingSubmission.attachments);
      } catch {
        // Fallback
      }
    }
    if (existingSubmission.fileUrl && existingSubmission.fileUrl !== "text_submission") {
      return [
        {
          id: "att-1",
          url: existingSubmission.fileUrl,
          name: existingSubmission.fileName || "Lembar Tugas",
          type: existingSubmission.fileType || "image",
          size: existingSubmission.fileSize || undefined,
        },
      ];
    }
    return [];
  }, [existingSubmission]);

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Array<{ name: string; url: string; isImage: boolean }>>([]);
  const [preservedAttachments, setPreservedAttachments] = useState<AttachmentItem[]>(initialAttachments);
  const [catatan, setCatatan] = useState(existingSubmission?.catatanSiswa || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // In-browser viewer modal state
  const [viewerFiles, setViewerFiles] = useState<Array<{ url: string; name: string }>>([]);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Confetti celebration modal state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<"submitted" | "high_score" | "perfect">("submitted");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isGraded = existingSubmission?.status === "sudah_dinilai";
  const isRevision = existingSubmission?.status === "perlu_revisi";
  const isWaiting =
    existingSubmission?.status === "menunggu_penilaian" || existingSubmission?.status === "terlambat";
  const hasSubmitted = !!existingSubmission;

  // Add files to state
  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validNewFiles: File[] = [];
    const newPreviews: Array<{ name: string; url: string; isImage: boolean }> = [];

    Array.from(files).forEach((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      const valid = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic", ".doc", ".docx"].includes(ext);

      if (!valid) {
        toast.error(`Format file "${file.name}" tidak didukung. Gunakan Foto atau PDF.`);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File "${file.name}" melebihi batas 20MB.`);
        return;
      }

      validNewFiles.push(file);
      const isImg = [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
      newPreviews.push({
        name: file.name,
        url: isImg ? URL.createObjectURL(file) : "",
        isImage: isImg,
      });
    });

    setSelectedFiles((prev) => [...prev, ...validNewFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveNewFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemovePreservedAttachment = (index: number) => {
    setPreservedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasNew = selectedFiles.length > 0;
    const hasPreserved = preservedAttachments.length > 0;
    const hasText = catatan.trim().length > 0;

    if (!hasNew && !hasPreserved && !hasText) {
      toast.error("Silakan unggah foto tugas atau tuliskan jawabanmu.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("tugas_id", tugasId);
    formData.append("catatan_siswa", catatan);

    if (preservedAttachments.length > 0) {
      formData.append("existing_attachments", JSON.stringify(preservedAttachments));
    }

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await submitTugasAction(formData);
      if (res.success) {
        setCelebrationType("submitted");
        setShowCelebration(true);
        setIsEditing(false);
        setSelectedFiles([]);
        setFilePreviews([]);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengumpulkan tugas.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kendala saat mengirim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPredikat = (score: number) => {
    if (score >= 90) return { label: "Mumtaz! (Istimewa / A)", icon: "🌟", color: "text-amber-500" };
    if (score >= 80) return { label: "Jayyid Jiddan (Sangat Baik / B)", icon: "⭐", color: "text-emerald-600" };
    if (score >= 70) return { label: "Jayyid (Baik / C)", icon: "👍", color: "text-blue-600" };
    return { label: "Perlu Bimbingan (D)", icon: "💪", color: "text-orange-600" };
  };

  // Open in-browser viewer helper
  const openInBrowserViewer = (files: Array<{ url: string; name: string }>, title: string, idx = 0) => {
    setViewerFiles(files);
    setViewerTitle(title);
    setViewerIndex(idx);
    setIsViewerOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* IN-BROWSER DOCUMENT & CORRECTION VIEWER MODAL */}
      <InBrowserDocViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title={viewerTitle}
        files={viewerFiles}
        initialIndex={viewerIndex}
        downloadPrefix={tugasJudul}
      />

      {/* CONFETTI CELEBRATION MODAL */}
      <KidsCelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        type={celebrationType}
        score={existingSubmission?.nilai}
      />

      {/* ======================================================== */}
      {/* 1. KOTAK NILAI & APRESIASI GURU (JIKA SUDAH DINILAI)      */}
      {/* ======================================================== */}
      {isGraded && (
        <div className="bg-card border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Header Status */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  Hasil Penilaian Ustadz / Ustadzah
                </h3>
                <p className="text-xs text-muted-foreground">Tugas telah diperiksa dan dinilai.</p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Selesai Dinilai ⭐
            </span>
          </div>

          {/* Big Score & Predikat */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 bg-linear-to-br from-emerald-500/15 to-teal-500/10 border-2 border-emerald-500/30 px-6 py-4 rounded-3xl shrink-0">
              <span className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400">
                {existingSubmission.nilai}
              </span>
              <div className="text-xs text-muted-foreground leading-tight">
                <div className="font-semibold">dari {poinMaksimal}</div>
                {existingSubmission.nilai !== null && existingSubmission.nilai !== undefined && (
                  <div className={`font-black text-xs sm:text-sm mt-0.5 ${getPredikat(existingSubmission.nilai).color}`}>
                    {getPredikat(existingSubmission.nilai).label}
                  </div>
                )}
              </div>
            </div>

            {/* Catatan / Feedback Guru */}
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Catatan Ustadz / Ustadzah:
              </p>
              {existingSubmission.catatanGuru ? (
                <div className="text-xs sm:text-sm text-foreground bg-muted/60 p-3.5 rounded-2xl border border-border leading-relaxed font-medium">
                  &ldquo;{existingSubmission.catatanGuru}&rdquo;
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic bg-muted/30 p-3 rounded-2xl border border-border">
                  Masya Allah, tugas telah diperiksa dengan baik.
                </p>
              )}
            </div>
          </div>

          {/* Lembar Koreksi Guru (In-Browser Previewer + Download Option) */}
          {existingSubmission.annotatedFileUrl && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Lembar Tugas Berstiker & Coretan Koreksi Guru
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Buka di layar untuk melihat coretan catatan dan stiker apresiasi guru.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* IN-BROWSER VIEW BUTTON (NO DOWNLOAD REQUIRED) */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    openInBrowserViewer(
                      [{ url: existingSubmission.annotatedFileUrl!, name: "Lembar Koreksi Guru" }],
                      "Koreksi & Stiker Ustadz/Ustadzah"
                    )
                  }
                  className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Buka di Layar</span>
                </Button>

                {/* OPTIONAL DOWNLOAD BUTTON */}
                <a
                  href={`/api/download?file=${encodeURIComponent(
                    existingSubmission.annotatedFileUrl
                  )}&name=${encodeURIComponent(`Hasil-Koreksi-${tugasJudul}.png`)}`}
                  download
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
                  title="Download hasil koreksi"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. KOTAK PERLU REVISI (JIKA GURU MEMINTA PERBAIKAN)      */}
      {/* ======================================================== */}
      {isRevision && (
        <div className="bg-card border-2 border-orange-500/40 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-base font-bold text-foreground">
                Yuk Poles & Perbaiki Sedikit Lagi! ✏️
              </h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-orange-500/15 text-orange-600 border border-orange-500/30">
              Perlu Revisi
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">Petunjuk Perbaikan dari Guru:</p>
            <p className="text-xs sm:text-sm text-foreground bg-orange-500/5 p-3.5 rounded-2xl border border-orange-500/20 leading-relaxed font-medium">
              {existingSubmission.catatanGuru || "Periksa kembali jawaban tugasmu dan kirimkan ulang ya."}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. STATUS SUDAH DIKUMPULKAN & MENUNGGU PEMERIKSAAN       */}
      {/* ======================================================== */}
      {isWaiting && !isEditing && (
        <div className="bg-card border-2 border-border/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Tugas Sudah Dikumpulkan! 🚀
                </h3>
                <p className="text-xs text-muted-foreground">
                  Sedang menunggu giliran diperiksa oleh ustadz / ustadzah.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs h-8 px-3 rounded-xl gap-1.5 font-bold"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Ubah Jawaban</span>
            </Button>
          </div>

          {/* Ringkasan Berkas yang Dikumpulkan */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground">Lembar Tugas yang Dikirim:</p>

            {initialAttachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {initialAttachments.map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        {att.type === "pdf" ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-foreground truncate">
                          Halaman {idx + 1}: {att.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Tersimpan aman di server</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* IN-BROWSER PREVIEW BUTTON */}
                      <button
                        type="button"
                        onClick={() => openInBrowserViewer(initialAttachments, "Lembar Tugas Saya", idx)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1"
                        title="Buka di Layar"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Lihat</span>
                      </button>

                      {/* DOWNLOAD BUTTON */}
                      <a
                        href={`/api/download?file=${encodeURIComponent(
                          att.url
                        )}&name=${encodeURIComponent(att.name)}`}
                        download
                        className="p-1.5 rounded-lg hover:bg-muted text-primary hover:text-primary/80"
                        title="Download file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Tidak ada lampiran file foto.</p>
            )}

            {existingSubmission.catatanSiswa && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border mt-2 space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Teks Jawaban / Catatan Siswa:</p>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {existingSubmission.catatanSiswa}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. FORM PENGUMPULAN (KIDS-FRIENDLY MULTI-PHOTO UPLOADER)  */}
      {/* ======================================================== */}
      {(!hasSubmitted || isEditing || isRevision) && (
        <div className="bg-card border-2 border-border/80 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                {isRevision
                  ? "Kirim Ulang Hasil Perbaikan ✏️"
                  : isEditing
                  ? "Perbarui Jawaban Tugas ✏️"
                  : "Lembar Pengumpulan Tugas 🚀"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Foto lembar tugas buku tulismu atau unggah dokumen PDF secara langsung.
              </p>
            </div>
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedFiles([]);
                  setFilePreviews([]);
                  setPreservedAttachments(initialAttachments);
                }}
                className="text-xs h-8 px-3 rounded-xl"
              >
                Batal
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* BAGIAN 1: MULTI-PHOTO / FILE UPLOADER */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-foreground block">
                1. Foto Lembar Tugas (Bisa Lebih Dari 1 Foto)
              </label>

              {/* Upload Dropzone & Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* General File Picker */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-4 text-center cursor-pointer hover:bg-muted/30 transition-all flex flex-col items-center justify-center space-y-2 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleAddFiles(e.target.files)}
                  />
                  <div className="p-2.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Pilih Foto / Berkas PDF
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Bisa pilih beberapa foto sekaligus
                    </p>
                  </div>
                </div>

                {/* Direct Mobile/Tablet Camera Button */}
                <div
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-emerald-500/60 rounded-2xl p-4 text-center cursor-pointer hover:bg-muted/30 transition-all flex flex-col items-center justify-center space-y-2 group"
                >
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleAddFiles(e.target.files)}
                  />
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Ambil Foto dari Kamera Langsung
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Foto buku PR halaman demi halaman
                    </p>
                  </div>
                </div>
              </div>

              {/* LIST OF SELECTED ATTACHMENTS (PRESERVED & NEW) */}
              {(preservedAttachments.length > 0 || filePreviews.length > 0) && (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Lembar Tugas Terpilih ({preservedAttachments.length + filePreviews.length} Lembar):
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Preserved Attachments */}
                    {preservedAttachments.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
                            Lembar {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {att.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              openInBrowserViewer(
                                preservedAttachments,
                                "Pratinjau Lembar Tugas",
                                idx
                              )
                            }
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Pratinjau di Layar"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePreservedAttachment(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            title="Hapus"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* New Uploaded Files */}
                    {filePreviews.map((f, idx) => {
                      const overallIdx = preservedAttachments.length + idx + 1;
                      return (
                        <div
                          key={f.name + idx}
                          className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 shrink-0">
                              Lembar {overallIdx} (Baru)
                            </span>
                            <span className="text-xs font-semibold text-foreground truncate">
                              {f.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {f.url && (
                              <button
                                type="button"
                                onClick={() =>
                                  openInBrowserViewer(
                                    filePreviews.map((p) => ({ url: p.url, name: p.name })),
                                    "Pratinjau Foto Baru",
                                    idx
                                  )
                                }
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Periksa Kejelasan Foto di Layar"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveNewFile(idx)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                              title="Hapus"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* BAGIAN 2: TEKS JAWABAN / CATATAN */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                2. Tulis Jawaban Langsung / Pesan untuk Ustadz & Ustadzah (Opsional)
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={4}
                placeholder="Tuliskan jawaban soalmu di sini, atau sampaikan pesan/pertanyaan kepada ustadz/ustadzah..."
                className="w-full text-xs sm:text-sm rounded-2xl border-2 border-input bg-background p-3.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary leading-relaxed"
              />
            </div>

            {/* TOMBOL KIRIM CERIA */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-xs sm:text-sm font-black rounded-2xl bg-linear-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700 text-white shadow-md gap-2 transition-all active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirimkan Tugasmu ke Server...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {isRevision
                      ? "Kirim Ulang Misi Perbaikan! 🚀"
                      : isEditing
                      ? "Simpan Perubahan Jawaban 💾"
                      : "Kumpulkan Misi Tugas Sekarang! 🚀"}
                  </span>
                </>
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
