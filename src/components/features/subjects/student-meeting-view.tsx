"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Video,
  Link as LinkIcon,
  FileCheck,
  Download,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Play,
  Search,
  Filter,
  ArrowRight,
  GraduationCap,
  MessageSquare,
  Compass,
  AlertCircle,
  FolderOpen,
  CheckCheck,
  HelpCircle,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InBrowserDocViewer } from "@/components/features/assignment/in-browser-doc-viewer";

interface TaskItem {
  id: string;
  judul: string;
  deskripsi?: string | null;
  deadline: string;
  poinMaksimal: number;
  isGraded: boolean;
  isPending: boolean;
  nilai?: number | null;
}

interface MeetingItem {
  id: string;
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
  isCompleted: boolean;
  tugas: TaskItem[];
}

interface StudentMeetingViewProps {
  mapel: {
    id: string;
    kodeMapel: string;
    namaMapel: string;
    deskripsi?: string | null;
    warna?: string | null;
  };
  studentClass: string;
  guru: {
    name?: string | null;
    image?: string | null;
    gender?: string | null;
  } | null;
  jadwalInfo?: string | null;
  meetings: MeetingItem[];
  allTasks: TaskItem[];
}

function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
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

export function StudentMeetingView({
  mapel,
  studentClass,
  guru,
  jadwalInfo,
  meetings: initialMeetings,
  allTasks,
}: StudentMeetingViewProps) {
  const [activeTab, setActiveTab] = useState<"pertemuan" | "tugas">("pertemuan");
  const [meetings, setMeetings] = useState<MeetingItem[]>(initialMeetings);

  // Auto-expand first meeting
  const initialExpandedId = useMemo(() => {
    if (initialMeetings.length === 0) return null;
    return initialMeetings[0].id;
  }, [initialMeetings]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(initialExpandedId ? [initialExpandedId] : [])
  );

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "todo" | "pending" | "graded">("all");

  // In-browser doc viewer modal
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);

  // Toggle single card expand/collapse
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

  // Filtered Meetings
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

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (taskFilter === "todo") return !t.isGraded && !t.isPending;
      if (taskFilter === "pending") return t.isPending;
      if (taskFilter === "graded") return t.isGraded;
      return true;
    });
  }, [allTasks, taskFilter]);

   return (
    <div className="space-y-6">
      {/* KONTEN: MODUL & PERTEMUAN */}
      {(
        <div className="space-y-5">
          {/* Search Bar */}
          {meetings.length > 0 && (
            <div className="flex items-center justify-end">
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

          {/* Empty State */}
          {meetings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-4 shadow-xs">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Compass className="h-8 w-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-foreground">
                  Belum Ada Modul Pertemuan yang Diterbitkan
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ustadz/Ustadzah sedang menyiapkan materi pembelajaran terstruktur untuk kelas {studentClass}. Pantau terus halaman ini secara berkala ya!
                </p>
              </div>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-card border border-border text-muted-foreground space-y-2">
              <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-bold text-foreground">Pertemuan Tidak Ditemukan</p>
              <p className="text-xs">Tidak ada modul pertemuan yang sesuai dengan filter atau kata kunci pencarian.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                }}
                className="mt-2 text-xs rounded-xl"
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            /* DAFTAR PERTEMUAN MATERI */
            <div className="space-y-3">
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

                return (
                  <div
                    key={meeting.id}
                    className={`
                      rounded-2xl border bg-card transition-all duration-200 shadow-2xs overflow-hidden
                      ${
                        isLatest
                          ? "border-primary/40 ring-1 ring-primary/20"
                          : "border-border/80 hover:border-primary/30"
                      }
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* CARD HEADER (Clickable to Expand / Collapse) */}
                    <div
                      onClick={() => toggleExpand(meeting.id)}
                      className="p-3.5 sm:p-4 cursor-pointer select-none transition-colors hover:bg-muted/15"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Left: Session badge, Date, Title */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-primary/10 text-primary border border-primary/20 shrink-0">
                              Pertemuan {meeting.pertemuanKe}
                            </span>

                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-md">
                              <Calendar className="h-3 w-3 text-primary shrink-0" />
                              <span>{dateFormatted}</span>
                            </span>

                            {isLatest && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                <Sparkles className="h-3 w-3 animate-pulse" />
                                <span>Materi Pekan Ini</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug tracking-tight">
                            {meeting.judul}
                          </h3>
                        </div>

                        {/* Right: Media & Task Badges + Chevron */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <div className="flex items-center gap-1.5 text-xs">
                            {hasFile && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-[11px] border border-emerald-500/20"
                                title="Modul Dokumen Ajar Tersedia"
                              >
                                <FileText className="h-3 w-3" />
                                <span>Modul</span>
                              </span>
                            )}

                            {hasVideo && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 font-bold text-[11px] border border-red-500/20"
                                title="Video Penjelasan Tersedia"
                              >
                                <Video className="h-3 w-3" />
                                <span>Video</span>
                              </span>
                            )}

                            {hasTasks && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 font-bold text-[11px] border border-amber-500/20"
                                title="Terdapat Latihan Soal/Tugas"
                              >
                                <FileCheck className="h-3 w-3" />
                                <span>{meeting.tugas.length} Tugas</span>
                              </span>
                            )}
                          </div>

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
                        {(hasFile || youtubeEmbed || meeting.linkEksternal) && (
                          <div
                            className={`grid gap-3 ${
                              hasFile && youtubeEmbed
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
                                      className="h-8 px-3 text-xs font-bold gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
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
                                        className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-lg"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Unduh</span>
                                      </Button>
                                    </a>
                                  </div>
                                </div>

                                {/* Referensi Web jika tidak ada video */}
                                {meeting.linkEksternal && !youtubeEmbed && (
                                  <a
                                    href={meeting.linkEksternal}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-medium hover:bg-blue-500/15 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">{meeting.linkEksternal}</span>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-1.5 opacity-80" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Video Pembelajaran */}
                            {youtubeEmbed && (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                  <Video className="h-3.5 w-3.5 text-red-500" />
                                  <span>Video Pembelajaran:</span>
                                </div>

                                <div className="aspect-video w-full rounded-xl overflow-hidden border border-border shadow-2xs bg-black max-h-[220px]">
                                  <iframe
                                    src={youtubeEmbed}
                                    title={meeting.judul}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                  />
                                </div>

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
                                Selesaikan tugas untuk mengasah pemahamanmu
                              </span>
                            </div>

                            <div className="space-y-2">
                              {meeting.tugas.map((t) => (
                                <div
                                  key={t.id}
                                  className="p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center flex-wrap gap-2">
                                      <span
                                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                          t.isGraded
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25"
                                            : t.isPending
                                            ? "bg-blue-500/10 text-blue-600 border-blue-500/25"
                                            : "bg-amber-500/10 text-amber-600 border-amber-500/25"
                                        }`}
                                      >
                                        {t.isGraded
                                          ? `Nilai: ${t.nilai} / ${t.poinMaksimal} ⭐`
                                          : t.isPending
                                          ? "Sedang Dinilai ⏳"
                                          : "Belum Dikerjakan 🚀"}
                                      </span>

                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                          Tenggat:{" "}
                                          {new Date(t.deadline).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </span>
                                      </span>
                                    </div>

                                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                                      {t.judul}
                                    </h4>
                                  </div>

                                  <Link href={`/siswa/tugas/${t.id}`} className="shrink-0 self-end sm:self-auto">
                                    <Button
                                      size="sm"
                                      variant={t.isGraded ? "outline" : "default"}
                                      className="h-8 px-3.5 text-xs font-bold rounded-lg gap-1.5"
                                    >
                                      <span>
                                        {t.isGraded
                                          ? "Lihat Nilai"
                                          : t.isPending
                                          ? "Buka Jawaban"
                                          : "Kerjakan Tugas"}
                                      </span>
                                      <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* 5. IN-BROWSER DOCUMENT VIEWER MODAL */}
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
