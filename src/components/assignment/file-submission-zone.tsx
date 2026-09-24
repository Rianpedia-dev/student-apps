"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Image as ImageIcon, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitTugasAction } from "@/actions/assignment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FileSubmissionZoneProps {
  tugasId: string;
  poinMaksimal: number;
  existingSubmission?: {
    fileUrl: string;
    fileName: string;
    fileType: string;
    catatanSiswa?: string | null;
    status: string;
    nilai?: number | null;
    catatanGuru?: string | null;
  } | null;
}

export function FileSubmissionZone({ tugasId, poinMaksimal, existingSubmission }: FileSubmissionZoneProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [catatan, setCatatan] = useState(existingSubmission?.catatanSiswa || "");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    const valid = [".pdf", ".png", ".jpg", ".jpeg"].includes(ext);

    if (!valid) {
      toast.error("Format file harus PDF, PNG, atau JPG.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal adalah 10MB.");
      return;
    }

    setFile(selectedFile);
    if ([".png", ".jpg", ".jpeg"].includes(ext)) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !existingSubmission) {
      toast.error("Silakan pilih file tugas (PDF / Gambar) terlebih dahulu.");
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

  const isGraded = existingSubmission?.status === "sudah_dinilai";

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span>📤 Pengumpulan Tugas</span>
          {existingSubmission && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isGraded
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            }`}>
              {isGraded ? "Sudah Dinilai 🎉" : "Menunggu Pemeriksaan Ustadz/Ustadzah"}
            </span>
          )}
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          Maksimal {poinMaksimal} Poin
        </span>
      </div>

      {isGraded && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
            {existingSubmission.nilai}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              Alhamdulillah! Nilaimu: {existingSubmission.nilai} / {poinMaksimal}
            </h4>
            {existingSubmission.catatanGuru ? (
              <p className="text-xs mt-1 text-foreground/90 bg-background/60 p-2.5 rounded-lg border border-border/50">
                💬 <strong>Catatan Guru:</strong> &ldquo;{existingSubmission.catatanGuru}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Pekerjaanmu sangat baik. Terus tingkatkan ya!</p>
            )}
          </div>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drag & Drop Area */}
        {!file && existingSubmission ? (
          <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                {existingSubmission.fileType === "pdf" ? <FileText className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-sm font-semibold truncate max-w-xs">{existingSubmission.fileName}</p>
                <p className="text-xs text-muted-foreground">File sudah tersimpan di sistem</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={existingSubmission.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline font-medium hover:text-primary/80"
              >
                Lihat File
              </a>
              {!isGraded && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs h-8"
                >
                  Ganti File
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[0.99]"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Klik atau Seret file tugas ke sini
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mendukung file dokumen PDF atau foto PNG/JPG (Maks. 10MB)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected File Live Preview */}
        {file && (
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                {file.name.toLowerCase().endsWith(".pdf") ? (
                  <FileText className="h-6 w-6 text-red-500" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold truncate max-w-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Siap dikirim
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setFile(null); setPreviewUrl(null); }}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Batal pilih file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Image Thumbnail Preview if PNG/JPG */}
        {previewUrl && (
          <div className="p-3 bg-muted/20 border border-border rounded-xl">
            <p className="text-xs text-muted-foreground mb-2 font-medium">📷 Pratinjau Foto Tugas:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Pratinjau tugas"
              className="max-h-60 rounded-lg mx-auto object-contain border border-border shadow-xs"
            />
          </div>
        )}

        {/* Notes for Teacher */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Pesan / Catatan untuk Guru (Opsional):
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            disabled={isGraded}
            rows={2}
            placeholder="Tulis salam atau pertanyaan untuk ustadz/ustadzah di sini..."
            className="w-full text-sm rounded-xl border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          />
        </div>

        {/* Submit Button */}
        {!isGraded && (
          <Button
            type="submit"
            disabled={isSubmitting || (!file && !existingSubmission)}
            className="w-full h-11 text-sm font-semibold rounded-xl gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengunggah Tugas...
              </>
            ) : existingSubmission ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Perbarui Tugas Saya
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                Kumpulkan Tugas Sekarang
              </>
            )}
          </Button>
        )}
      </form>
    </div>
  );
}
