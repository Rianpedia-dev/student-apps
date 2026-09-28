"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Loader2,
  Edit3,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitTugasAction } from "@/actions/assignment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface SubmissionData {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number | null;
  catatanSiswa?: string | null;
  status: string;
  nilai?: number | null;
  catatanGuru?: string | null;
  annotatedFileUrl?: string | null;
  submittedAt?: string | null;
}

interface FileSubmissionZoneProps {
  tugasId: string;
  poinMaksimal: number;
  existingSubmission?: SubmissionData | null;
}

export function FileSubmissionZone({
  tugasId,
  poinMaksimal,
  existingSubmission,
}: FileSubmissionZoneProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [catatan, setCatatan] = useState(existingSubmission?.catatanSiswa || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGraded = existingSubmission?.status === "sudah_dinilai";
  const isRevision = existingSubmission?.status === "perlu_revisi";
  const isWaiting = existingSubmission?.status === "menunggu_penilaian" || existingSubmission?.status === "terlambat";
  const hasSubmitted = !!existingSubmission;

  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    const valid = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic", ".doc", ".docx"].includes(ext);

    if (!valid) {
      toast.error("Format file harus berupa Foto (JPG/PNG), PDF, atau Dokumen.");
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 15MB.");
      return;
    }

    setFile(selectedFile);
    if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasNewFile = !!file;
    const hasExistingFile = existingSubmission && existingSubmission.fileUrl && existingSubmission.fileUrl !== "text_submission";
    const hasText = catatan.trim().length > 0;

    if (!hasNewFile && !hasExistingFile && !hasText) {
      toast.error("Silakan unggah file tugas atau tulis jawaban Anda.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("tugas_id", tugasId);
    formData.append("catatan_siswa", catatan);
    if (file) {
      formData.append("file", file);
    }

    try {
      const res = await submitTugasAction(formData);
      if (res.success) {
        toast.success(res.message);
        setIsEditing(false);
        setFile(null);
        setPreviewUrl(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengumpulkan tugas.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPredikat = (score: number) => {
    if (score >= 90) return "Sangat Baik (A)";
    if (score >= 80) return "Baik (B)";
    if (score >= 70) return "Cukup (C)";
    return "Perlu Bimbingan (D)";
  };

  return (
    <div className="space-y-4">
      {/* 1. KOTAK NILAI & EVALUASI GURU (Jika Sudah Dinilai) */}
      {isGraded && (
        <div className="bg-card border border-emerald-500/30 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-foreground">Hasil Penilaian Guru</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Selesai Dinilai
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Skor Besar */}
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 rounded-xl shrink-0">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                {existingSubmission.nilai}
              </span>
              <div className="text-xs text-muted-foreground leading-tight">
                <div>dari {poinMaksimal}</div>
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {existingSubmission.nilai !== null && existingSubmission.nilai !== undefined
                    ? getPredikat(existingSubmission.nilai)
                    : ""}
                </div>
              </div>
            </div>

            {/* Catatan Guru */}
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Catatan / Umpan Balik Guru:</p>
              {existingSubmission.catatanGuru ? (
                <p className="text-xs sm:text-sm text-foreground bg-muted/40 p-3 rounded-lg border border-border leading-relaxed">
                  {existingSubmission.catatanGuru}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Tidak ada catatan tambahan dari guru.
                </p>
              )}
            </div>
          </div>

          {/* Lampiran Koreksi Coretan Guru jika ada */}
          {existingSubmission.annotatedFileUrl && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                Lembar Tugas yang Dikoreksi Guru:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={existingSubmission.annotatedFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Lihat Catatan Guru</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={`/api/download?file=${encodeURIComponent(existingSubmission.annotatedFileUrl)}&name=${encodeURIComponent("Koreksi-Guru-" + (existingSubmission.fileName || "Tugas"))}`}
                  download
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Koreksi</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. KOTAK PERLU REVISI (Jika Guru Meminta Siswa Memperbaiki) */}
      {isRevision && (
        <div className="bg-card border border-rose-500/30 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              <h3 className="text-base font-bold text-foreground">Tugas Perlu Diperbaiki</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
              Perlu Revisi
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Instruksi Perbaikan dari Guru:</p>
            <p className="text-xs sm:text-sm text-foreground bg-rose-500/5 p-3 rounded-lg border border-rose-500/20 leading-relaxed">
              {existingSubmission.catatanGuru || "Silakan perbaiki jawaban tugas Anda sesuai arahan guru."}
            </p>
          </div>
        </div>
      )}

      {/* 3. STATUS SUDAH DIKUMPULKAN & MENUNGGU PEMERIKSAAN */}
      {isWaiting && !isEditing && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">Tugas Sudah Dikumpulkan</h3>
                <p className="text-xs text-muted-foreground">Sedang menunggu pemeriksaan dari guru.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs h-8 px-2.5 gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Ubah Jawaban</span>
            </Button>
          </div>

          {/* Ringkasan apa yang dikumpulkan */}
          <div className="space-y-2">
            {existingSubmission.fileUrl && existingSubmission.fileUrl !== "text_submission" && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {existingSubmission.fileName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">File tugas tersimpan</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={existingSubmission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1"
                  >
                    <span>Lihat</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={`/api/download?file=${encodeURIComponent(existingSubmission.fileUrl)}&name=${encodeURIComponent(existingSubmission.fileName || "Tugas-Siswa")}`}
                    download
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Download</span>
                    <Download className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {existingSubmission.catatanSiswa && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Jawaban / Catatan Siswa:</p>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {existingSubmission.catatanSiswa}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. FORM PENGUMPULAN / FORM EDIT / FORM REVISI */}
      {(!hasSubmitted || isEditing || isRevision) && (
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              {isRevision
                ? "Kirim Ulang Jawaban Perbaikan"
                : isEditing
                ? "Perbarui Jawaban Tugas"
                : "Pengumpulan Tugas"}
            </h3>
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="text-xs h-7 px-2"
              >
                Batal
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bagian 1: Unggah File (Opsional jika teks diisi, atau sebaliknya) */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                1. Unggah File / Foto Tugas (Opsional)
              </label>

              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-border hover:border-primary/50 rounded-xl p-5 text-center cursor-pointer hover:bg-muted/20 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">
                    Klik untuk memilih file atau foto tugas
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Format: PDF, Foto JPG/PNG, atau Dokumen Word (Maks. 15MB)
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {file.name.toLowerCase().endsWith(".pdf") ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <ImageIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Siap dikirim
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Preview Foto */}
              {previewUrl && (
                <div className="mt-2.5 p-2 bg-muted/20 rounded-xl border border-border">
                  <p className="text-[11px] text-muted-foreground mb-1 font-medium">Pratinjau Foto:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Pratinjau tugas"
                    className="max-h-52 rounded-lg mx-auto object-contain border border-border"
                  />
                </div>
              )}
            </div>

            {/* Bagian 2: Teks Jawaban / Catatan */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                2. Tulis Jawaban Langsung / Catatan untuk Guru
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={4}
                placeholder="Tulis jawaban soal di sini, atau tambahkan catatan/pertanyaan untuk guru..."
                className="w-full text-xs sm:text-sm rounded-xl border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 leading-relaxed"
              />
            </div>

            {/* Tombol Kirim */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 text-xs sm:text-sm font-bold rounded-xl gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirimkan Tugas...</span>
                </>
              ) : (
                <span>
                  {isRevision ? "Kirim Ulang Hasil Revisi" : isEditing ? "Simpan Perubahan" : "Kumpulkan Tugas"}
                </span>
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
