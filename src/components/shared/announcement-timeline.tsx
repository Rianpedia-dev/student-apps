"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone,
  Trash2,
  Edit,
  Calendar,
  ChevronDown,
  ChevronUp,
  VerifiedIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/ui/like-button";
import { formatDateIndo, getUserProfileImage, cn } from "@/lib/utils";
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
import { AnnouncementAttachment } from "@/components/shared/announcement-attachment";

export interface AnnouncementReply {
  authorName: string;
  authorHandle: string;
  authorImage: string;
  content: string;
  isVerified?: boolean;
  timestamp: string;
}

export interface AnnouncementData {
  id: string;
  from?: string | null;
  title: string;
  file?: string | null;
  pengumuman: string;
  like?: string | null;
  isLiked?: boolean;
  created_at?: Date | string | null;
  reply?: AnnouncementReply;
}

interface AnnouncementTimelineProps {
  announcements: AnnouncementData[];
  userRole: "admin" | "guru" | "siswa";
  canManage?: boolean;
  initialLimit?: number;
}

function getAuthorDetails(from?: string | null) {
  const raw = from && from.trim() ? from.trim() : "Kurikulum Al-Azhar Cairo";
  const lower = raw.toLowerCase();

  let handle = "alazhar_cairo";
  let badgeLabel = "Pengumuman Resmi";

  if (lower.includes("kurikulum")) {
    handle = "kurikulum_alazhar";
    badgeLabel = "Kurikulum";
  } else if (lower.includes("kepala")) {
    handle = "kepala_sekolah";
    badgeLabel = "Kepala Sekolah";
  } else if (lower.includes("kesiswaan")) {
    handle = "kesiswaan_alazhar";
    badgeLabel = "Kesiswaan";
  } else if (lower.includes("admin")) {
    handle = "admin_alazhar";
    badgeLabel = "Admin Sekolah";
  } else if (lower.includes("wali")) {
    handle = "wali_kelas";
    badgeLabel = "Wali Kelas";
  } else {
    badgeLabel = "Guru Pengajar";
    const clean = raw
      .replace(/^(ustadzah|ustadz|ibu|bapak|dra\.|dr\.|drs\.)\s*/i, "")
      .replace(/,\s*[a-z.\s]+$/i, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    if (lower.startsWith("ustadzah")) {
      handle = `ustadzah_${clean || "guru"}`;
    } else if (lower.startsWith("ustadz")) {
      handle = `ustadz_${clean || "guru"}`;
    } else {
      handle = clean ? `${clean}_guru` : "guru_alazhar";
    }
  }

  // Determine avatar
  let image = "/images/logo-alazhar-cairo.avif";
  const isFemale =
    lower.includes("ustadzah") ||
    lower.includes("fatimah") ||
    lower.includes("aisyah") ||
    lower.includes("zahra") ||
    lower.includes("salsabila") ||
    lower.includes("maryam") ||
    lower.includes("khadijah") ||
    lower.includes("nur") ||
    lower.includes("siti");

  const isMaleTeacher =
    lower.includes("ustadz") ||
    lower.includes("bapak") ||
    lower.includes("muhammad") ||
    lower.includes("ahmad");

  const isOfficialOrg =
    lower.includes("kurikulum") ||
    lower.includes("sekolah") ||
    lower.includes("admin") ||
    lower.includes("kesiswaan") ||
    lower.includes("al-azhar") ||
    lower.includes("tu ") ||
    lower.includes("tata usaha");

  if (isOfficialOrg) {
    image = "/images/logo-alazhar-cairo.avif";
  } else if (isFemale) {
    image = "/profil-default-perempuan.avif";
  } else if (isMaleTeacher) {
    image = "/profil-default-laki-laki.avif";
  } else {
    image = getUserProfileImage(null, null, raw);
  }

  return {
    name: raw,
    handle,
    image,
    badgeLabel,
    isVerified: true,
  };
}

export function AnnouncementTimeline({
  announcements,
  userRole,
  canManage = false,
  initialLimit = 3,
}: AnnouncementTimelineProps) {
  const [items, setItems] = useState<AnnouncementData[]>(announcements);
  const [showAll, setShowAll] = useState(false);
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
      <div className="w-full min-w-0 p-1.5 rounded-2xl relative isolate overflow-hidden bg-white/80 dark:bg-black/90 bg-gradient-to-br from-black/5 to-black/[0.02] dark:from-white/5 dark:to-white/[0.02] backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_8px_16px_rgb(0_0_0_/_0.08)] dark:shadow-[0_8px_16px_rgb(0_0_0_/_0.25)]">
        <div className="w-full p-8 rounded-xl bg-white/40 dark:bg-zinc-900/30 border border-black/[0.05] dark:border-white/[0.08] flex flex-col items-center justify-center text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-sm text-foreground">Belum ada pengumuman.</p>
          <p className="text-xs mt-1 text-muted-foreground">
            Pengumuman terbaru dari sekolah akan ditampilkan di sini.
          </p>
        </div>
      </div>
    );
  }

  const displayedItems = showAll ? items : items.slice(0, initialLimit);
  const remainingCount = Math.max(0, items.length - initialLimit);

  return (
    <div className="space-y-4">
      {displayedItems.map((item) => {
        const author = getAuthorDetails(item.from);

        return (
          <div
            key={item.id}
            className={cn(
              "w-full min-w-0 p-1.5 rounded-2xl relative isolate overflow-hidden group transition-all duration-300",
              "bg-white/80 dark:bg-black/90",
              "bg-gradient-to-br from-black/5 to-black/[0.02] dark:from-white/5 dark:to-white/[0.02]",
              "backdrop-blur-xl backdrop-saturate-[180%]",
              "border border-black/10 dark:border-white/10",
              "shadow-[0_8px_16px_rgb(0_0_0_/_0.08)] dark:shadow-[0_8px_16px_rgb(0_0_0_/_0.25)]",
              "hover:shadow-[0_12px_24px_rgb(0_0_0_/_0.12)] dark:hover:shadow-[0_12px_24px_rgb(0_0_0_/_0.35)]",
              "will-change-transform translate-z-0"
            )}
          >
            <div
              className={cn(
                "w-full p-4 sm:p-5 rounded-xl relative",
                "bg-white/40 dark:bg-zinc-900/30",
                "bg-gradient-to-br from-black/[0.03] to-transparent dark:from-white/[0.08] dark:to-transparent",
                "backdrop-blur-md backdrop-saturate-150",
                "border border-black/[0.05] dark:border-white/[0.08]",
                "text-black/90 dark:text-white",
                "shadow-xs",
                "will-change-transform translate-z-0",
                "before:absolute before:inset-0 before:bg-gradient-to-br before:from-black/[0.02] before:to-black/[0.01] dark:before:from-white/[0.03] dark:before:to-white/[0.01] before:opacity-0 before:transition-opacity before:pointer-events-none",
                "hover:before:opacity-100"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Author Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shadow-xs bg-white dark:bg-zinc-800 flex items-center justify-center p-0.5">
                    <img
                      src={author.image}
                      alt={author.name}
                      className="h-full w-full rounded-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "/images/logo-alazhar-cairo.avif";
                      }}
                    />
                  </div>
                </div>

                {/* Author Info & Actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="font-semibold text-sm sm:text-base text-black dark:text-white/90 hover:underline cursor-pointer truncate">
                        {author.name}
                      </span>
                      <VerifiedIcon className="h-4 w-4 text-blue-400 shrink-0" />
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
                        className="text-[10px] px-2 py-0.5 h-5 font-medium inline-flex"
                      >
                        {author.badgeLabel}
                      </Badge>
                    </div>

                    {/* Action buttons or Top-right icon */}
                    {canManage ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <Link href={`/${userRole}/announcements/${item.id}`}>
                          <button
                            type="button"
                            aria-label="Edit pengumuman"
                            className="h-8 w-8 text-black/70 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg p-1 flex items-center justify-center transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          type="button"
                          aria-label="Hapus pengumuman"
                          className="h-8 w-8 text-destructive hover:bg-destructive/15 rounded-lg p-1 flex items-center justify-center transition-colors"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-8 w-8 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg p-1 flex items-center justify-center shrink-0 transition-colors">
                        <Megaphone className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Body */}
              <div className="mt-3 space-y-2.5">
                <h3 className="font-bold text-base sm:text-lg text-black dark:text-white tracking-tight leading-snug">
                  {item.title}
                </h3>

                {/* Lampiran file (Gambar / PDF / Dokumen) */}
                {item.file && (
                  <AnnouncementAttachment
                    fileUrl={item.file}
                    title={item.title}
                  />
                )}

                {/* Konten Pengumuman (HTML) */}
                <div
                  className="prose dark:prose-invert max-w-none text-sm text-black/85 dark:text-white/85 leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: item.pengumuman }}
                />
              </div>

              {/* Footer / Interaction Bar */}
              <div className="mt-4 pt-3 flex items-center justify-between border-t border-black/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDateIndo(item.created_at)}</span>
                </div>

                <LikeButton
                  id={`heart-${item.id}`}
                  liked={Boolean(item.isLiked)}
                  count={parseInt(item.like || "0", 10)}
                  text="Likes"
                  onLikeToggle={() => handleLike(item.id)}
                />
              </div>

              {/* Reply Section (jika ada catatan balasan / klarifikasi) */}
              {item.reply && (
                <div className="mt-4 pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-muted/60">
                        <img
                          src={item.reply.authorImage}
                          alt={item.reply.authorName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-black dark:text-white/90 hover:underline cursor-pointer">
                          {item.reply.authorName}
                        </span>
                        {item.reply.isVerified && (
                          <VerifiedIcon className="h-4 w-4 text-blue-400 shrink-0" />
                        )}
                        {item.reply.authorHandle && (
                          <>
                            <span className="text-black/60 dark:text-white/60 text-sm">
                              @{item.reply.authorHandle}
                            </span>
                            <span className="text-black/60 dark:text-white/60 text-sm">
                              ·
                            </span>
                          </>
                        )}
                        <span className="text-black/60 dark:text-white/60 text-sm">
                          {item.reply.timestamp}
                        </span>
                      </div>
                      <p className="text-black/80 dark:text-white/80 text-sm mt-1">
                        {item.reply.content}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Tombol Lihat Pengumuman Sebelumnya */}
      {items.length > initialLimit && (
        <div className="pt-2 flex justify-center">
          {!showAll ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAll(true)}
              className="gap-2 px-5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/80 hover:bg-white dark:hover:bg-black text-foreground font-semibold text-xs sm:text-sm shadow-xs transition-all hover:scale-[1.01]"
            >
              <ChevronDown className="h-4 w-4 text-primary" />
              <span>Lihat Pengumuman Sebelumnya</span>
              <Badge
                variant="secondary"
                className="ml-1 text-[11px] px-2 py-0.5 font-bold"
              >
                +{remainingCount} Lainnya
              </Badge>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAll(false)}
              className="gap-1.5 px-4 py-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
            >
              <ChevronUp className="h-4 w-4" />
              <span>Sembunyikan Pengumuman Sebelumnya</span>
            </Button>
          )}
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Pengumuman</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
