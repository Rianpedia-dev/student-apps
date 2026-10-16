"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Edit3,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  Sparkles,
  Send,
  Eye,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitDocumentTaskAction } from "@/actions/assignment";
import { InBrowserDocViewer } from "../in-browser-doc-viewer";
import { cn } from "@/lib/utils";

export interface StudentDocumentTaskCardProps {
  tugasId: string;
  judul: string;
  deskripsi: string;
  fileSoalUrl: string;
  mapelNama: string;
  kelasNama: string;
  guruNama: string;
  deadlineFormatted: string;
  isLate: boolean;
  poinMaksimal: number;
  existingSubmission: {
    id: string;
    status: string;
    nilai: number | null;
    catatanGuru: string | null;
    catatanSiswa?: string | null;
    fileUrl: string | null;
    fileName: string | null;
    fileType: string | null;
    annotatedFileUrl?: string | null;
    submittedAt: string | null;
  } | null;
}

export function StudentDocumentTaskCard({
  tugasId,
  judul,
  deskripsi,
  fileSoalUrl,
  mapelNama,
  kelasNama,
  guruNama,
  deadlineFormatted,
  isLate,
  poinMaksimal,
  existingSubmission,
}: StudentDocumentTaskCardProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [catatanSiswa, setCatatanSiswa] = useState("");
  const [showViewer, setShowViewer] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string>("");
  const [viewerTitle, setViewerTitle] = useState<string>("");

  const isPdf = fileSoalUrl.toLowerCase().includes(".pdf");
  const status = existingSubmission?.status || "belum_mengumpulkan";
  const isPerluRevisi = status === "perlu_revisi";
  const isSudahDinilai = status === "sudah_dinilai";
  const isMenungguPenilaian = status === "menunggu_penilaian";

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Pilih berkas pengerjaan terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("tugas_id", tugasId);
      formData.append("submission_mode", "upload");
      formData.append("file", selectedFile);
      if (catatanSiswa.trim()) {
        formData.append("catatan_siswa", catatanSiswa.trim());
      }

      const res = await submitDocumentTaskAction(formData);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengumpulkan tugas.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat mengumpulkan tugas.");
    } finally {
      setIsUploading(false);
    }
  };

  const openCorrectionViewer = () => {
    if (existingSubmission?.annotatedFileUrl) {
      setViewerUrl(existingSubmission.annotatedFileUrl);
      setViewerTitle(`Lembar Hasil Koreksi Guru - ${judul}`);
      setShowViewer(true);
    } else if (existingSubmission?.fileUrl) {
      setViewerUrl(existingSubmission.fileUrl);
      setViewerTitle(`Lembar Jawaban Siswa - ${judul}`);
      setShowViewer(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Status Banner Alert */}
      {isPerluRevisi && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Tugas Perlu Direvisi (Perbaikan) 📝
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ustadz/Ustadzah meminta ananda untuk memperbaiki tugas ini. Silakan periksa catatan dan perbaiki jawabanmu.
              </p>
              {existingSubmission?.catatanGuru && (
                <div className="mt-2 p-2.5 rounded-lg bg-card border border-amber-500/20 text-xs text-foreground font-medium">
                  <strong>Catatan Guru:</strong> &ldquo;{existingSubmission.catatanGuru}&rdquo;
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {existingSubmission?.annotatedFileUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openCorrectionViewer}
                className="text-xs h-9 gap-1.5 rounded-xl border-amber-500/30"
              >
                <Eye className="h-3.5 w-3.5 text-amber-600" />
                <span>Lihat Coretan Guru</span>
              </Button>
            )}
            <Link href={`/siswa/tugas/${tugasId}/kerjakan-berkas`} className="w-full sm:w-auto">
              <Button
                type="button"
                size="sm"
                className="w-full text-xs h-9 font-bold gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Perbaiki Sekarang</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {isSudahDinilai && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Alhamdulillah, Tugas Sudah Dinilai! ⭐
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kerja bagus! Periksa hasil nilai dan coretan evaluasi dari Ustadz/Ustadzah.
              </p>
              {existingSubmission?.catatanGuru && (
                <div className="mt-2 p-2.5 rounded-lg bg-card border border-emerald-500/20 text-xs text-foreground font-medium">
                  <strong>Catatan Guru:</strong> &ldquo;{existingSubmission.catatanGuru}&rdquo;
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Nilai Akhir</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {existingSubmission?.nilai} / {poinMaksimal}
              </span>
            </div>
            {(existingSubmission?.annotatedFileUrl || existingSubmission?.fileUrl) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openCorrectionViewer}
                className="text-xs h-9 gap-1.5 rounded-xl border-emerald-500/30 font-bold"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                <span>Lihat Hasil Koreksi</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {isMenungguPenilaian && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">
                Tugas Berhasil Dikumpulkan! 🚀
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lembar jawabanmu sudah tersimpan di sistem dan sedang menunggu koreksi dari dewan guru.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openCorrectionViewer}
            className="text-xs h-9 gap-1.5 rounded-xl shrink-0"
          >
            <Eye className="h-3.5 w-3.5 text-blue-600" />
            <span>Lihat Lembar Jawaban</span>
          </Button>
        </div>
      )}

      {/* 2. Main Task Card */}
      <Card className="overflow-hidden border border-border shadow-sm">
        <CardHeader className="p-5 sm:p-6 bg-card border-b border-border space-y-3">
          {/* Baris 1: Kategori & Batas Waktu */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="emerald" size="sm" className="font-semibold text-xs px-2.5 py-0.5">
                Lembar Kerja
              </Badge>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-semibold bg-muted/60 px-3 py-1 rounded-xl border border-border/70">
              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Batas: <strong className="text-foreground">{deadlineFormatted}</strong></span>
            </div>
          </div>

          {/* Baris 2: Judul Tugas */}
          <CardTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {judul}
          </CardTitle>

          {/* Baris 3: Petunjuk Khusus Guru (jika ada) */}
          {deskripsi &&
            !deskripsi.includes("Silakan kerjakan lembar soal berikut secara langsung di aplikasi") &&
            deskripsi.trim().length > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/80 text-xs text-foreground font-medium leading-relaxed">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground">Petunjuk Pengerjaan: </span>
                  <span className="text-muted-foreground">{deskripsi}</span>
                </div>
              </div>
            )}

          {/* Baris 4: Informasi Metadata Ringkas */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-3 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Skor Maksimal: <strong className="text-foreground">{poinMaksimal} Poin</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Format: <strong className="text-foreground">{isPdf ? "Dokumen PDF" : "File Gambar"}</strong></span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Bar Berkas Lembar Soal (Rapi & Elegan) */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-border bg-gradient-to-r from-muted/40 via-muted/20 to-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                {isPdf ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                  Berkas Lembar Soal ({isPdf ? "PDF" : "Gambar"})
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  Lembar tugas resmi dari pendidik, siap dikerjakan di layar atau diunduh
                </p>
              </div>
            </div>
            <a
              href={`/api/download?file=${encodeURIComponent(fileSoalUrl)}&name=${encodeURIComponent(`Soal-${judul}`)}`}
              download
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-xs font-bold transition-all shrink-0 shadow-2xs hover:scale-[1.01]"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Unduh Berkas Soal</span>
            </a>
          </div>

          {/* 2 Pilihan Pengerjaan (Seimbang, Simetris & Rapi) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* OPSI 1: In-App Canvas Editor (Rekomendasi Utama) */}
            <div className="p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70 transition-all flex flex-col justify-between gap-5 relative overflow-hidden group shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="emerald" size="sm" className="font-bold gap-1 text-[11px] px-2.5 py-0.5">
                    <Sparkles className="h-3 w-3" />
                    <span>Pilihan 1 (Praktis di Layar)</span>
                  </Badge>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Edit3 className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-black text-foreground">
                    Kerjakan Langsung di Layar
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Tulis jawaban langsung di atas lembar soal tanpa perlu mencetak kertas.
                  </p>
                </div>

                {/* 3 Keunggulan (Mengisi ruang vertikal agar simetris & seimbang) */}
                <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Tersedia pena digital, stabilo & ketik teks</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Tersimpan otomatis & langsung dinilai guru</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Bisa dibuka di HP, laptop, maupun tablet/iPad</span>
                  </div>
                </div>
              </div>

              <Link href={`/siswa/tugas/${tugasId}/kerjakan-berkas`} className="w-full pt-1">
                <Button
                  type="button"
                  className="w-full h-11 text-xs font-black gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all hover:scale-[1.01]"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>
                    {isPerluRevisi
                      ? "Perbaiki Lembar Kerja 🚀"
                      : isSudahDinilai || isMenungguPenilaian
                      ? "Buka Kembali Kanvas Pengerjaan"
                      : "Buka Kanvas & Kerjakan 🚀"}
                  </span>
                </Button>
              </Link>
            </div>

            {/* OPSI 2: Download & Upload Manual */}
            <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card hover:border-border/90 transition-all flex flex-col justify-between gap-5 shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" size="sm" className="font-semibold text-muted-foreground gap-1 text-[11px] px-2.5 py-0.5">
                    <span>Pilihan 2 (Cetak / Manual)</span>
                  </Badge>
                  <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                    <Upload className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-bold text-foreground">
                    Unggah Berkas / Foto Jawaban
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Pilihan jika dikerjakan di kertas cetak atau aplikasi luar.
                  </p>
                </div>

                {/* Form Upload yang Rapi & Proporsional */}
                <form onSubmit={handleUploadSubmit} className="space-y-2.5 pt-2 border-t border-border/60">
                  <div>
                    <label className="text-[11px] font-bold text-foreground block mb-1">
                      Foto atau Berkas Jawaban:
                    </label>
                    <label className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors group">
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/webp"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 truncate">
                        <Upload className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                        <span className="text-xs text-muted-foreground group-hover:text-foreground font-medium truncate">
                          {selectedFile ? selectedFile.name : "Pilih foto atau berkas PDF..."}
                        </span>
                      </div>
                      {selectedFile ? (
                        <Badge variant="emerald" size="sm" className="shrink-0 text-[10px] py-0 px-2 font-bold">
                          Terpilih
                        </Badge>
                      ) : (
                        <span className="text-[10px] font-bold text-primary group-hover:underline shrink-0">
                          Pilih Berkas
                        </span>
                      )}
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-foreground block mb-1">
                      Catatan untuk Guru (Opsional):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jawaban nomor 4 ada di lembar 2..."
                      value={catatanSiswa}
                      onChange={(e) => setCatatanSiswa(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      disabled={isUploading || !selectedFile}
                      variant={selectedFile ? "default" : "outline"}
                      className={cn(
                        "w-full h-11 text-xs font-bold gap-2 rounded-xl transition-all",
                        selectedFile
                          ? "bg-primary text-primary-foreground shadow-xs hover:scale-[1.01]"
                          : "text-muted-foreground border-border bg-muted/30"
                      )}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Mengunggah Berkas...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          <span>Kumpulkan Berkas Jawaban</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer Modal for Inspection */}
      {showViewer && (
        <InBrowserDocViewer
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
          title={viewerTitle}
          files={viewerUrl}
        />
      )}
    </div>
  );
}
