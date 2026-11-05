"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Megaphone,
  Edit,
  Building2,
  School,
  UserCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/ui/like-button";
import { AnnouncementAttachment } from "@/components/shared/announcement-attachment";
import {
  CreateAnnouncementDialog,
  ClassItemOption,
} from "@/components/features/announcement/create-announcement-dialog";
import { DeleteAnnouncementButton } from "@/components/features/announcement/delete-announcement-button";
import { toggleLikeAnnouncementAction } from "@/actions/siswa";
import { formatDateIndo, cn } from "@/lib/utils";
import { toast } from "sonner";

export interface AnnouncementItem {
  id: string;
  title: string;
  from: string | null;
  file: string | null;
  pengumuman: string;
  like?: string | null;
  isLiked?: boolean;
  jenjang?: string | null;
  target_role?: string | null;
  target_kelas?: string | null;
  created_at: string | Date | null;
}

interface UnifiedAnnouncementItem extends AnnouncementItem {
  type: "official" | "my_class";
  canManage: boolean;
}

interface GuruAnnouncementsClientProps {
  officialAnnouncements: AnnouncementItem[];
  myClassAnnouncements: AnnouncementItem[];
  guruName: string;
  guruClass?: string | null;
  isWaliKelas: boolean;
  guruJenjang?: string | null;
  classesTaught: string[];
  allClasses: ClassItemOption[];
}

