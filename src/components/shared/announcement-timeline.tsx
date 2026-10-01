"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Megaphone, Trash2, Edit, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/ui/like-button";
import { formatDateIndo } from "@/lib/utils";
import { deleteAnnouncementAction } from "@/actions/admin";
import { toggleLikeAnnouncementAction } from "@/actions/siswa";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlAzharCornerMosaic } from "@/components/shared/alazhar-patterns";
import { AnnouncementAttachment } from "@/components/shared/announcement-attachment";

export interface AnnouncementData {
  id: string;
  from?: string | null;
  title: string;
  file?: string | null;
  pengumuman: string;
  like?: string | null;
  isLiked?: boolean;
  created_at?: Date | string | null;
}

interface AnnouncementTimelineProps {
  announcements: AnnouncementData[];
  userRole: "admin" | "guru" | "siswa";
  canManage?: boolean;
}

export function AnnouncementTimeline({
  announcements,
  userRole,
  canManage = false,
}: AnnouncementTimelineProps) {
  const [items, setItems] = useState<AnnouncementData[]>(announcements);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setItems(announcements);
  }, [announcements]);

  const handleLike = async (id: string) => {
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) return;

    const wasLiked = Boolean(currentItem.isLiked);
    const currentCount = parseInt(currentItem.like || "0", 10) || 0;
    const optimisticCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, like: String(optimisticCount), isLiked: !wasLiked }
          : item
      )
    );

    try {
      const res = await toggleLikeAnnouncementAction(id);
      if (res.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, like: String(res.count), isLiked: res.liked }
              : item
          )
        );
      } else {
        // Revert on error
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, like: String(currentCount), isLiked: wasLiked }
              : item
          )
        );
        toast.error(res.error || "Gagal memperbarui suka");
      }
    } catch {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, like: String(currentCount), isLiked: wasLiked }
            : item
        )
      );
      toast.error("Terjadi kesalahan");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteAnnouncementAction(deleteId);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item.id !== deleteId));
        toast.success(res.message);
      } else {
        toast.error("Gagal menghapus pengumuman");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (!items || items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-sm">Belum ada pengumuman.</p>
          <p className="text-xs mt-1 text-muted-foreground">Pengumuman terbaru dari sekolah akan ditampilkan di sini.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="relative overflow-hidden rounded-xl border-l-4 border-l-primary transition-all duration-200 hover:shadow-md">
          {/* Al-Azhar Triangular Prism Mosaic Accent */}
          <AlAzharCornerMosaic className="absolute top-0 right-0 w-24 sm:w-28 h-14 pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity select-none" />
          <CardContent className="p-4 sm:p-5.5 relative z-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={
                    item.from?.toLowerCase().includes("kepala")
                      ? "indigo"
                      : item.from?.toLowerCase().includes("admin")
                      ? "purple"
                      : item.from?.toLowerCase().includes("kurikulum")
                      ? "teal"
                      : item.from?.toLowerCase().includes("kesiswaan")
                      ? "orange"
                      : item.from?.toLowerCase().includes("wali")
                      ? "sky"
                      : "emerald"
                  }
                  size="sm"
                >
                  {item.from || "Pengumuman"}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>{formatDateIndo(item.created_at)}</span>
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <Link href={`/${userRole}/announcements/${item.id}`}>
                    <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-destructive hover:bg-destructive/15 hover:text-destructive"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <h3 className="mt-2.5 text-base sm:text-lg font-bold tracking-tight text-foreground">
              {item.title}
            </h3>

            {/* Lampiran file (Gambar / PDF / Dokumen) */}
            {item.file && (
              <AnnouncementAttachment
                fileUrl={item.file}
                title={item.title}
              />
            )}

            {/* Konten Pengumuman (berada di bawah gambar/lampiran) */}
            <div
              className="prose dark:prose-invert mt-3 max-w-none text-sm text-foreground/85 leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: item.pengumuman }}
            />

            {/* Like Counter & Action - Di sebelah kanan */}
            <div className="mt-3.5 flex items-center justify-end border-t border-border/60 pt-2.5">
              <LikeButton
                id={`heart-${item.id}`}
                liked={Boolean(item.isLiked)}
                count={parseInt(item.like || "0", 10)}
                text="Likes"
                onLikeToggle={() => handleLike(item.id)}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Pengumuman</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
