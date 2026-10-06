"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Megaphone, Save, Loader2 } from "lucide-react";
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
  };
  classes?: Array<{ id: string; nama_kelas: string }>;
  isGuru?: boolean;
  defaultGuruFrom?: string;
  backHref: string;
  redirectHref: string;
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
      if (res.success) {
        toast.success(res.message || "Pengumuman berhasil diperbarui.");
        router.push(redirectHref);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui pengumuman.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Pengumuman
        </Link>
      </div>

      <Card className="border-emerald-500/20 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-emerald-600" />
            <CardTitle>{isGuru ? "Edit Pengumuman Kelas" : "Edit Pengumuman"}</CardTitle>
          </div>
          <CardDescription>
            {isGuru
              ? "Perbarui judul, lampiran, atau instruksi pengumuman kelas Anda."
              : "Perbarui isi, sasaran, atau lampiran pengumuman yang telah terbit."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isGuru && (
              <input
                type="hidden"
                name="from"
                value={announcement.from || defaultGuruFrom}
              />
            )}

            <div className="space-y-1.5">
              <Label htmlFor="title">Judul Pengumuman</Label>
              <Input
                id="title"
                name="title"
                defaultValue={announcement.title}
                required
              />
            </div>

            <div className={`grid grid-cols-1 ${!isGuru ? "sm:grid-cols-2" : ""} gap-4`}>
              {!isGuru && (
                <div className="space-y-1.5">
                  <Label htmlFor="from">Pengirim / Sasaran</Label>
                  <select
                    id="from"
                    name="from"
                    defaultValue={announcement.from || "IT"}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    required
                  >
                    <option value="IT">Tim IT / Sekolah (Semua Pengguna)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.nama_kelas}>
                        {c.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="file_upload">Upload File Baru (PDF / JPG / PNG)</Label>
                <Input
                  id="file_upload"
                  name="file_upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="cursor-pointer file:text-emerald-700 file:font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="file">Atau Link URL Lampiran</Label>
              <Input
                id="file"
                name="file"
                defaultValue={announcement.file || ""}
                placeholder="https://... atau /uploads/file.pdf"
              />
            </div>

            {announcement.file && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground font-medium">Lampiran Saat Ini:</Label>
                <AnnouncementAttachment
                  fileUrl={announcement.file}
                  title={announcement.title}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="pengumuman">Konten Pengumuman</Label>
              <Textarea
                id="pengumuman"
                name="pengumuman"
                defaultValue={announcement.pengumuman}
                rows={8}
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="lg" disabled={isSubmitting} className="gap-2">
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
