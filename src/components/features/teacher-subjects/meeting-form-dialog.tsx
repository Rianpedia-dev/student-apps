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
  X,
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

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("kelas_id", kelasId);
      formData.append("mapel_id", mapelId);
      formData.append("pertemuan_ke", pertemuanKe.toString());
      formData.append("judul", judul.trim());
      formData.append("deskripsi", deskripsi.trim());
      formData.append("tanggal", tanggal || new Date().toISOString().split("T")[0]);
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
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto scrollbar-hide rounded-3xl p-5 sm:p-6 shadow-2xl border border-border">
        {/* Header */}
        <DialogHeader className="space-y-1 pb-3 border-b border-border/60">
          <div>
            <DialogTitle className="text-lg font-bold text-foreground">
              {isEdit ? `Edit Pertemuan ${pertemuanKe}` : "Tambah Pertemuan Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Kelola materi pembelajaran dan modul siswa.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {/* Baris 1: Pertemuan & Status Publikasi */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4 space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Pertemuan Ke
              </Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={pertemuanKe}
                onChange={(e) => setPertemuanKe(parseInt(e.target.value) || 1)}
                className="h-9.5 text-center font-bold text-sm rounded-xl bg-background border-border"
                required
              />
            </div>

            <div className="sm:col-span-8 space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Status Materi
              </Label>
              <div className="grid grid-cols-2 p-1 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border/60 h-9.5 gap-1 items-center">
                <button
                  type="button"
                  onClick={() => setIsPublished(false)}
                  className={`h-7.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !isPublished
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs border border-amber-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <EyeOff className="h-3.5 w-3.5 shrink-0" />
                  <span>Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublished(true)}
                  className={`h-7.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isPublished
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span>Terbitkan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Judul Pertemuan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Judul Materi <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Contoh: Bab 1 - Mengenal Bilangan Bulat"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="h-9.5 rounded-xl text-xs sm:text-sm bg-background border-border"
              required
            />
          </div>

          {/* Catatan / Arahan Belajar */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Ringkasan Materi</span>
              <span className="text-[11px] text-muted-foreground font-normal">Opsional</span>
            </Label>
            <Textarea
              placeholder="Tuliskan arahan belajar atau poin penting materi..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={2}
              className="rounded-xl text-xs resize-y min-h-[56px] leading-relaxed py-2 bg-background border-border"
            />
          </div>

          {/* Upload Berkas Modul */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Lampiran Modul</span>
              <span className="text-[11px] text-muted-foreground font-normal">Opsional</span>
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
              <div className="flex items-center justify-between bg-muted/40 border border-primary/40 p-2.5 px-3.5 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg shrink-0 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : initialData?.fileName ? (
              <div className="flex items-center justify-between bg-muted/40 border border-emerald-500/30 p-2.5 px-3.5 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{initialData.fileName}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Berkas tersimpan</p>
                  </div>
                </div>
                <label htmlFor="file-materi-input">
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2.5 text-xs rounded-lg pointer-events-none">
                    Ganti
                  </Button>
                </label>
              </div>
            ) : (
              <label
                htmlFor="file-materi-input"
                className="flex items-center justify-center gap-2.5 cursor-pointer py-2.5 px-4 rounded-xl border border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 transition-all text-muted-foreground hover:text-foreground group"
              >
                <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <span className="text-xs font-medium">
                  Unggah berkas PDF, Word, PPT, atau Video <span className="text-muted-foreground/70">(maks. 35MB)</span>
                </span>
              </label>
            )}
          </div>

          {/* Media Tambahan: Video & Tautan Web */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span>Video YouTube</span>
              </Label>
              <Input
                placeholder="https://www.youtube.com/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="h-9.5 rounded-xl text-xs bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                <span>Tautan Referensi</span>
              </Label>
              <Input
                placeholder="https://..."
                value={linkEksternal}
                onChange={(e) => setLinkEksternal(e.target.value)}
                className="h-9.5 rounded-xl text-xs bg-background border-border"
              />
            </div>
          </div>

          {/* Tautkan Tugas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Tautkan Tugas Kelas</span>
            </Label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full h-9.5 px-3 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/30 text-foreground cursor-pointer"
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
          <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 px-4 text-xs font-semibold rounded-xl border-border/80 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-9 px-5 text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEdit ? "Simpan Perubahan" : "Simpan Pertemuan"}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
