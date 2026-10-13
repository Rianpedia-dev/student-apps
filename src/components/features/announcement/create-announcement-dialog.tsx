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
import { Plus, Megaphone, Send, Loader2, Upload } from "lucide-react";
import { createAnnouncementAction } from "@/actions/admin";
import { toast } from "sonner";

interface CreateAnnouncementDialogProps {
  guruClass: string;
  trigger?: React.ReactNode;
}

export function CreateAnnouncementDialog({
  guruClass,
  trigger,
}: CreateAnnouncementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
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
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6 shadow-xl border border-border">
          <DialogHeader className="space-y-1.5 pb-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Megaphone className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Tulis Pengumuman Baru
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Publikasikan pengumuman untuk kelas {guruClass}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-1">
            <input type="hidden" name="from" value={guruClass} />

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">
                Judul Pengumuman <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Contoh: Tugas Proyek Sains Mandiri"
                required
                disabled={isSubmitting}
                className="focus-visible:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="file_upload" className="text-sm font-medium flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Upload Lampiran (PDF, JPG, PNG - Maks 2MB)</span>
              </Label>
              <Input
                id="file_upload"
                name="file_upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={isSubmitting}
                className="cursor-pointer file:text-emerald-700 dark:file:text-emerald-400 file:font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">
                Opsional. Maksimal ukuran berkas 2MB.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pengumuman" className="text-sm font-medium">
                Isi Pengumuman <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="pengumuman"
                name="pengumuman"
                placeholder="Tulis detail informasi atau instruksi di sini..."
                rows={6}
                required
                disabled={isSubmitting}
                className="focus-visible:ring-emerald-500"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menerbitkan...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Terbitkan ke Kelas</span>
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
