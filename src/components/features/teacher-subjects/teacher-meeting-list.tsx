"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Copy,
  FileText,
  Video,
  Link as LinkIcon,
  FileCheck,
  Eye,
  ExternalLink,
  Sparkles,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MeetingFormDialog } from "./meeting-form-dialog";
import { CopyMeetingDialog } from "./copy-meeting-dialog";
import { deletePertemuanAction, togglePublishPertemuanAction } from "@/actions/pertemuan";
import { InBrowserDocViewer } from "@/components/features/assignment/in-browser-doc-viewer";

interface TeacherMeetingListProps {
  mapel: {
    id: string;
    kodeMapel: string;
    namaMapel: string;
    warna?: string | null;
  };
  currentKelas: {
    id: string;
    namaKelas: string;
    jenjang: string;
  };
  allAssignedClasses: Array<{
    id: string;
    namaKelas: string;
    jenjang: string;
  }>;
  meetings: Array<{
    id: string;
    kelasId: string;
    mapelId: string;
    guruId: string;
    guruName?: string;
    pertemuanKe: number;
    judul: string;
    deskripsi?: string | null;
    tanggal: string;
    fileUrl?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    fileType?: string | null;
    videoUrl?: string | null;
    linkEksternal?: string | null;
    isPublished: boolean;
    tugas: Array<{
      id: string;
      judul: string;
      deadline: string;
    }>;
  }>;
  availableTasks: Array<{
    id: string;
    judul: string;
    pertemuan_id?: string | null;
  }>;
}

