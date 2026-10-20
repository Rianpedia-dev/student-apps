"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

  const pertemuanItems = React.useMemo(() => {
    const list: Array<{ value: string; label: string }> = [
      { value: "none", label: "Tidak ditautkan" },
    ];
    pertemuanList.forEach((p) => {
      list.push({
        value: p.id,
        label: `Pertemuan ${p.pertemuan_ke}: ${p.judul}`,
      });
    });
    return list;
  }, [pertemuanList]);

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
      <Card className="max-w-3xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Informasi Tugas</CardTitle>
          <CardDescription className="text-xs">
            Lengkapi data utama tugas seperti judul, kelas tujuan, mata pelajaran, dan tenggat waktu pengerjaan.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Judul Tugas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Judul Tugas <span className="text-destructive">*</span>
            </label>
            <Input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: LKS Bab 1 - Bilangan Bulat"
              className="text-xs sm:text-sm h-10"
              required
            />
          </div>

          {/* Pertemuan (Opsional) */}
          {pertemuanList.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tautkan ke Pertemuan (Opsional)
              </label>
              <Select
                items={pertemuanItems}
                value={pertemuanId || "none"}
                onValueChange={(val) => setPertemuanId(val === "none" ? "" : val || "")}
              >
                <SelectTrigger className="w-full text-xs h-10">
                  <SelectValue placeholder="Tidak ditautkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ditautkan</SelectItem>
                  {pertemuanList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      Pertemuan {p.pertemuan_ke}: {p.judul}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tenggat Waktu & Skor Maksimal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tenggat Waktu / Deadline <span className="text-destructive">*</span>
              </label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="text-xs sm:text-sm h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Skor / Poin Maksimal <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={10}
                max={100}
                value={poinMaksimal}
                onChange={(e) => setPoinMaksimal(Number(e.target.value) || 100)}
                className="text-xs sm:text-sm h-10"
                required
              />
            </div>
          </div>

          {/* Unggah Berkas Lembar Soal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Unggah Berkas Lembar Soal <span className="text-destructive">*</span>
            </label>
            {!fileSoal ? (
              <label className="border-2 border-dashed border-input hover:border-emerald-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-muted/20 hover:bg-emerald-50/20 transition-colors">
                <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground">Klik untuk memilih berkas soal</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Format: PDF atau Gambar (JPG, PNG, WebP). Maksimal 25MB.</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="rounded-xl border border-input p-3 bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 shrink-0">
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
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-destructive hover:text-destructive h-8 px-2 text-xs"
                  >
                    <X className="h-4 w-4 mr-1" />
                    <span>Ganti</span>
                  </Button>
                </div>

                {filePreviewUrl && (
                  <div className="rounded-lg overflow-hidden border border-input bg-black/5 aspect-4/3 max-h-48 relative">
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
                    <span>Berkas PDF siap. Sistem akan otomatis mengaktifkan kanvas interaktif.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instruksi / Petunjuk Pengerjaan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Instruksi / Petunjuk Pengerjaan <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              placeholder="Tuliskan petunjuk pengerjaan tugas untuk siswa..."
              className="text-xs sm:text-sm leading-relaxed"
              required
            />
          </div>

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !fileSoal}
              className="text-xs font-semibold gap-1.5 h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menerbitkan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Terbitkan Tugas Lembar Kerja</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