export function GuruAnnouncementsClient({
  officialAnnouncements: initialOfficial,
  myClassAnnouncements: initialClass,
  guruName,
  guruClass,
  isWaliKelas,
  guruJenjang,
  classesTaught,
  allClasses,
}: GuruAnnouncementsClientProps) {
  // State Likes untuk seluruh item
  const [itemsState, setItemsState] = useState<Record<string, { like: string; isLiked: boolean }>>(() => {
    const map: Record<string, { like: string; isLiked: boolean }> = {};
    initialOfficial.forEach((item) => {
      map[item.id] = { like: item.like || "0", isLiked: Boolean(item.isLiked) };
    });
    initialClass.forEach((item) => {
      map[item.id] = { like: item.like || "0", isLiked: Boolean(item.isLiked) };
    });
    return map;
  });

  // Gabungkan seluruh pengumuman sekolah & kelas ke dalam satu daftar terpadu
  const combinedList = useMemo(() => {
    const list: UnifiedAnnouncementItem[] = [];
    const seenIds = new Set<string>();

    // 1. Pengumuman Resmi Sekolah
    initialOfficial.forEach((item) => {
      seenIds.add(item.id);
      list.push({
        ...item,
        type: "official",
        canManage: item.from === guruName,
      });
    });

    // 2. Pengumuman Kelas / Guru
    initialClass.forEach((item) => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        list.push({
          ...item,
          type: "my_class",
          canManage: true,
        });
      }
    });

    // Urutkan berdasarkan tanggal terbaru (atau ID terbesar)
    return list.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return parseInt(b.id, 10) - parseInt(a.id, 10);
    });
  }, [initialOfficial, initialClass, guruName]);

  const handleLike = async (id: string) => {
    const current = itemsState[id] || { like: "0", isLiked: false };
    const wasLiked = current.isLiked;
    const count = parseInt(current.like || "0", 10) || 0;
    const optimisticCount = wasLiked ? Math.max(0, count - 1) : count + 1;

    setItemsState((prev) => ({
      ...prev,
      [id]: { like: String(optimisticCount), isLiked: !wasLiked },
    }));

    try {
      const res = await toggleLikeAnnouncementAction(id);
      if (res?.success) {
        setItemsState((prev) => ({
          ...prev,
          [id]: { like: String(res.count), isLiked: res.liked },
        }));
      } else {
        setItemsState((prev) => ({
          ...prev,
          [id]: { like: String(count), isLiked: wasLiked },
        }));
        toast.error(res?.error || "Gagal memperbarui suka.");
      }
    } catch {
      setItemsState((prev) => ({
        ...prev,
        [id]: { like: String(count), isLiked: wasLiked },
      }));
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Header Bersih & Tombol Buat Pengumuman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Megaphone className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Manajemen Pengumuman
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Akses surat edaran resmi sekolah dan publikasikan pengumuman ke siswa Anda.
          </p>
        </div>

        <CreateAnnouncementDialog
          guruClass={guruClass}
          guruName={guruName}
          isWaliKelas={isWaliKelas}
          guruJenjang={guruJenjang}
          classesTaught={classesTaught}
          allClasses={allClasses}
        />
      </div>

      {/* 2. Daftar Kartu Pengumuman Terpadu (Semua Jenis Tampil Sekaligus) */}
      <div className="space-y-4">
        {combinedList.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/20 rounded-2xl">
            <CardContent className="p-8 sm:p-10 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <div className="p-3.5 rounded-2xl bg-muted text-muted-foreground">
                <Megaphone className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-base">
                  Belum Ada Pengumuman
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Belum ada pengumuman resmi sekolah maupun pengumuman kelas yang tersedia.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {combinedList.map((item) => {
              const currentLikeState = itemsState[item.id] || {
                like: item.like || "0",
                isLiked: Boolean(item.isLiked),
              };

              return (
                <Card
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "relative overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between rounded-2xl border",
                    item.type === "official"
                      ? "border-l-4 border-l-indigo-600 border-border/80"
                      : "border-l-4 border-l-emerald-600 border-border/80"
                  )}
                >
                  <CardContent className="p-4 sm:p-5 space-y-3 flex flex-col flex-1">
                    {/* Header Card Meta: Keterangan Badge & Aksi */}
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-border/40">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs text-muted-foreground">
                        {/* Keterangan Badge: Membedakan tipe pengumuman */}
                        {item.type === "official" ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 gap-1 py-0.5"
                          >
                            <Building2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                            <span>Pengumuman Sekolah</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1 py-0.5"
                          >
                            <School className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span>
                              {item.target_kelas
                                ? `Kelas ${item.target_kelas}`
                                : isWaliKelas
                                ? "Pengumuman Kelas"
                                : "Pengumuman Saya"}
                            </span>
                          </Badge>
                        )}

                        {item.jenjang && item.jenjang !== "ALL" && (
                          <Badge variant="outline" size="sm" className="font-bold text-[10px]">
                            {item.jenjang}
                          </Badge>
                        )}

                        {item.target_role === "GURU" && (
                          <Badge variant="purple" size="sm" className="text-[10px]">
                            Khusus Guru
                          </Badge>
                        )}

                        <span className="font-semibold text-foreground/85">
                          {item.from || (item.type === "official" ? "Pihak Sekolah" : guruName)}
                        </span>

                        {item.created_at && (
                          <>
                            <span>•</span>
                            <span>{formatDateIndo(item.created_at)}</span>
                          </>
                        )}
                      </div>

                      {/* Tombol aksi: Edit dan Hapus jika pengumuman ini dibuat oleh guru */}
                      {item.canManage && (
                        <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">
                          <Link href={`/guru/announcements/${item.id}`}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-7 w-7 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                              title="Edit pengumuman ini"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <DeleteAnnouncementButton id={item.id} />
                        </div>
                      )}
                    </div>

                    {/* Judul */}
                    <h3 className="font-bold text-base text-foreground tracking-tight leading-snug">
                      {item.title}
                    </h3>

                    {/* Lampiran Dokumen/Gambar jika ada */}
                    {item.file && (
                      <div className="w-full">
                        <AnnouncementAttachment
                          fileUrl={item.file}
                          title={item.title}
                          compact={true}
                        />
                      </div>
                    )}

                    {/* Isi Pengumuman */}
                    <div
                      className="text-xs sm:text-sm text-foreground/85 leading-relaxed prose dark:prose-invert max-w-none break-words flex-1 pt-1"
                      dangerouslySetInnerHTML={{ __html: item.pengumuman }}
                    />

                    {/* Footer: Tombol Suka & Info Pengirim */}
                    <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                      <LikeButton
                        liked={Boolean(currentLikeState.isLiked)}
                        count={parseInt(currentLikeState.like || "0", 10) || 0}
                        onLikeToggle={() => handleLike(item.id)}
                      />
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{item.from || (item.type === "official" ? "Pihak Sekolah" : guruName)}</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