export function TeacherMeetingList({
  mapel,
  currentKelas,
  allAssignedClasses,
  meetings,
  availableTasks,
}: TeacherMeetingListProps) {
  const router = useRouter();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any | null>(null);

  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [meetingToCopy, setMeetingToCopy] = useState<any | null>(null);

  // In-browser doc viewer
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);

  // Filter & stats
  const publishedCount = meetings.filter((m) => m.isPublished).length;
  const draftCount = meetings.filter((m) => !m.isPublished).length;

  const handleEdit = (meeting: any) => {
    setEditingMeeting(meeting);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingMeeting(null);
    setIsFormOpen(true);
  };

  const handleOpenCopy = (meeting: any) => {
    setMeetingToCopy(meeting);
    setIsCopyOpen(true);
  };

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleTogglePublish = async (meetingId: string) => {
    setTogglingId(meetingId);
    try {
      const res = await togglePublishPertemuanAction(meetingId);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengubah status publikasi.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (meetingId: string, pertemuanKe: number) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Pertemuan ${pertemuanKe}? Tugas yang terhubung tidak akan terhapus.`)) {
      return;
    }

    try {
      const res = await deletePertemuanAction(meetingId);
      if (res.success) {
        toast.success(res.message || "Pertemuan berhasil dihapus.");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus pertemuan.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-3xl bg-card border border-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="purple" size="sm" className="font-bold font-mono uppercase">
              {mapel.kodeMapel}
            </Badge>
            <Badge variant={currentKelas.jenjang === "SMP" ? "smp" : "amber"} size="sm">
              {currentKelas.namaKelas} ({currentKelas.jenjang})
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Kelola Pertemuan & Modul: {mapel.namaMapel}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Total {meetings.length} Pertemuan • {publishedCount} Terbit untuk Siswa • {draftCount} Draf Guru
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={handleCreate}
            className="h-10 text-xs font-bold gap-2 rounded-2xl bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pertemuan Baru</span>
          </Button>
        </div>
      </div>

      {/* Class Switcher if teacher has multiple classes for this subject */}
      {allAssignedClasses.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1.5 mr-1">
            <School className="h-4 w-4 text-primary" />
            <span>Pilih Kelas:</span>
          </span>
          {allAssignedClasses.map((cls) => {
            const isActive = cls.id === currentKelas.id;
            return (
              <Button
                key={cls.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => router.push(`/guru/mapel/${mapel.id}?kelasId=${cls.id}`)}
                className={`h-8 text-xs font-bold rounded-xl shrink-0 ${isActive ? "bg-primary text-primary-foreground" : "hover:border-primary/40"
                  }`}
              >
                {cls.namaKelas}
              </Button>
            );
          })}
        </div>
      )}

      {/* Meeting Table */}
      {meetings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <BookOpen className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              Belum Ada Pertemuan Pembelajaran untuk {currentKelas.namaKelas}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mulai susun modul KBM per pekan untuk rombel ini. Unggah ringkasan materi, slide PPT, video penunjang, dan tautkan tugas mingguan.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            size="sm"
            className="h-9 text-xs font-bold gap-2 rounded-xl bg-primary text-primary-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Buat Pertemuan 1 Sekarang</span>
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Card-Based Timeline Layout */}
          {/* Timeline Connector Line */}
          <div
            className="absolute left-[39px] top-8 bottom-8 w-px hidden md:block"
            style={{
              background: "linear-gradient(180deg, var(--color-primary) 0%, var(--color-border) 40%, var(--color-border) 60%, transparent 100%)",
            }}
          />

          <div className="space-y-4">
            {meetings.map((meeting, idx) => {
              const dateFormatted = new Date(meeting.tanggal).toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              const hasFile = !!meeting.fileUrl;
              const hasVideo = !!meeting.videoUrl;
              const hasLink = !!meeting.linkEksternal;
              const attachmentCount = [hasFile, hasVideo, hasLink].filter(Boolean).length;
              const isDraft = !meeting.isPublished;

              // File size formatter
              const formatSize = (bytes?: number | null) => {
                if (!bytes) return "";
                if (bytes < 1024) return `${bytes} B`;
                if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
                return `${(bytes / 1048576).toFixed(1)} MB`;
              };

              return (
                <div
                  key={meeting.id}
                  className="relative group"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Card */}
                  <div
                    className={`
                      relative ml-0 md:ml-[70px] rounded-2xl border
                      bg-card/80 backdrop-blur-sm
                      shadow-sm hover:shadow-lg
                      transition-all duration-300 ease-out
                      hover:-translate-y-0.5
                      ${isDraft
                        ? "border-dashed border-amber-500/40 dark:border-amber-400/30"
                        : "border-border/60 hover:border-primary/30"
                      }
                    `}
                  >
                    {/* Session Number Circle - positioned on the timeline */}
                    <div className="absolute -left-[70px] top-6 hidden md:flex flex-col items-center z-10">
                      <div
                        className={`
                          h-[52px] w-[52px] rounded-2xl flex items-center justify-center
                          text-xl font-black shadow-md
                          transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg
                          ${isDraft
                            ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900"
                            : "bg-gradient-to-br from-primary to-emerald-600 text-white"
                          }
                        `}
                      >
                        {String(meeting.pertemuanKe).padStart(2, "0")}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 sm:p-6">
                      {/* Top Row: Session label + Date + Status */}
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Mobile session number */}
                          <div
                            className={`
                              md:hidden h-9 w-9 rounded-xl flex items-center justify-center
                              text-sm font-black shrink-0
                              ${isDraft
                                ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900"
                                : "bg-gradient-to-br from-primary to-emerald-600 text-white"
                              }
                            `}
                          >
                            {meeting.pertemuanKe}
                          </div>

                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            Pertemuan {meeting.pertemuanKe}
                          </span>

                          {/* Status Toggle */}
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(meeting.id)}
                            disabled={togglingId === meeting.id}
                            title={
                              meeting.isPublished
                                ? "Status: Terbit (Klik untuk ubah ke Draft)"
                                : "Status: Draft (Klik untuk Terbitkan ke siswa)"
                            }
                            className="inline-flex cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed group/badge focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                          >
                            {meeting.isPublished ? (
                              <Badge
                                variant="success"
                                size="xs"
                                className="cursor-pointer group-hover/badge:shadow-md transition-shadow gap-1"
                              >
                                {togglingId === meeting.id && (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                )}
                                <span>Terbit</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="warning"
                                size="xs"
                                className="cursor-pointer group-hover/badge:shadow-md transition-shadow gap-1"
                              >
                                {togglingId === meeting.id && (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                )}
                                <span>Draft</span>
                              </Badge>
                            )}
                          </button>
                        </div>

                        {/* Date */}
                        <Badge variant="outline" size="sm" className="gap-1.5 font-medium text-muted-foreground shrink-0">
                          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{dateFormatted}</span>
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className={`text-base sm:text-lg font-bold text-foreground leading-snug mb-1 ${isDraft ? "opacity-70" : ""}`}>
                        {meeting.judul}
                      </h3>

                      {/* Description */}
                      {meeting.deskripsi && (
                        <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4 ${isDraft ? "opacity-60" : ""}`}>
                          {meeting.deskripsi}
                        </p>
                      )}

                      {/* Attachments Section */}
                      {attachmentCount > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {hasFile && (
                            <button
                              type="button"
                              onClick={() =>
                                setViewerFile({
                                  url: meeting.fileUrl!,
                                  name: meeting.fileName || meeting.judul,
                                })
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group/file"
                              title={meeting.fileName || "Modul Pembelajaran"}
                            >
                              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 group-hover/file:bg-emerald-500/30 transition-colors">
                                <FileText className="h-3.5 w-3.5" />
                              </div>
                              <div className="text-left">
                                <span className="block leading-tight">
                                  {meeting.fileName
                                    ? meeting.fileName.length > 25
                                      ? meeting.fileName.slice(0, 22) + "..."
                                      : meeting.fileName
                                    : "Modul Pembelajaran"}
                                </span>
                                {meeting.fileSize && (
                                  <span className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60">
                                    {formatSize(meeting.fileSize)} • {meeting.fileType?.toUpperCase() || "File"}
                                  </span>
                                )}
                              </div>
                              <Eye className="h-3.5 w-3.5 ml-1 opacity-0 group-hover/file:opacity-100 transition-opacity" />
                            </button>
                          )}

                          {hasVideo && (
                            <a
                              href={meeting.videoUrl!}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] group/video"
                              title="Video Pembelajaran"
                            >
                              <div className="h-7 w-7 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 group-hover/video:bg-red-500/30 transition-colors">
                                <Video className="h-3.5 w-3.5" />
                              </div>
                              <span>Video Pembelajaran</span>
                              <ExternalLink className="h-3 w-3 ml-0.5 opacity-0 group-hover/video:opacity-100 transition-opacity" />
                            </a>
                          )}

                          {hasLink && (
                            <a
                              href={meeting.linkEksternal!}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] group/link"
                              title="Link Referensi Eksternal"
                            >
                              <div className="h-7 w-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 group-hover/link:bg-blue-500/30 transition-colors">
                                <LinkIcon className="h-3.5 w-3.5" />
                              </div>
                              <span>Link Eksternal</span>
                              <ExternalLink className="h-3 w-3 ml-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Linked Assignments */}
                      {meeting.tugas.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FileCheck className="h-3.5 w-3.5 text-primary" />
                            Tugas Terkait ({meeting.tugas.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {meeting.tugas.map((t) => {
                              const deadlineFormatted = new Date(t.deadline).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              });
                              return (
                                <div
                                  key={t.id}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/60 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                  <span className="truncate max-w-[180px] sm:max-w-[250px]">{t.judul}</span>
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {deadlineFormatted}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Footer: Action Buttons */}
                      <div className="flex items-center justify-end gap-1 pt-3 border-t border-border/40">
                        {allAssignedClasses.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCopy(meeting)}
                            title="Salin ke kelas lain"
                            className="h-8 text-xs gap-1.5 text-blue-600 hover:bg-blue-500/10 rounded-xl"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Salin</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(meeting)}
                          title="Edit pertemuan"
                          className="h-8 text-xs gap-1.5 rounded-xl"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(meeting.id, meeting.pertemuanKe)}
                          title="Hapus pertemuan"
                          className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Hapus</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog Form Tambah / Edit */}
      <MeetingFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        kelasId={currentKelas.id}
        mapelId={mapel.id}
        initialData={editingMeeting}
        suggestedPertemuanKe={meetings.length + 1}
        availableTasks={availableTasks}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Dialog Salin Materi */}
      <CopyMeetingDialog
        isOpen={isCopyOpen}
        onClose={() => setIsCopyOpen(false)}
        sourcePertemuan={meetingToCopy}
        availableClasses={allAssignedClasses}
        currentKelasId={currentKelas.id}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* In-Browser Document Viewer */}
      {viewerFile && (
        <InBrowserDocViewer
          isOpen={true}
          onClose={() => setViewerFile(null)}
          title={viewerFile.name}
          files={[{ url: viewerFile.url, name: viewerFile.name }]}
          allowDownload={true}
        />
      )}
    </div>
  );
}
