"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Video,
  FileCheck,
  Sparkles,
  School,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  Clock,
  Compass,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MeetingFormDialog } from "./meeting-form-dialog";
import { CopyMeetingDialog } from "./copy-meeting-dialog";
import { deletePertemuanAction } from "@/actions/pertemuan";
import { InBrowserDocViewer } from "@/components/features/assignment/in-browser-doc-viewer";
import { MeetingMaterialsSection } from "@/components/features/subjects/meeting-materials-section";
import { TeacherTaskList, TeacherTaskItem } from "@/components/features/assignment/teacher-task-list";
import { cn } from "@/lib/utils";

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
  fullTasks?: TeacherTaskItem[];
  initialTab?: string;
  activeOnlineRoomId?: string | null;
}

export function TeacherMeetingList({
  mapel,
  currentKelas,
  allAssignedClasses,
  meetings,
  availableTasks,
  fullTasks = [],
  initialTab = "materi",
  activeOnlineRoomId = null,
}: TeacherMeetingListProps) {
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = useState<"materi" | "tugas">(
    initialTab === "tugas" ? "tugas" : "materi"
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any | null>(null);

  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [meetingToCopy, setMeetingToCopy] = useState<any | null>(null);

  // In-browser doc viewer
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string; type?: string } | null>(null);

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
      {/* Unified Master Header Card */}
      <div className="rounded-3xl bg-card/95 dark:bg-card/90 backdrop-blur-md border border-border/80 p-4 sm:p-5 lg:p-6 shadow-sm relative overflow-hidden space-y-4">
        {/* Glow Accent */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Baris 1: Identitas Mapel/Kelas (Kiri) & Tab Navigasi (Kanan) */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
              {mapel.namaMapel}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <School className="h-4 w-4 text-emerald-600 shrink-0" />
                {currentKelas.namaKelas}
              </span>
            </div>
          </div>

          {/* Tab Navigasi: Materi atau Tugas */}
          <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 bg-muted/60 rounded-2xl border border-border/60 shadow-2xs shrink-0 w-full sm:w-fit">
            <button
              type="button"
              onClick={() => {
                setActiveMainTab("materi");
                router.replace(`/guru/mapel/${mapel.id}?kelasId=${currentKelas.id}&tab=materi`, { scroll: false });
              }}
              className={`flex items-center justify-center px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeMainTab === "materi"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Materi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMainTab("tugas");
                router.replace(`/guru/mapel/${mapel.id}?kelasId=${currentKelas.id}&tab=tugas`, { scroll: false });
              }}
              className={`flex items-center justify-center px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeMainTab === "tugas"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Tugas</span>
            </button>
          </div>
        </div>

        {/* Baris 2: Aksi Pendukung (Kiri) & Tombol Utama (Kanan) */}
        <div className="relative z-10 pt-3.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={
                activeOnlineRoomId
                  ? `/guru/kelas-online/${activeOnlineRoomId}`
                  : `/guru/kelas-online?mapelId=${mapel.id}&kelasId=${currentKelas.id}`
              }
            >
              <Button
                variant="outline"
                size="sm"
                className={`h-9 sm:h-10 px-3.5 text-xs font-bold rounded-xl sm:rounded-2xl cursor-pointer shadow-2xs ${
                  activeOnlineRoomId
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                    : "border-sky-500/40 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                }`}
              >
                <span>{activeOnlineRoomId ? "Masuk Kelas Live" : "Kelas Online"}</span>
              </Button>
            </Link>

            <Link
              href={`/guru/attendance/${mapel.id}/${currentKelas.id}/${new Date().toISOString().split("T")[0]}`}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-9 sm:h-10 px-3.5 text-xs font-bold rounded-xl sm:rounded-2xl border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 cursor-pointer shadow-2xs"
              >
                <span>Presensi</span>
              </Button>
            </Link>
          </div>

          <div className="ml-auto shrink-0">
            {activeMainTab === "materi" ? (
              <Button
                onClick={handleCreate}
                size="sm"
                className="h-9 sm:h-10 text-xs font-bold gap-1.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer px-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Tambah</span>
              </Button>
            ) : (
              <Link
                href={`/guru/tugas/create?mapelId=${mapel.id}&kelasId=${currentKelas.id}&from=mapel`}
              >
                <Button
                  size="sm"
                  className="h-9 sm:h-10 text-xs font-bold gap-1.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer px-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Buat Tugas</span>
                </Button>
              </Link>
            )}
          </div>
          </div>
      </div>

      {activeMainTab === "materi" ? (
        <>
          {/* Action Toolbar: Collapse/Expand, Class Selector Dropdown, & Search Bar (Sejajar) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Expand/Collapse All */}
        {meetings.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={expandedIds.size === meetings.length ? collapseAll : expandAll}
            className="h-10 text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 rounded-2xl bg-card/95 dark:bg-card/90 hover:bg-muted border border-border/80 cursor-pointer shadow-2xs px-3.5 backdrop-blur-md shrink-0 w-fit"
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
        ) : (
          <div />
        )}

        {/* Right: Dropdown Pilih Kelas & Search Input Sejajar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 ml-auto w-full md:w-auto">
          {/* Dropdown List Pilih Kelas */}
          {allAssignedClasses.length > 1 && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border border-border/80 bg-card/95 dark:bg-card/90 shadow-2xs backdrop-blur-md h-10 shrink-0">
              <School className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-muted-foreground shrink-0 hidden sm:inline">
                Pilih Kelas:
              </span>
              <select
                value={currentKelas.id}
                onChange={(e) =>
                  router.push(`/guru/mapel/${mapel.id}?kelasId=${e.target.value}`)
                }
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-1"
              >
                {allAssignedClasses.map((cls) => (
                  <option
                    key={cls.id}
                    value={cls.id}
                    className="bg-card text-foreground font-semibold py-1"
                  >
                    {cls.namaKelas} ({cls.jenjang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Bar Materi Pertemuan */}
          {meetings.length > 0 && (
            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari materi pertemuan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-2xl bg-card/95 dark:bg-card/90 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-2xs transition-all backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

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
                      <div className="flex items-center justify-between gap-2.5">
                        {/* Left: Mobile Session Number, Session badge, Status, Title */}
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
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug tracking-tight">
                              {meeting.judul}
                            </h3>
                          </div>
                        </div>

                        {/* Right: Chevron */}
                        <div className="flex items-center shrink-0">
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
                      <div className="px-3.5 sm:px-5 pb-4 pt-3.5 border-t border-border/60 space-y-4 bg-muted/10">
                        <MeetingMaterialsSection
                          judul={meeting.judul}
                          deskripsi={meeting.deskripsi}
                          fileUrl={meeting.fileUrl}
                          fileName={meeting.fileName}
                          fileType={meeting.fileType}
                          videoUrl={meeting.videoUrl}
                          onPreviewFile={setViewerFile}
                        />

                        {/* TUGAS */}
                        {meeting.tugas.length > 0 && (
                          <div className="space-y-2 pt-3 border-t border-border/60">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                              <FileCheck className="h-3.5 w-3.5 text-primary" />
                              <span>Tugas ({meeting.tugas.length})</span>
                            </div>

                            <div className="space-y-2">
                              {meeting.tugas.map((t) => {
                                const deadlineFormatted = new Date(t.deadline).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                });

                                return (
                                  <div
                                    key={t.id}
                                    className="p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                  >
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center flex-wrap gap-2">
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
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-border/60">
                          <Link
                            href={`/guru/kelas-online?mapelId=${mapel.id}&kelasId=${currentKelas.id}&pertemuanId=${meeting.id}`}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Mulai Kelas Online untuk pertemuan ini"
                              className="h-8 text-xs gap-1.5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30 rounded-xl cursor-pointer"
                            >
                              <Video className="h-3.5 w-3.5" />
                              <span>Kelas Online</span>
                            </Button>
                          </Link>

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
    </>
  ) : (
    /* TAB TUGAS SISWA */
    <TeacherTaskList
      tasks={fullTasks}
      initialMapelId={mapel.id}
      initialKelasId={currentKelas.id}
      isSpecificView={true}
      activeMapelNama={mapel.namaMapel}
      activeKelasNama={currentKelas.namaKelas}
      assignedClassesForMapel={allAssignedClasses.map((c) => ({
        id: c.id,
        name: c.namaKelas,
        jenjang: c.jenjang,
      }))}
      currentKelasId={currentKelas.id}
    />
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
          files={[{ url: viewerFile.url, name: viewerFile.name, type: viewerFile.type }]}
          allowDownload={true}
          downloadPrefix="Modul"
        />
      )}
    </div>
  );
}
