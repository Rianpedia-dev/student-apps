"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen,
  Upload,
  Video,
  Link as LinkIcon,
  FileCheck,
  Sparkles,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  X
} from "lucide-react";
import { createPertemuanAction, updatePertemuanAction } from "@/actions/pertemuan";

interface MeetingFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  kelasId: string;
  mapelId: string;
  initialData?: any | null;
  suggestedPertemuanKe?: number;
  availableTasks?: Array<{ id: string; judul: string; pertemuan_id?: string | null }>;
  onSuccess?: () => void;
}

export function MeetingFormDialog({
  isOpen,
  onClose,
  kelasId,
  mapelId,
  initialData = null,
  suggestedPertemuanKe = 1,
  availableTasks = [],
  onSuccess,
}: MeetingFormDialogProps) {
  const isEdit = !!initialData;

  const [pertemuanKe, setPertemuanKe] = useState<number>(suggestedPertemuanKe);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkEksternal, setLinkEksternal] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState("none");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setPertemuanKe(initialData.pertemuanKe || initialData.pertemuan_ke || 1);
      setJudul(initialData.judul || "");
      setDeskripsi(initialData.deskripsi || "");
      const dateVal = initialData.tanggal ? new Date(initialData.tanggal).toISOString().split("T")[0] : "";
      setTanggal(dateVal);
      setVideoUrl(initialData.videoUrl || initialData.video_url || "");
      setLinkEksternal(initialData.linkEksternal || initialData.link_eksternal || "");
      setIsPublished(initialData.isPublished ?? initialData.is_published ?? true);

      const currentLinkedTask = availableTasks.find(
        (t) => t.pertemuan_id === initialData.id || (initialData.tugas && initialData.tugas.some((it: any) => it.id === t.id))
      );
      setSelectedTaskId(currentLinkedTask ? currentLinkedTask.id : "none");
      setSelectedFile(null);
    } else {
      setPertemuanKe(suggestedPertemuanKe);
      setJudul("");
      setDeskripsi("");
      setTanggal(new Date().toISOString().split("T")[0]);
      setVideoUrl("");
      setLinkEksternal("");
      setIsPublished(true);
      setSelectedTaskId("none");
      setSelectedFile(null);
    }
  }, [initialData, isOpen, suggestedPertemuanKe, availableTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim()) {
      toast.error("Judul pertemuan wajib diisi.");
      return;
    }
    if (!tanggal) {
      toast.error("Tanggal pertemuan wajib ditentukan.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("kelas_id", kelasId);
      formData.append("mapel_id", mapelId);
      formData.append("pertemuan_ke", pertemuanKe.toString());
      formData.append("judul", judul.trim());
      formData.append("deskripsi", deskripsi.trim());
      formData.append("tanggal", tanggal);
      formData.append("video_url", videoUrl.trim());
      formData.append("link_eksternal", linkEksternal.trim());
      formData.append("is_published", isPublished ? "true" : "false");
      formData.append("tugas_id", selectedTaskId);

      if (selectedFile) {
        formData.append("file_materi", selectedFile);
      }

      let res;
      if (isEdit && initialData?.id) {
        res = await updatePertemuanAction(initialData.id.toString(), formData);
      } else {
        res = await createPertemuanAction(formData);
      }

      if (res.success) {
        toast.success(res.message || "Pertemuan berhasil disimpan!");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Gagal menyimpan pertemuan.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-xl border border-border">
        {/* Header */}
        <DialogHeader className="space-y-1 pb-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <BookOpen className="h-4 w-4" />
            </span>
            <DialogTitle className="text-lg font-bold text-foreground">
              {isEdit ? `Edit Pertemuan ${pertemuanKe}` : "Tambah Pertemuan Baru"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Atur materi KBM, berkas modul pembelajaran, dan tugas pendukung.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Baris 1: Pertemuan, Tanggal, & Status Publikasi */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">
                Pertemuan Ke-
              </Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={pertemuanKe}
                onChange={(e) => setPertemuanKe(parseInt(e.target.value) || 1)}
                className="h-8.5 text-center font-bold text-sm rounded-xl"
                required
              />
            </div>

            <div className="sm:col-span-5 space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">
                Tanggal KBM
              </Label>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="h-8.5 rounded-xl text-xs"
                required
              />
            </div>

            <div className="sm:col-span-4 space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">
                Status Publikasi
              </Label>
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`w-full h-8.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${isPublished
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/15"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/15"
                  }`}
                title={isPublished ? "Siswa dapat melihat materi" : "Hanya guru yang dapat melihat (Draft)"}
              >
                {isPublished ? (
                  <>
                    <Eye className="h-3.5 w-3.5 shrink-0" />
                    <span>Terbit (Siswa)</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5 shrink-0" />
                    <span>Draft (Guru)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Judul Pertemuan */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-muted-foreground">
              Judul Pokok Bahasan / Materi <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Contoh: Bab 1 - Mengenal Bilangan Bulat & Operasi Hitung"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="h-8.5 rounded-xl text-xs sm:text-sm"
              required
            />
          </div>

          {/* Catatan / Arahan Belajar */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-muted-foreground">
              Catatan / Ringkasan Materi <span className="text-[10px] text-muted-foreground/70 font-normal">(Opsional)</span>
            </Label>
            <Textarea
              placeholder="Tuliskan poin penting materi, arahan belajar santri, dsb..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={2}
              className="rounded-xl text-xs resize-y min-h-[56px] leading-relaxed py-2"
            />
          </div>

          {/* Upload Berkas Materi (Opsional) */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-muted-foreground">
              Berkas Modul / Materi <span className="text-[10px] text-muted-foreground/70 font-normal">(PDF, PPTX, Docx, Video maks. 35MB)</span>
            </Label>
            <input
              id="file-materi-input"
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.mp4,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
            />

            {selectedFile ? (
              <div className="flex items-center justify-between bg-muted/30 border border-primary/30 p-2 px-3 rounded-xl">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">{selectedFile.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : initialData?.fileName ? (
              <div className="flex items-center justify-between bg-muted/30 border border-emerald-500/30 p-2 px-3 rounded-xl">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">{initialData.fileName}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">(Tersimpan)</span>
                </div>
                <label htmlFor="file-materi-input">
                  <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px] rounded-lg pointer-events-none">
                    Ganti
                  </Button>
                </label>
              </div>
            ) : (
              <label
                htmlFor="file-materi-input"
                className="flex items-center justify-center gap-2 cursor-pointer py-2 px-3 rounded-xl border border-dashed border-border hover:border-primary/50 bg-muted/15 hover:bg-muted/30 transition-all text-muted-foreground hover:text-foreground"
              >
                <Upload className="h-4 w-4 text-primary/70 shrink-0" />
                <span className="text-xs font-medium">Klik untuk unggah dokumen materi</span>
              </label>
            )}
          </div>

          {/* Media Tambahan: Video & Tautan Web */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Video className="h-3 w-3 text-red-500" />
                <span>Video YouTube</span>
              </Label>
              <Input
                placeholder="https://www.youtube.com/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="h-8.5 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <LinkIcon className="h-3 w-3 text-blue-500" />
                <span>Tautan Referensi</span>
              </Label>
              <Input
                placeholder="https://..."
                value={linkEksternal}
                onChange={(e) => setLinkEksternal(e.target.value)}
                className="h-8.5 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Tautkan Tugas */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <FileCheck className="h-3 w-3 text-primary" />
              <span>Tautkan Tugas Kelas (Opsional)</span>
            </Label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full h-8.5 px-3 text-xs bg-card border border-border rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary/40 text-foreground cursor-pointer"
            >
              <option value="none">-- Tidak ada tugas yang ditautkan --</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.judul}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Aksi */}
          <DialogFooter className="gap-2 sm:gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 px-4 text-xs font-semibold rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-9 px-5 text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span>{isEdit ? "Simpan Perubahan" : "Simpan Pertemuan"}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
