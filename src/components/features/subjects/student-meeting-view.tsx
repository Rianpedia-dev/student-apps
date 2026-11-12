"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  Compass,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InBrowserDocViewer } from "@/components/features/assignment/in-browser-doc-viewer";
import { MeetingMaterialsSection } from "./meeting-materials-section";
import { isVideoFile, resolveLearningVideo } from "@/lib/video-embed";

interface TaskItem {
  id: string;
  judul: string;
  deskripsi?: string | null;
  deadline: string;
  poinMaksimal: number;
  tipePengerjaan?: string;
  pertemuanKe?: number | null;
  totalSoal?: number;
  durasiMenit?: number | null;
  isGraded: boolean;
  isPending: boolean;
  submissionStatus?: string;
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
  allTasks?: TaskItem[];
  defaultTab?: "pertemuan" | "tugas";
}

export function StudentMeetingView({
  mapel,
  studentClass,
  guru,
  jadwalInfo,
  meetings: initialMeetings,
  allTasks = [],
  defaultTab = "pertemuan",
}: StudentMeetingViewProps) {
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

  // In-browser doc viewer modal
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string; type?: string } | null>(null);

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

  return (
    <div className="space-y-6">
      {/* KONTEN: MODUL & PERTEMUAN MATERI */}
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
            <div className="p-12 text-center rounded-3xl glass-card space-y-4 shadow-2xl">
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
            <div className="p-10 text-center rounded-3xl glass-card text-muted-foreground space-y-2 shadow-xl">
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

                  const hasFile = !!meeting.fileUrl;
                  const uploadedVideoUrl =
                    hasFile && isVideoFile(meeting.fileUrl, meeting.fileType)
                      ? meeting.fileUrl!
                      : null;
                  const effectiveVideoUrl = meeting.videoUrl || uploadedVideoUrl;
                  const hasVideo = !!resolveLearningVideo(effectiveVideoUrl);
                  const taskStepNumber = (hasFile ? 1 : 0) + (hasVideo ? 1 : 0) + 1;

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
                            text-xl font-black shadow-md shadow-emerald-700/20
                            transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg select-none
                            ${
                              isLatest
                                ? "bg-emerald-600 text-white ring-2 ring-emerald-400/40"
                                : "bg-emerald-600 text-white"
                            }
                          `}
                        >
                          {String(meeting.pertemuanKe).padStart(2, "0")}
                        </div>
                      </div>

                      {/* Card */}
                      <div
                        className={`
                          relative ml-0 md:ml-[72px] rounded-3xl card-elevation transition-all duration-300 overflow-hidden
                          ${
                            isLatest
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
                          <div className="flex items-center justify-between gap-2.5">
                            {/* Left: Mobile Session Number, Session badge, Title */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* Mobile session number */}
                              <div className="md:hidden h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs select-none mt-0.5">
                                {String(meeting.pertemuanKe).padStart(2, "0")}
                              </div>

                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="emerald" size="sm" className="font-bold">
                                    Pertemuan {meeting.pertemuanKe}
                                  </Badge>
                                </div>

                                <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug tracking-tight">
                                  {meeting.judul}
                                </h3>
                              </div>
                            </div>

                        {/* Right: Chevron */}
                        <div className="flex items-center shrink-0">
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
                      <div className="px-3.5 sm:px-5 pb-4 pt-3.5 border-t border-border/60 space-y-4 bg-muted/10">
                        <MeetingMaterialsSection
                          judul={meeting.judul}
                          deskripsi={meeting.deskripsi}
                          fileUrl={meeting.fileUrl}
                          fileName={meeting.fileName}
                          fileType={meeting.fileType}
                          videoUrl={meeting.videoUrl}
                          showStepNumbers={true}
                          onPreviewFile={setViewerFile}
                        />

                        {/* TUGAS */}
                        {meeting.tugas.length > 0 && (
                          <div className="space-y-2 pt-3 border-t border-border/60">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                              {hasFile || hasVideo ? (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                  {taskStepNumber}
                                </span>
                              ) : (
                                <FileCheck className="h-3.5 w-3.5 text-primary" />
                              )}
                              <span>Tugas ({meeting.tugas.length})</span>
                            </div>

                            <div className="space-y-2">
                              {meeting.tugas.map((t) => (
                                <div
                                  key={t.id}
                                  className="p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="space-y-1 min-w-0 flex-1">
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
                </div>
              );
            })}
          </div>
        </div>
      )}
        </div>


      {/* 5. IN-BROWSER DOCUMENT VIEWER MODAL */}
      {viewerFile && (
        <InBrowserDocViewer
          isOpen={true}
          onClose={() => setViewerFile(null)}
          title={viewerFile.name}
          files={[{ url: viewerFile.url, name: viewerFile.name, type: viewerFile.type }]}
          allowDownload={true}
          downloadPrefix="Modul"
        />
      )}
    </div>
  );
}
