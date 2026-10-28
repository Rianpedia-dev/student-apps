"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Download,
  Play,
  Search,
  ArrowRight,
  Clock,
  MessageSquare,
  Compass,
  FolderOpen,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MeetingFormDialog } from "./meeting-form-dialog";
import { CopyMeetingDialog } from "./copy-meeting-dialog";
import { deletePertemuanAction, togglePublishPertemuanAction } from "@/actions/pertemuan";
import { InBrowserDocViewer } from "@/components/features/assignment/in-browser-doc-viewer";

interface TaskItem {
  id: string;
  judul: string;
  deadline: string;
  submissionCount?: number;
  pendingCount?: number;
}

interface MeetingItem {
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
  tugas: TaskItem[];
}

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
  meetings: MeetingItem[];
  availableTasks: Array<{
    id: string;
    judul: string;
    pertemuan_id?: string | null;
  }>;
}

function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube-nocookie.com/embed/${match[2]}`
    : null;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
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

  // Expanded cards state
  const initialExpandedId = useMemo(() => {
    if (meetings.length === 0) return null;
    return meetings[0].id;
  }, [meetings]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(initialExpandedId ? [initialExpandedId] : [])
  );

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Filter & stats
  const publishedCount = meetings.filter((m) => m.isPublished).length;
  const draftCount = meetings.filter((m) => !m.isPublished).length;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(meetings.map((m) => m.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.judul.toLowerCase().includes(q);
        const matchDesc = m.deskripsi?.toLowerCase().includes(q) || false;
        const matchNum = `pertemuan ${m.pertemuanKe}`.includes(q);
        if (!matchTitle && !matchDesc && !matchNum) return false;
      }
      return true;
    });
  }, [meetings, searchQuery]);

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
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus Pertemuan ${pertemuanKe}? Tugas yang terhubung tidak akan terhapus.`
      )
    ) {
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
      <div className="rounded-2xl sm:rounded-3xl bg-card/90 backdrop-blur-xs border border-border p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Glow Accent */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="purple" size="sm" className="font-bold font-mono uppercase">
              {mapel.kodeMapel}
            </Badge>
            <Badge variant={currentKelas.jenjang === "SMP" ? "smp" : "amber"} size="sm">
              {currentKelas.namaKelas} ({currentKelas.jenjang})
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            Kelola Pertemuan & Modul: {mapel.namaMapel}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Total {meetings.length} Pertemuan • {publishedCount} Terbit untuk Siswa • {draftCount} Draf Guru
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap relative z-10">
          <Link
            href={`/guru/attendance/${mapel.id}/${currentKelas.id}/${new Date().toISOString().split("T")[0]}`}
          >
            <Button
              variant="outline"
              size="sm"
              className="h-9.5 text-xs font-bold gap-2 rounded-xl border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 cursor-pointer"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Presensi KBM Hari Ini</span>
            </Button>
          </Link>
          <Button
            onClick={handleCreate}
            size="sm"
            className="h-9.5 text-xs font-bold gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
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
                className={`h-8 text-xs font-bold rounded-xl shrink-0 cursor-pointer ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:border-primary/40"
                }`}
              >
                {cls.namaKelas}
              </Button>
            );
          })}
        </div>
      )}

      {/* Search Bar & Quick Controls */}
      {meetings.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandedIds.size === meetings.length ? collapseAll : expandAll}
              className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 rounded-xl cursor-pointer"
            >
              {expandedIds.size === meetings.length ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Tutup Semua</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Buka Semua</span>
                </>
              )}
            </Button>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari materi pertemuan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>
      )}

      {/* Meeting List Content */}
      {meetings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Compass className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              Belum Ada Pertemuan Pembelajaran untuk {currentKelas.namaKelas}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mulai susun modul KBM per pekan untuk rombel ini. Unggah ringkasan materi, bahan ajar dokumen, video penunjang, dan tautkan tugas mingguan.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            size="sm"
            className="h-9 text-xs font-bold gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Buat Pertemuan 1 Sekarang</span>
          </Button>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-card border border-border text-muted-foreground space-y-2 shadow-xs">
          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <p className="text-sm font-bold text-foreground">Pertemuan Tidak Ditemukan</p>
          <p className="text-xs">
            Tidak ada modul pertemuan yang sesuai dengan filter atau kata kunci pencarian.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="mt-2 text-xs rounded-xl cursor-pointer"
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        /* Timeline Layout - Identical to Student View */
        <div className="relative">
          {/* Timeline Connector Line */}
          <div
            className="absolute left-[25px] top-8 bottom-8 w-0.5 hidden md:block rounded-full pointer-events-none"
            style={{
              background: "linear-gradient(180deg, #059669 0%, #10b981 50%, #059669 100%)",
            }}
          />

          <div className="space-y-4">
            {filteredMeetings.map((meeting, index) => {
              const isExpanded = expandedIds.has(meeting.id);
              const isLatest = index === filteredMeetings.length - 1;
              const youtubeEmbed = getYouTubeEmbedUrl(meeting.videoUrl);

              const dateFormatted = new Date(meeting.tanggal).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              const hasFile = !!meeting.fileUrl;
              const hasVideo = !!meeting.videoUrl;
              const hasTasks = meeting.tugas.length > 0;
              const isDraft = !meeting.isPublished;

              return (
                <div
                  key={meeting.id}
                  className="relative group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Session Number Squircle - Desktop Timeline */}
                  <div className="absolute left-0 top-4 hidden md:flex items-center justify-center z-10">
                    <div
                      className={`
                        h-[52px] w-[52px] rounded-2xl flex items-center justify-center
                        text-xl font-black shadow-md
                        transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg select-none
                        ${
                          isDraft
                            ? "bg-amber-500 text-white shadow-amber-700/20"
                            : "bg-emerald-600 text-white shadow-emerald-700/20"
                        }
                      `}
                    >
                      {String(meeting.pertemuanKe).padStart(2, "0")}
                    </div>
                  </div>

                  {/* Card Container */}
                  <div
                    className={`
                      relative ml-0 md:ml-[72px] rounded-3xl card-elevation transition-all duration-300 overflow-hidden
                      ${
                        isDraft
                          ? "border-dashed border-amber-500/40 dark:border-amber-400/30"
                          : isLatest
                          ? "ring-2 ring-primary/40 border-primary/50"
                          : ""
                      }
                    `}
                  >
                    {/* CARD HEADER (Clickable to Expand / Collapse) */}
                    <div
                      onClick={() => toggleExpand(meeting.id)}
                      className="p-3.5 sm:p-4 cursor-pointer select-none transition-colors hover:bg-muted/15"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Left: Mobile Session Number, Session badge, Status, Date, Title */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Mobile session number */}
                          <div
                            className={`
                              md:hidden h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs select-none mt-0.5
                              ${isDraft ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"}
                            `}
                          >
                            {String(meeting.pertemuanKe).padStart(2, "0")}
                          </div>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="emerald" size="sm" className="font-bold">
                                Pertemuan {meeting.pertemuanKe}
                              </Badge>

                              {/* Clickable Status Toggle (Terbit / Draft) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePublish(meeting.id);
                                }}
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
                                    className="cursor-pointer group-hover/badge:shadow-xs transition-shadow gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                  >
                                    {togglingId === meeting.id ? (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                      <CheckCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    )}
                                    <span>Terbit</span>
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="warning"
                                    size="xs"
                                    className="cursor-pointer group-hover/badge:shadow-xs transition-shadow gap-1"
                                  >
                                    {togglingId === meeting.id && (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    )}
                                    <span>Draft</span>
                                  </Badge>
                                )}
                              </button>

                              <Badge
                                variant="outline"
                                size="sm"
                                className="gap-1 font-medium text-muted-foreground"
                              >
                                <Calendar className="h-3 w-3 text-primary shrink-0" />
                                <span>{dateFormatted}</span>
                              </Badge>

                              {isLatest && (
                                <Badge variant="sky" size="sm" className="gap-1">
                                  <Sparkles className="h-3 w-3 animate-pulse" />
                                  <span>Materi Pekan Ini</span>
                                </Badge>
                              )}
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug tracking-tight">
                              {meeting.judul}
                            </h3>
                          </div>
                        </div>

                        {/* Right: Media & Task Badges + Quick Edit + Chevron */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <div className="flex items-center gap-1.5 text-xs">
                            {hasFile && (
                              <Badge
                                variant="teal"
                                size="xs"
                                className="gap-1"
                                title="Modul Dokumen Ajar Tersedia"
                              >
                                <FileText className="h-3 w-3" />
                                <span>Modul</span>
                              </Badge>
                            )}

                            {hasVideo && (
                              <Badge
                                variant="rose"
                                size="xs"
                                className="gap-1"
                                title="Video Penjelasan Tersedia"
                              >
                                <Video className="h-3 w-3" />
                                <span>Video</span>
                              </Badge>
                            )}

                            {hasTasks && (
                              <Badge
                                variant="amber"
                                size="xs"
                                className="gap-1"
                                title="Terdapat Tugas Terkait"
                              >
                                <FileCheck className="h-3 w-3" />
                                <span>{meeting.tugas.length} Tugas</span>
                              </Badge>
                            )}
                          </div>

                          {/* Quick Edit button in header */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(meeting);
                            }}
                            className="p-1 rounded-lg hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Edit Pertemuan"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Expand/Collapse Chevron */}
                          <div className="p-1 rounded-lg bg-muted/60 text-muted-foreground group-hover:text-foreground transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED CONTENT AREA */}
                    {isExpanded && (
                      <div className="px-3.5 sm:px-4 pb-4 pt-3 border-t border-border/60 space-y-3.5 bg-muted/10">
                        {/* 1. PESAN GURU / RINGKASAN */}
                        {meeting.deskripsi && (
                          <div className="rounded-xl bg-card border border-border/70 p-3 sm:p-3.5 space-y-1.5 shadow-2xs">
                            <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>Pesan Ustadz / Ustadzah:</span>
                            </div>
                            <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed font-normal">
                              {meeting.deskripsi}
                            </p>
                          </div>
                        )}

                        {/* 2. BAHAN AJAR (MODUL & VIDEO) */}
                        {(hasFile || youtubeEmbed || hasVideo || meeting.linkEksternal) && (
                          <div
                            className={`grid gap-3 ${
                              hasFile && (youtubeEmbed || hasVideo)
                                ? "grid-cols-1 lg:grid-cols-2"
                                : "grid-cols-1"
                            }`}
                          >
                            {/* Berkas Modul */}
                            {hasFile && (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Bahan Bacaan & Modul:</span>
                                </div>

                                <div className="p-3 rounded-xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                      <FileText className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                                        {meeting.fileName || "Modul Pembelajaran"}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground font-medium">
                                        {meeting.fileType ? meeting.fileType.toUpperCase() : "DOKUMEN"}
                                        {meeting.fileSize ? ` • ${formatFileSize(meeting.fileSize)}` : ""}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() =>
                                        setViewerFile({
                                          url: meeting.fileUrl!,
                                          name: meeting.fileName || meeting.judul,
                                        })
                                      }
                                      className="h-8 px-3 text-xs font-bold gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex-1 cursor-pointer"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span>Baca Materi</span>
                                    </Button>

                                    <a
                                      href={meeting.fileUrl || undefined}
                                      download={meeting.fileName || "modul-pembelajaran"}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-lg cursor-pointer"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Unduh</span>
                                      </Button>
                                    </a>
                                  </div>
                                </div>

                                {/* Referensi Web jika tidak ada video */}
                                {meeting.linkEksternal && !youtubeEmbed && !hasVideo && (
                                  <a
                                    href={meeting.linkEksternal}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-medium hover:bg-blue-500/15 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">Tautan Referensi Tambahan</span>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-1.5 opacity-80" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Video Pembelajaran */}
                            {(youtubeEmbed || hasVideo) && (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                  <Video className="h-3.5 w-3.5 text-red-500" />
                                  <span>Video Pembelajaran:</span>
                                </div>

                                {youtubeEmbed ? (
                                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-border shadow-2xs bg-black max-h-[220px]">
                                    <iframe
                                      src={youtubeEmbed}
                                      title={meeting.judul}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="w-full h-full"
                                    />
                                  </div>
                                ) : (
                                  <a
                                    href={meeting.videoUrl!}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="aspect-video w-full rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2 text-center p-4 group/vlink max-h-[220px]"
                                  >
                                    <div className="h-10 w-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center group-hover/vlink:scale-110 transition-transform">
                                      <Play className="h-5 w-5 fill-current ml-0.5" />
                                    </div>
                                    <p className="text-xs font-bold text-foreground">Buka Tautan Video</p>
                                    <p className="text-[10px] text-muted-foreground truncate max-w-full px-2">
                                      {meeting.videoUrl}
                                    </p>
                                  </a>
                                )}

                                {/* Referensi Web di bawah video jika ada */}
                                {meeting.linkEksternal && (
                                  <a
                                    href={meeting.linkEksternal}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-medium hover:bg-blue-500/15 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">Tautan Referensi Tambahan</span>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-1.5 opacity-80" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Jika hanya ada Link Eksternal tanpa modul & tanpa video */}
                            {!hasFile && !hasVideo && meeting.linkEksternal && (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                  <LinkIcon className="h-3.5 w-3.5 text-blue-600" />
                                  <span>Tautan Materi:</span>
                                </div>
                                <a
                                  href={meeting.linkEksternal}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-semibold hover:bg-blue-500/15 transition-colors"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <LinkIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{meeting.linkEksternal}</span>
                                  </div>
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-1.5 opacity-80" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. TUGAS / LATIHAN PERTEMUAN INI */}
                        {meeting.tugas.length > 0 && (
                          <div className="space-y-2 pt-1 border-t border-border/60">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                <FileCheck className="h-3.5 w-3.5 text-primary" />
                                <span>Tugas Pertemuan Ini ({meeting.tugas.length}):</span>
                              </div>
                              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                Kelola atau periksa tugas siswa pada pertemuan ini
                              </span>
                            </div>

                            <div className="space-y-2">
                              {meeting.tugas.map((t) => {
                                const deadlineFormatted = new Date(t.deadline).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                });
                                const isSubmissionsExist = typeof t.submissionCount === "number" && t.submissionCount > 0;
                                const hasPending = typeof t.pendingCount === "number" && t.pendingCount > 0;

                                return (
                                  <div
                                    key={t.id}
                                    className="p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                  >
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center flex-wrap gap-2">
                                        <Badge
                                          variant={hasPending ? "amber" : isSubmissionsExist ? "success" : "secondary"}
                                          size="xs"
                                        >
                                          {hasPending
                                            ? `⏳ ${t.pendingCount} Perlu Dinilai`
                                            : isSubmissionsExist
                                            ? `✅ ${t.submissionCount} Siswa Mengumpulkan`
                                            : "Tugas Aktif"}
                                        </Badge>

                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                                          <Clock className="h-3 w-3" />
                                          <span>Tenggat: {deadlineFormatted}</span>
                                        </span>
                                      </div>

                                      <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                                        {t.judul}
                                      </h4>
                                    </div>

                                    <Link href={`/guru/tugas/${t.id}`} className="shrink-0 self-end sm:self-auto">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3.5 text-xs font-bold rounded-lg gap-1.5 cursor-pointer hover:border-primary/50"
                                      >
                                        <span>Lihat Tugas</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                      </Button>
                                    </Link>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 4. FOOTER: TEACHER ACTION BUTTONS */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                          {allAssignedClasses.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCopy(meeting)}
                              title="Salin ke kelas lain"
                              className="h-8 text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 border-blue-500/30 rounded-xl cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Salin ke Kelas Lain</span>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(meeting)}
                            title="Edit pertemuan"
                            className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer hover:border-primary/50"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(meeting.id, meeting.pertemuanKe)}
                            title="Hapus pertemuan"
                            className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus</span>
                          </Button>
                        </div>
                      </div>
                    )}
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
