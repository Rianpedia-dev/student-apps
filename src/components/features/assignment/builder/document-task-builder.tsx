"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Calendar,
  Award,
  BookOpen,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createDocumentTugasAction } from "@/actions/assignment";

export interface DocumentTaskBuilderProps {
  classes: Array<{ id: string; nama: string; jenjang?: string; tingkat?: number | null }>;
  subjects: Array<{ id: string; kode: string; nama: string; jenjang?: string }>;
  pertemuanList?: Array<{ id: string; pertemuan_ke: number; judul: string }>;
  defaultKelas?: string;
  initialKelasId?: string;
  initialMapelId?: string;
}

export function DocumentTaskBuilder({
  classes,
  subjects,
  pertemuanList = [],
  defaultKelas,
  initialKelasId,
  initialMapelId,
}: DocumentTaskBuilderProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const matchedClass = classes.find((c) => c.nama === defaultKelas);
  const [kelasId, setKelasId] = useState<string>(initialKelasId || matchedClass?.id || classes[0]?.id || "");
  const [mapelId, setMapelId] = useState<string>(initialMapelId || subjects[0]?.id || "");
  const [pertemuanId, setPertemuanId] = useState<string>("");
  const [judul, setJudul] = useState<string>("");
  const [deskripsi, setDeskripsi] = useState<string>(
    "Kerjakan lembar kerja berikut dengan teliti."
  );

  // Default deadline 3 days ahead at 23:59
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);
  defaultDate.setHours(23, 59, 0, 0);
  const [deadline, setDeadline] = useState<string>(defaultDate.toISOString().slice(0, 16));
  const [poinMaksimal, setPoinMaksimal] = useState<number>(100);

  // File Upload State
  const [fileSoal, setFileSoal] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const isAllowed = ["pdf", "jpg", "jpeg", "png", "webp"].includes(ext || "");

    if (!isAllowed) {
      toast.error("Format berkas tidak didukung. Mohon unggah dokumen PDF atau file gambar (JPG/PNG/WebP).");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Ukuran berkas melebihi batas maksimum 25MB.");
      return;
    }

    setFileSoal(file);
    if (ext !== "pdf") {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setFileSoal(null);
    setFilePreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim()) {
      toast.error("Mohon isi judul tugas.");
      return;
    }

    if (!kelasId) {
      toast.error("Mohon pilih kelas tujuan.");
      return;
    }

    if (!mapelId) {
      toast.error("Mohon pilih mata pelajaran.");
      return;
    }

    if (!deadline) {
      toast.error("Mohon tentukan tenggat waktu (deadline).");
      return;
    }

    if (!fileSoal) {
      toast.error("Mohon unggah file lembar soal (PDF atau Gambar).");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("judul", judul.trim());
      formData.append("deskripsi", deskripsi.trim());
      formData.append("kelas_id", kelasId);
      formData.append("mapel_id", mapelId);
      if (pertemuanId) formData.append("pertemuan_id", pertemuanId);
      formData.append("deadline", deadline);
      formData.append("poin_maksimal", String(poinMaksimal));
      formData.append("file_soal", fileSoal);

      const res = await createDocumentTugasAction(formData);

      if (res.success && res.data) {
        toast.success(res.message);
        router.push(`/guru/tugas/${res.data.id}`);
      } else {
        toast.error(res.error || "Gagal membuat tugas.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat membuat tugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Informasi Tugas */}
        <div className="md:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Informasi & Konfigurasi Tugas
              </CardTitle>
              <CardDescription className="text-xs">
                Tentukan identitas tugas, rombel kelas sasaran, dan batas akhir pengumpulan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Judul Tugas */}
              <div className="space-y-1.5">
                <Label htmlFor="judul" className="text-xs font-bold text-foreground">
                  Judul Tugas Lembar Kerja <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="judul"
                  placeholder="Contoh: LKS Matematika Bab 3 - Operasi Pecahan Desimal"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              {/* Rombel & Mapel Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kelas_id" className="text-xs font-bold text-foreground">
                    Rombel Kelas <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="kelas_id"
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    required
                    className="w-full text-xs h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled>
                      Pilih Rombel Kelas
                    </option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama} {c.jenjang ? `(${c.jenjang})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mapel_id" className="text-xs font-bold text-foreground">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="mapel_id"
                    value={mapelId}
                    onChange={(e) => setMapelId(e.target.value)}
                    required
                    className="w-full text-xs h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled>
                      Pilih Mata Pelajaran
                    </option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tautkan Silabus Pertemuan (Opsional) */}
              {pertemuanList.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="pertemuan_id" className="text-xs font-bold text-foreground">
                    Tautkan ke Silabus Pertemuan (Opsional)
                  </Label>
                  <select
                    id="pertemuan_id"
                    value={pertemuanId}
                    onChange={(e) => setPertemuanId(e.target.value)}
                    className="w-full text-xs h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Tanpa Tautan Silabus --</option>
                    {pertemuanList.map((p) => (
                      <option key={p.id} value={p.id}>
                        Pertemuan {p.pertemuan_ke}: {p.judul}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Deadline & Poin Maksimal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="deadline" className="text-xs font-bold text-foreground">
                    Tenggat Waktu (*Deadline*) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="poin_maksimal" className="text-xs font-bold text-foreground">
                    Skor / Poin Maksimal
                  </Label>
                  <Input
                    id="poin_maksimal"
                    type="number"
                    min={10}
                    max={100}
                    value={poinMaksimal}
                    onChange={(e) => setPoinMaksimal(Number(e.target.value) || 100)}
                    required
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Deskripsi & Petunjuk Pengerjaan */}
              <div className="space-y-1.5">
                <Label htmlFor="deskripsi" className="text-xs font-bold text-foreground">
                  Petunjuk Pengerjaan untuk Santri <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="deskripsi"
                  rows={4}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Tuliskan petunjuk pengerjaan soal..."
                  required
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Upload Lembar Soal & Pratinjau */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Unggah Berkas Lembar Soal
              </CardTitle>
              <CardDescription className="text-xs">
                Format didukung: <strong>PDF</strong> atau <strong>Gambar (JPG, PNG, WebP)</strong>. Maksimal 25MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!fileSoal ? (
                <label className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">Klik untuk memilih berkas soal</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">atau seret & jatuhkan berkas di sini</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="rounded-xl border border-border p-3.5 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        {fileSoal.name.toLowerCase().endsWith(".pdf") ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{fileSoal.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {(fileSoal.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleRemoveFile}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Ganti Berkas"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Image Thumbnail Preview */}
                  {filePreviewUrl && (
                    <div className="rounded-lg overflow-hidden border border-border bg-black/5 aspect-4/3 relative">
                      <img
                        src={filePreviewUrl}
                        alt="Pratinjau Lembar Soal"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {fileSoal.name.toLowerCase().endsWith(".pdf") && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Berkas PDF siap. Sistem akan otomatis merender halaman PDF di kanvas siswa & guru.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !fileSoal}
                  className="w-full text-xs font-bold h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menerbitkan Tugas...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Terbitkan Tugas Lembar Kerja</span>
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">
                  Tugas akan langsung muncul di dasbor siswa kelas terpilih.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
