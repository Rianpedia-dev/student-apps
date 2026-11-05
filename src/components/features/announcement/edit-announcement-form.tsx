"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Megaphone, Save, Loader2, Upload, School, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateAnnouncementAction } from "@/actions/admin";
import { AnnouncementAttachment } from "@/components/shared/announcement-attachment";
import { toast } from "sonner";

export interface EditAnnouncementFormProps {
  id: string;
  announcement: {
    id: string;
    title: string;
    from?: string | null;
    file?: string | null;
    pengumuman: string;
    jenjang?: string | null;
    target_role?: string | null;
    target_kelas?: string | null;
  };
  classes?: Array<{ id: string; nama_kelas: string; jenjang?: string }>;
  isGuru?: boolean;
  defaultGuruFrom?: string;
  backHref: string;
  redirectHref: string;
}

function htmlToPlainText(raw: string): string {
  if (!raw) return "";
  let text = raw;
  text = text.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "");
  text = text.replace(/<\/(div|h[1-6]|li)>/gi, "\n");
  text = text.replace(/<(div|h[1-6]|li)[^>]*>/gi, "");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

export function EditAnnouncementForm({
  id,
  announcement,
  classes = [],
  isGuru = false,
  defaultGuruFrom = "Guru",
  backHref,
  redirectHref,
}: EditAnnouncementFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await updateAnnouncementAction(id, formData);
      if (res?.success) {
        toast.success(res.message || "Pengumuman berhasil diperbarui.");
        router.push(redirectHref);
        router.refresh();
      } else {
        toast.error(res?.error || "Gagal memperbarui pengumuman.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Pengumuman
        </Link>
      </div>

      <Card className="border border-emerald-500/20 shadow-md">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-xl font-bold">
                {isGuru ? "Edit Pengumuman Kelas" : "Edit Pengumuman"}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                {isGuru
                  ? "Perbarui judul, kelas sasaran, berkas lampiran, atau instruksi pengumuman kelas Anda."
                  : "Perbarui isi, sasaran, atau lampiran pengumuman yang telah terbit."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Baris 1: Sasaran Kelas & Identitas Pengirim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="target_kelas" className="text-sm font-medium flex items-center gap-1.5">
                  <School className="h-4 w-4 text-emerald-600" />
                  <span>Kelas Sasaran</span>
                </Label>
                {classes.length > 0 ? (
                  <select
                    id="target_kelas"
                    name="target_kelas"
                    defaultValue={announcement.target_kelas || ""}
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 py-2 rounded-lg border border-input bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors shadow-xs"
                  >
                    <option value="">Semua Siswa Terkait</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.nama_kelas}>
                        {c.nama_kelas}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="target_kelas"
                    name="target_kelas"
                    defaultValue={announcement.target_kelas || defaultGuruFrom}
                    disabled={isSubmitting}
                    placeholder="Contoh: Kelas 7 - Khalid bin Walid"
                    className="h-10"
                  />
                )}
                <p className="text-[11px] text-muted-foreground">
                  Siswa di kelas ini akan melihat pengumuman di dashboard mereka.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="from" className="text-sm font-medium flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>Identitas Pengirim</span>
                </Label>
                <Input
                  id="from"
                  name="from"
                  defaultValue={announcement.from || defaultGuruFrom}
                  disabled={isSubmitting}
                  required
                  className="h-10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Nama identitas pengirim yang ditampilkan.
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
                defaultValue={announcement.title}
                required
                disabled={isSubmitting}
                className="h-10 focus-visible:ring-emerald-500"
              />
            </div>

            {/* File Upload Baru */}
            <div className="space-y-1.5">
              <Label htmlFor="file_upload" className="text-sm font-medium flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Ganti Berkas Lampiran (Opsional)</span>
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
                Kosongkan jika tidak ingin mengubah berkas terlampir. Maksimal 2MB.
              </p>
            </div>

            {/* Hidden field for existing file URL */}
            <input type="hidden" name="file" defaultValue={announcement.file || ""} />

            {/* Preview Lampiran Saat Ini */}
            {announcement.file && (
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/60">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Lampiran Saat Ini Terpasang:
                </Label>
                <AnnouncementAttachment
                  fileUrl={announcement.file}
                  title={announcement.title}
                />
              </div>
            )}

            {/* Isi Konten Pengumuman (Plain text format - No raw HTML tags) */}
            <div className="space-y-1.5">
              <Label htmlFor="pengumuman" className="text-sm font-medium">
                Isi Konten Pengumuman <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="pengumuman"
                name="pengumuman"
                defaultValue={htmlToPlainText(announcement.pengumuman)}
                rows={9}
                required
                disabled={isSubmitting}
                placeholder="Tuliskan isi pengumuman lengkap di sini..."
                className="focus-visible:ring-emerald-500 resize-y min-h-[160px] leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground">
                Mendukung teks terformat & baris baru secara otomatis.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-border/50">
              <Link href={backHref} className="w-full sm:w-auto">
                <Button type="button" variant="outline" disabled={isSubmitting} className="w-full sm:w-auto">
                  Batal
                </Button>
              </Link>
              <Button
                type="submit"
                size="default"
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
