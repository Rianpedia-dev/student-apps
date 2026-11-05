"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Megaphone, Send, Loader2, Upload, School, UserCheck } from "lucide-react";
import { createAnnouncementAction } from "@/actions/admin";
import { toast } from "sonner";

export interface ClassItemOption {
  id: string;
  nama_kelas: string;
  jenjang?: string;
}

interface CreateAnnouncementDialogProps {
  guruClass?: string | null;
  guruName?: string;
  isWaliKelas?: boolean;
  guruJenjang?: string | null;
  classesTaught?: string[];
  allClasses?: ClassItemOption[];
  trigger?: React.ReactNode;
}

export function CreateAnnouncementDialog({
  guruClass,
  guruName = "Guru",
  isWaliKelas = false,
  guruJenjang,
  classesTaught = [],
  allClasses = [],
  trigger,
}: CreateAnnouncementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // Opsi kelas yang dapat dipilih oleh guru
  const availableClasses: string[] = React.useMemo(() => {
    const set = new Set<string>();
    if (guruClass) {
      set.add(guruClass);
    }
    classesTaught.forEach((c) => {
      if (c) set.add(c);
    });
    if (set.size === 0 && allClasses.length > 0) {
      allClasses.forEach((c) => set.add(c.nama_kelas));
    }
    return Array.from(set).sort();
  }, [guruClass, classesTaught, allClasses]);

  const [selectedTargetKelas, setSelectedTargetKelas] = useState<string>(
    guruClass || (availableClasses.length > 0 ? availableClasses[0] : "")
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Pastikan target_kelas terisi
      if (!formData.get("target_kelas")) {
        formData.set("target_kelas", selectedTargetKelas || guruClass || "");
      }
      
      // Jika guru tidak memilih pengirim kustom, gunakan nama guru
      if (!formData.get("from")) {
        formData.set("from", guruName || guruClass || "Guru");
      }

      const res = await createAnnouncementAction(formData);

      if (res?.success) {
        toast.success(res.message || "Pengumuman berhasil diterbitkan.");
        setIsOpen(false);
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(res?.error || "Gagal menerbitkan pengumuman.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Pengumuman</span>
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl border border-border/80">
          <DialogHeader className="space-y-1.5 pb-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <span className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Megaphone className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                  Publikasikan Pengumuman Baru
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Pengumuman akan langsung tampil pada dashboard siswa di kelas sasaran.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Input Tersembunyi untuk Keamanan & Routing Jenjang */}
            <input type="hidden" name="target_role" value="SISWA" />
            <input
              type="hidden"
              name="jenjang"
              value={guruJenjang && guruJenjang !== "ALL" ? guruJenjang : "ALL"}
            />

            {/* Baris 1: Sasaran Kelas & Identitas Pengirim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="target_kelas" className="text-sm font-medium flex items-center gap-1.5">
                  <School className="h-4 w-4 text-emerald-600" />
                  <span>Kelas Sasaran</span>
                  <span className="text-rose-500">*</span>
                </Label>
                {availableClasses.length > 1 ? (
                  <select
                    id="target_kelas"
                    name="target_kelas"
                    value={selectedTargetKelas}
                    onChange={(e) => setSelectedTargetKelas(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 py-2 rounded-lg border border-input bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors shadow-xs"
                  >
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} {isWaliKelas && cls === guruClass ? "★ (Kelas Binaan Anda)" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      type="hidden"
                      name="target_kelas"
                      value={selectedTargetKelas || guruClass || ""}
                    />
                    <div className="h-10 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                      <span>{selectedTargetKelas || guruClass || "Semua Kelas Binaan"}</span>
                      {isWaliKelas && (
                        <span className="text-[11px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                          Wali Kelas
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {isWaliKelas
                    ? "Pengumuman dapat ditujukan ke kelas binaan atau kelas yang Anda ajar."
                    : "Pilih kelas sasaran yang Anda ajar sesuai jadwal mata pelajaran."}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="from" className="text-sm font-medium flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>Identitas Pengirim</span>
                </Label>
                <select
                  id="from"
                  name="from"
                  defaultValue={guruName}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 py-2 rounded-lg border border-input bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors shadow-xs"
                >
                  <option value={guruName}>{guruName} {isWaliKelas ? "(Wali Kelas)" : "(Guru Mapel)"}</option>
                  {guruClass && (
                    <option value={`Wali Kelas ${guruClass}`}>Wali Kelas {guruClass}</option>
                  )}
                  {guruClass && (
                    <option value={guruClass}>{guruClass}</option>
                  )}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Nama yang akan tercantum pada kartu pengumuman.
                </p>
              </div>
            </div>

            {/* Judul Pengumuman */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">
                Judul Pengumuman <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Contoh: Jadwal Penilaian Harian & Penyerahan Tugas Portofolio"
                required
                disabled={isSubmitting}
                className="h-10 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Berkas Lampiran */}
            <div className="space-y-1.5">
              <Label htmlFor="file_upload" className="text-sm font-medium flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Lampiran Dokumen / Gambar (Opsional)</span>
              </Label>
              <Input
                id="file_upload"
                name="file_upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                disabled={isSubmitting}
                className="h-10 cursor-pointer file:text-emerald-700 dark:file:text-emerald-400 file:font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">
                Format berkas yang didukung: PDF, JPG, PNG, WEBP (maksimal 2MB).
              </p>
            </div>

            {/* Konten Pengumuman */}
            <div className="space-y-1.5">
              <Label htmlFor="pengumuman" className="text-sm font-medium">
                Isi Pengumuman <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="pengumuman"
                name="pengumuman"
                placeholder="Tuliskan isi pengumuman lengkap di sini. Gunakan baris baru (Enter) untuk memisahkan paragraf secara rapi..."
                rows={6}
                required
                disabled={isSubmitting}
                className="focus-visible:ring-emerald-500 resize-y min-h-[120px]"
              />
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menerbitkan...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Terbitkan Pengumuman</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
