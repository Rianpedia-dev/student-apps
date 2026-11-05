"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Plus,
  Search,
  Calendar,
  Pencil,
  Trash2,
  Send,
  Loader2,
  Paperclip,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Heart,
  FileText,
  Building2,
  RotateCcw,
  GraduationCap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
} from "@/actions/admin";
import { formatDateIndo, cn } from "@/lib/utils";
import { AnnouncementAttachment } from "@/components/shared/announcement-attachment";
import { toast } from "sonner";

export interface AnnouncementItem {
  id: string;
  title: string;
  from: string | null;
  file: string | null;
  pengumuman: string;
  like?: string | null;
  jenjang?: string | null;
  target_role?: string | null;
  target_kelas?: string | null;
  created_at: string | Date | null;
  updated_at?: string | Date | null;
}

export interface ClassOption {
  id: string;
  nama_kelas: string;
  jenjang?: string;
  tingkat?: number;
}

function htmlToPlainText(raw: string): string {
  if (!raw) return "";
  let text = raw;
  text = text.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "\n");
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

function plainTextToHtml(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^<(p|div|table|h[1-6]|ul|ol)[\s>]/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n\s*\n/)
    .map((para) => {
      const withBrs = para.trim().replace(/\n/g, "<br/>");
      return withBrs ? `<p>${withBrs}</p>` : "";
    })
    .filter(Boolean)
    .join("");
}

interface AnnouncementsManagerProps {
  initialAnnouncements: AnnouncementItem[];
  classes: ClassOption[];
  adminJenjang?: string; // "SD" | "SMP" | "ALL"
  isSuperAdmin?: boolean;
}

export function AnnouncementsManager({
  initialAnnouncements,
  classes,
  adminJenjang = "ALL",
  isSuperAdmin = false,
}: AnnouncementsManagerProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] =
    useState<AnnouncementItem[]>(initialAnnouncements);
  const [search, setSearch] = useState("");
  const [filterJenjang, setFilterJenjang] = useState<string>("ALL");
  const [filterTarget, setFilterTarget] = useState<string>("ALL");
  const [filterAttachment, setFilterAttachment] = useState<
    "ALL" | "WITH_FILE" | "NO_FILE"
  >("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Modal States
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AnnouncementItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);

  // Form Submitting States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create Form State
  const defaultCreateJenjang = isSuperAdmin ? "ALL" : adminJenjang;
  const [createJenjang, setCreateJenjang] = useState<string>(defaultCreateJenjang);
  const [createTargetType, setCreateTargetType] = useState<
    "ALL" | "GURU" | "SISWA" | "KELAS"
  >("ALL");
  const [createTargetKelas, setCreateTargetKelas] = useState<string>("");
  const [createFrom, setCreateFrom] = useState<string>(
    defaultCreateJenjang === "SD"
      ? "Kepala Sekolah SD"
      : defaultCreateJenjang === "SMP"
      ? "Kepala Sekolah SMP"
      : "Tim IT / Sekolah"
  );
  const [createFile, setCreateFile] = useState<File | null>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState<string>("");
  const [editPengumuman, setEditPengumuman] = useState<string>("");
  const [editJenjang, setEditJenjang] = useState<string>("ALL");
  const [editTargetType, setEditTargetType] = useState<
    "ALL" | "GURU" | "SISWA" | "KELAS"
  >("ALL");
  const [editTargetKelas, setEditTargetKelas] = useState<string>("");
  const [editFrom, setEditFrom] = useState<string>("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  // Separate classes by jenjang
  const sdClasses = useMemo(
    () => classes.filter((c) => (c.jenjang || "SD").toUpperCase() === "SD"),
    [classes]
  );
  const smpClasses = useMemo(
    () => classes.filter((c) => (c.jenjang || "").toUpperCase() === "SMP"),
    [classes]
  );

  // Classes matching current create jenjang
  const availableCreateClasses = useMemo(() => {
    if (createJenjang === "SD") return sdClasses;
    if (createJenjang === "SMP") return smpClasses;
    return classes;
  }, [createJenjang, sdClasses, smpClasses, classes]);

  // Classes matching current edit jenjang
  const availableEditClasses = useMemo(() => {
    if (editJenjang === "SD") return sdClasses;
    if (editJenjang === "SMP") return smpClasses;
    return classes;
  }, [editJenjang, sdClasses, smpClasses, classes]);

  // Quick Metrics
  const totalCount = announcements.length;
  const withFileCount = useMemo(
    () => announcements.filter((a) => Boolean(a.file)).length,
    [announcements]
  );
  const generalCount = useMemo(
    () =>
      announcements.filter(
        (a) =>
          !a.jenjang ||
          a.jenjang === "ALL" ||
          (!a.target_kelas && (!a.target_role || a.target_role === "ALL"))
      ).length,
    [announcements]
  );

  // Filtered Announcements
  const filtered = useMemo(() => {
    return announcements.filter((item) => {
      // Search Title, Content, or Sender
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.pengumuman.toLowerCase().includes(query) ||
        (item.from && item.from.toLowerCase().includes(query)) ||
        (item.target_kelas && item.target_kelas.toLowerCase().includes(query));

      // Jenjang Filter (Khusus Super Admin)
      const matchesJenjang =
        filterJenjang === "ALL" || item.jenjang === filterJenjang;

      // Target Filter
      const matchesTarget =
        filterTarget === "ALL" ||
        (filterTarget === "GURU" && item.target_role === "GURU") ||
        (filterTarget === "SISWA" && item.target_role === "SISWA") ||
        (filterTarget === "KELAS" && Boolean(item.target_kelas)) ||
        (filterTarget === "ALL_ROLE" &&
          (!item.target_role || item.target_role === "ALL") &&
          !item.target_kelas);

      // Attachment Filter
      const matchesAttachment =
        filterAttachment === "ALL"
          ? true
          : filterAttachment === "WITH_FILE"
          ? Boolean(item.file)
          : !item.file;

      return matchesSearch && matchesJenjang && matchesTarget && matchesAttachment;
    });
  }, [announcements, search, filterJenjang, filterTarget, filterAttachment]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Handle Jenjang Switch in Create Form (Super Admin)
  const handleCreateJenjangChange = (newJenjang: string) => {
    setCreateJenjang(newJenjang);
    if (newJenjang === "SD") {
      setCreateFrom("Kepala Sekolah SD");
    } else if (newJenjang === "SMP") {
      setCreateFrom("Kepala Sekolah SMP");
    } else {
      setCreateFrom("Tim IT / Sekolah");
    }
    setCreateTargetKelas("");
  };

  // Handle Jenjang Switch in Edit Form (Super Admin)
  const handleEditJenjangChange = (newJenjang: string) => {
    setEditJenjang(newJenjang);
    setEditTargetKelas("");
    if (newJenjang === "SD") {
      setEditFrom("Kepala Sekolah SD");
    } else if (newJenjang === "SMP") {
      setEditFrom("Kepala Sekolah SMP");
    } else {
      setEditFrom("Tim IT / Sekolah");
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const initialJenjang = isSuperAdmin ? "ALL" : adminJenjang;
    setCreateJenjang(initialJenjang);
    setCreateFrom(
      initialJenjang === "SD"
        ? "Kepala Sekolah SD"
        : initialJenjang === "SMP"
        ? "Kepala Sekolah SMP"
        : "Tim IT / Sekolah"
    );
    setCreateTargetType("ALL");
    setCreateTargetKelas("");
    setCreateFile(null);
    setOpenCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: AnnouncementItem) => {
    setEditTarget(item);
    setEditTitle(item.title || "");
    setEditPengumuman(htmlToPlainText(item.pengumuman || ""));
    setEditJenjang(item.jenjang || (isSuperAdmin ? "ALL" : adminJenjang));
    setEditFrom(item.from || "Tim IT / Sekolah");

    if (item.target_kelas) {
      setEditTargetType("KELAS");
      setEditTargetKelas(item.target_kelas);
    } else if (item.target_role === "GURU") {
      setEditTargetType("GURU");
      setEditTargetKelas("");
    } else if (item.target_role === "SISWA") {
      setEditTargetType("SISWA");
      setEditTargetKelas("");
    } else {
      setEditTargetType("ALL");
      setEditTargetKelas("");
    }

    setEditFile(null);
    setRemoveExistingFile(false);
  };

  // File Change Handlers
  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran berkas melebihi batas maksimal 2MB.");
        e.target.value = "";
        return;
      }
      setCreateFile(file);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran berkas melebihi batas maksimal 2MB.");
        e.target.value = "";
        return;
      }
      setEditFile(file);
      setRemoveExistingFile(false);
    }
  };

  // Submit Handler: Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (createTargetType === "KELAS" && !createTargetKelas) {
      toast.error("Silakan pilih kelas sasaran.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const rawContent = (formData.get("pengumuman") as string) || "";
    formData.set("pengumuman", plainTextToHtml(rawContent));
    formData.set("jenjang", isSuperAdmin ? createJenjang : adminJenjang);
    formData.set("from", createFrom);

    if (createTargetType === "KELAS") {
      formData.set("target_role", "SISWA");
      formData.set("target_kelas", createTargetKelas);
    } else {
      formData.set("target_role", createTargetType);
      formData.set("target_kelas", "");
    }

    try {
      const res = await createAnnouncementAction(formData);
      if (res.success) {
        toast.success(res.message || "Pengumuman berhasil dipublikasikan!");
        setOpenCreateModal(false);
        setCreateFile(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menerbitkan pengumuman.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler: Update Announcement
  const handleUpdateAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;

    if (!editTitle.trim()) {
      toast.error("Judul pengumuman wajib diisi.");
      return;
    }

    if (!editPengumuman.trim()) {
      toast.error("Isi konten pengumuman wajib diisi.");
      return;
    }

    if (editTargetType === "KELAS" && !editTargetKelas) {
      toast.error("Silakan pilih kelas sasaran.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("title", editTitle.trim());
    formData.set("pengumuman", plainTextToHtml(editPengumuman));
    formData.set("jenjang", isSuperAdmin ? editJenjang : adminJenjang);
    formData.set("from", editFrom);

    if (editTargetType === "KELAS") {
      formData.set("target_role", "SISWA");
      formData.set("target_kelas", editTargetKelas);
    } else {
      formData.set("target_role", editTargetType);
      formData.set("target_kelas", "");
    }

    if (removeExistingFile && !editFile) {
      formData.set("file", "");
    } else if (!editFile && editTarget.file) {
      formData.set("file", editTarget.file);
    }

    try {
      const res = await updateAnnouncementAction(editTarget.id, formData);
      if (res.success) {
        toast.success(res.message || "Pengumuman berhasil diperbarui!");
        setEditTarget(null);
        setEditFile(null);
        setRemoveExistingFile(false);
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

  // Submit Handler: Delete Announcement
  const handleDeleteAnnouncement = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await deleteAnnouncementAction(deleteTarget.id);
      if (res.success) {
        toast.success(res.message || "Pengumuman berhasil dihapus.");
        setAnnouncements((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus pengumuman.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const isFilterActive =
    search.trim() !== "" ||
    filterJenjang !== "ALL" ||
    filterTarget !== "ALL" ||
    filterAttachment !== "ALL";

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header Area */}
      <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Megaphone className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
              Manajemen Pengumuman
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Publikasikan informasi resmi, agenda kegiatan, dan surat edaran sekolah.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Mini Metric Cards (Rapi di Mobile, iPad, dan Desktop) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
              Total
            </span>
            <p className="text-lg sm:text-2xl font-bold text-foreground">{totalCount}</p>
          </div>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-muted hidden sm:flex items-center justify-center text-muted-foreground shrink-0">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
              Lampiran
            </span>
            <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {withFileCount}
            </p>
          </div>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-500/10 hidden sm:flex items-center justify-center text-emerald-600 shrink-0">
            <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
              Umum
            </span>
            <p className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {generalCount}
            </p>
          </div>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-indigo-500/10 hidden sm:flex items-center justify-center text-indigo-600 shrink-0">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Toolbar with Action Button */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs space-y-2.5 sm:space-y-3">
        {/* Baris 1: Pencarian & Tombol Buat Pengumuman */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari judul, isi, pengirim, atau kelas..."
              className="pl-9 pr-8 h-9.5 sm:h-10 text-xs sm:text-sm rounded-xl bg-background border-border shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                title="Bersihkan pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Button
            type="button"
            onClick={handleOpenCreate}
            className="h-9.5 sm:h-10 px-4 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs cursor-pointer shrink-0 transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Pengumuman</span>
          </Button>
        </div>

        {/* Baris 2: Filter Dropdown & Reset (Rapi & Responsif) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Jenjang Filter (Khusus Super Admin) */}
          {isSuperAdmin && (
            <select
              value={filterJenjang}
              onChange={(e) => {
                setFilterJenjang(e.target.value);
                setPage(1);
              }}
              className="h-8.5 sm:h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer flex-1 sm:flex-none sm:min-w-[120px]"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="SD">Jenjang SD</option>
              <option value="SMP">Jenjang SMP</option>
            </select>
          )}

          {/* Target Penerima Filter */}
          <select
            value={filterTarget}
            onChange={(e) => {
              setFilterTarget(e.target.value);
              setPage(1);
            }}
            className="h-8.5 sm:h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer flex-1 sm:flex-none sm:min-w-[135px]"
          >
            <option value="ALL">Semua Target</option>
            <option value="ALL_ROLE">Umum (Semua)</option>
            <option value="GURU">Khusus Guru</option>
            <option value="SISWA">Khusus Siswa</option>
            <option value="KELAS">Khusus Kelas</option>
          </select>

          {/* Lampiran Filter */}
          <select
            value={filterAttachment}
            onChange={(e) => {
              setFilterAttachment(e.target.value as any);
              setPage(1);
            }}
            className="h-8.5 sm:h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer flex-1 sm:flex-none sm:min-w-[125px]"
          >
            <option value="ALL">Semua Lampiran</option>
            <option value="WITH_FILE">Ada Lampiran</option>
            <option value="NO_FILE">Tanpa Lampiran</option>
          </select>

          {/* Reset Filter Button */}
          {isFilterActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilterJenjang("ALL");
                setFilterTarget("ALL");
                setFilterAttachment("ALL");
                setPage(1);
              }}
              className="h-8.5 sm:h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg gap-1.5 cursor-pointer ml-auto sm:ml-0 shrink-0"
              title="Reset Filter"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4. Daftar Pengumuman (Card List Rapi & User Friendly) */}
      <div className="space-y-3.5">
        {paginated.length === 0 ? (
          <div className="p-6 sm:p-10 rounded-xl sm:rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <Megaphone className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Tidak ada pengumuman ditemukan
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {isFilterActive
                  ? "Tidak ada pengumuman yang sesuai dengan filter atau kata kunci pencarian Anda."
                  : "Belum ada pengumuman yang diterbitkan di sistem sekolah. Klik tombol 'Buat Pengumuman' untuk menambahkan."}
              </p>
            </div>
            {isFilterActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFilterJenjang("ALL");
                  setFilterTarget("ALL");
                  setFilterAttachment("ALL");
                  setPage(1);
                }}
                className="text-xs rounded-xl"
              >
                Reset Filter Pencarian
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Buat Pengumuman Baru
              </Button>
            )}
          </div>
        ) : (
          paginated.map((item) => {
            const likesCount = parseInt(item.like || "0", 10) || 0;
            const itemJenjang = item.jenjang || "ALL";

            return (
              <Card
                key={item.id}
                className="rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs hover:border-emerald-500/30 transition-all overflow-hidden"
              >
                <CardContent className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
                  {/* Top Row: Meta Penerbit, Tanggal, dan Aksi */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/40">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] sm:text-xs text-muted-foreground min-w-0">
                      {/* Jenjang Badge (Hanya tampil jika spesifik SD atau SMP) */}
                      {itemJenjang !== "ALL" && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-bold text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md border shrink-0",
                            itemJenjang === "SD" &&
                              "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
                            itemJenjang === "SMP" &&
                              "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                          )}
                        >
                          {itemJenjang}
                        </Badge>
                      )}

                      {/* Target Penerima (Hanya tampil jika spesifik ke Kelas, Guru, atau Siswa) */}
                      {item.target_kelas ? (
                        <Badge
                          variant="secondary"
                          className="font-medium text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md shrink-0"
                        >
                          Kelas {item.target_kelas}
                        </Badge>
                      ) : item.target_role === "GURU" ? (
                        <Badge
                          variant="outline"
                          className="font-medium text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 shrink-0"
                        >
                          Khusus Guru
                        </Badge>
                      ) : item.target_role === "SISWA" ? (
                        <Badge
                          variant="outline"
                          className="font-medium text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 shrink-0"
                        >
                          Khusus Siswa
                        </Badge>
                      ) : null}

                      {/* Pengirim & Tanggal */}
                      <span className="font-semibold text-foreground/80 truncate max-w-[140px] sm:max-w-none">
                        {item.from || "Sekolah"}
                      </span>
                      <span>•</span>
                      <span className="shrink-0">
                        {item.created_at ? formatDateIndo(item.created_at) : "Baru saja"}
                      </span>
                    </div>

                    {/* Action Buttons: Edit & Delete */}
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="h-7 sm:h-8 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 rounded-lg gap-1 cursor-pointer transition-colors"
                        title="Edit Pengumuman"
                      >
                        <Pencil className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="font-medium text-[11px] sm:text-xs">Edit</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(item)}
                        className="h-7 sm:h-8 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 rounded-lg gap-1 cursor-pointer transition-colors"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        <span className="font-medium text-[11px] sm:text-xs">Hapus</span>
                      </Button>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug">
                    {item.title}
                  </h2>

                  {/* Attachment Box (Preview / Zoom / Download) */}
                  {item.file && (
                    <div className="pt-0.5">
                      <AnnouncementAttachment
                        fileUrl={item.file}
                        title={item.title}
                        defaultExpanded={true}
                      />
                    </div>
                  )}

                  {/* Content (Render HTML / Text with formatting) */}
                  <div
                    className="text-xs sm:text-sm text-foreground/85 leading-relaxed prose dark:prose-invert max-w-none pt-0.5"
                    dangerouslySetInnerHTML={{ __html: item.pengumuman }}
                  />

                  {/* Card Footer: Likes Counter if any */}
                  {likesCount > 0 && (
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                        <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                        <span>{likesCount} menyukai pengumuman ini</span>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 5. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1 pt-1">
          <div>
            Menampilkan <strong className="text-foreground">{paginated.length}</strong> dari{" "}
            <strong className="text-foreground">{filtered.length}</strong> pengumuman
            {filtered.length !== announcements.length &&
              ` (dari total ${announcements.length})`}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="h-8 px-3 text-xs rounded-xl cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Sebelumnya
            </Button>
            <span className="text-xs font-semibold px-2">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="h-8 px-3 text-xs rounded-xl cursor-pointer"
            >
              Selanjutnya <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: BUAT PENGUMUMAN BARU                            */}
      {/* ======================================================== */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-xl font-bold text-foreground">
                  Publikasikan Pengumuman Baru
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Pengumuman akan langsung tampil di dashboard admin, guru, dan siswa terkait.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4 pt-1">
            {/* 1. Pengaturan Jenjang Publikasi (Khusus Super Admin) */}
            {isSuperAdmin ? (
              <div className="space-y-1.5">
                <Label htmlFor="create-jenjang" className="text-xs font-semibold">
                  Target Jenjang <span className="text-rose-500">*</span>
                </Label>
                <select
                  id="create-jenjang"
                  value={createJenjang}
                  onChange={(e) => handleCreateJenjangChange(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer h-10"
                >
                  <option value="ALL">Semua Jenjang (SD & SMP)</option>
                  <option value="SD">Jenjang SD</option>
                  <option value="SMP">Jenjang SMP</option>
                </select>
              </div>
            ) : (
              <input type="hidden" name="jenjang" value={adminJenjang} />
            )}

            {/* 2. Judul Pengumuman */}
            <div className="space-y-1.5">
              <Label htmlFor="create-title" className="text-xs font-semibold">
                Judul Pengumuman <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="create-title"
                name="title"
                placeholder="Contoh: Jadwal Penilaian Tengah Semester (PTS) Genap"
                required
                className="text-xs sm:text-sm font-medium rounded-xl h-10 focus-visible:ring-emerald-500"
              />
            </div>

            {/* 3. Pengirim & Sasaran Penerima */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pengirim */}
              <div className="space-y-1.5">
                <Label htmlFor="create-from" className="text-xs font-semibold">
                  Identitas Pengirim
                </Label>
                <select
                  id="create-from"
                  value={createFrom}
                  onChange={(e) => setCreateFrom(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer h-10"
                >
                  {createJenjang === "SD" && (
                    <>
                      <option value="Kepala Sekolah SD">Kepala Sekolah SD</option>
                      <option value="Bidang Kurikulum SD">Bidang Kurikulum SD</option>
                      <option value="Bidang Kesiswaan SD">Bidang Kesiswaan SD</option>
                      <option value="Admin SD">Admin SD</option>
                    </>
                  )}
                  {createJenjang === "SMP" && (
                    <>
                      <option value="Kepala Sekolah SMP">Kepala Sekolah SMP</option>
                      <option value="Bidang Kurikulum SMP">Bidang Kurikulum SMP</option>
                      <option value="Bidang Kesiswaan SMP">Bidang Kesiswaan SMP</option>
                      <option value="Admin SMP">Admin SMP</option>
                    </>
                  )}
                  {createJenjang === "ALL" && (
                    <>
                      <option value="Tim IT / Sekolah">Tim IT / Sekolah</option>
                      <option value="Yayasan / Pimpinan">Yayasan / Pimpinan Sekolah</option>
                      <option value="Kepala Sekolah SD & SMP">Kepala Sekolah (SD & SMP)</option>
                      <option value="Humas Sekolah">Humas Sekolah</option>
                    </>
                  )}
                </select>
              </div>

              {/* Sasaran Penerima */}
              <div className="space-y-1.5">
                <Label htmlFor="create-target-type" className="text-xs font-semibold">
                  Sasaran Penerima
                </Label>
                <select
                  id="create-target-type"
                  value={createTargetType}
                  onChange={(e) =>
                    setCreateTargetType(e.target.value as "ALL" | "GURU" | "SISWA" | "KELAS")
                  }
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer h-10"
                >
                  <option value="ALL">
                    {createJenjang === "ALL"
                      ? "Semua (Guru & Siswa)"
                      : `Semua Civitas ${createJenjang}`}
                  </option>
                  <option value="GURU">
                    {createJenjang === "ALL"
                      ? "Khusus Guru"
                      : `Khusus Guru ${createJenjang}`}
                  </option>
                  <option value="SISWA">
                    {createJenjang === "ALL"
                      ? "Khusus Siswa & Wali"
                      : `Khusus Siswa ${createJenjang}`}
                  </option>
                  <option value="KELAS">
                    {createJenjang === "ALL"
                      ? "Pilih Kelas Tertentu..."
                      : `Pilih Kelas ${createJenjang}...`}
                  </option>
                </select>
              </div>
            </div>

            {/* Pilihan Rombel Kelas jika Sasaran = KELAS */}
            {createTargetType === "KELAS" && (
              <div className="space-y-1.5 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                <Label htmlFor="create-target-kelas" className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Pilih Kelas Tujuan <span className="text-rose-500">*</span>
                </Label>
                <select
                  id="create-target-kelas"
                  value={createTargetKelas}
                  onChange={(e) => setCreateTargetKelas(e.target.value)}
                  required
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer h-10"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {availableCreateClasses.map((c) => (
                    <option key={c.id} value={c.nama_kelas}>
                      {c.nama_kelas} {c.jenjang ? `(${c.jenjang})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 4. Upload Lampiran Berkas */}
            <div className="space-y-1.5">
              <Label htmlFor="create-file" className="text-xs font-semibold">
                Lampiran Berkas (PDF / Gambar) - Opsional
              </Label>
              <input
                id="create-file"
                name="file_upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleCreateFileChange}
                className="w-full text-xs rounded-xl border border-input bg-background p-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-700 dark:file:text-emerald-300 hover:file:bg-emerald-500/20 cursor-pointer h-10"
              />
              <p className="text-[11px] text-muted-foreground">
                Maksimal ukuran berkas 2MB (format: PDF, JPG, PNG, WEBP).
              </p>

              {/* Selected File Badge Preview */}
              {createFile && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-foreground truncate">
                      {createFile.name}
                    </span>
                    <span className="text-muted-foreground text-[11px] shrink-0">
                      ({(createFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreateFile(null)}
                    className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer shrink-0"
                    title="Hapus berkas yang dipilih"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 5. Isi Konten Pengumuman */}
            <div className="space-y-1.5">
              <Label htmlFor="create-pengumuman" className="text-xs font-semibold">
                Isi Konten Pengumuman <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="create-pengumuman"
                name="pengumuman"
                placeholder="Tuliskan isi pengumuman lengkap di sini..."
                rows={6}
                required
                className="text-xs sm:text-sm leading-relaxed rounded-xl p-3 focus-visible:ring-emerald-500"
              />
            </div>

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenCreateModal(false)}
                disabled={isSubmitting}
                className="text-xs rounded-xl h-9.5 px-4 cursor-pointer w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9.5 px-5 cursor-pointer shadow-sm w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menerbitkan...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Terbitkan Pengumuman</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 2: EDIT PENGUMUMAN                                 */}
      {/* ======================================================== */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-xl font-bold text-foreground">
                  Edit Pengumuman
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Perbarui isi pengumuman, pengirim, sasaran penerima, atau berkas lampiran.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editTarget && (
            <form onSubmit={handleUpdateAnnouncement} className="space-y-4 pt-1">
              {/* 1. Pengaturan Jenjang Publikasi (Khusus Super Admin) */}
              {isSuperAdmin ? (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-jenjang" className="text-xs font-semibold">
                    Target Jenjang <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="edit-jenjang"
                    value={editJenjang}
                    onChange={(e) => handleEditJenjangChange(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer h-10"
                  >
                    <option value="ALL">Semua Jenjang (SD & SMP)</option>
                    <option value="SD">Jenjang SD</option>
                    <option value="SMP">Jenjang SMP</option>
                  </select>
                </div>
              ) : (
                <input type="hidden" name="jenjang" value={adminJenjang} />
              )}

              {/* 2. Judul Pengumuman */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-title" className="text-xs font-semibold">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Judul pengumuman..."
                  required
                  className="text-xs sm:text-sm font-medium rounded-xl h-10 focus-visible:ring-amber-500"
                />
              </div>

              {/* 3. Pengirim & Sasaran Penerima */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pengirim */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-from" className="text-xs font-semibold">
                    Identitas Pengirim
                  </Label>
                  <select
                    id="edit-from"
                    value={editFrom}
                    onChange={(e) => setEditFrom(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs sm:text-sm font-medium shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer h-10"
                  >
                    {editJenjang === "SD" && (
                      <>
                        <option value="Kepala Sekolah SD">Kepala Sekolah SD</option>
                        <option value="Bidang Kurikulum SD">Bidang Kurikulum SD</option>
                        <option value="Bidang Kesiswaan SD">Bidang Kesiswaan SD</option>
                        <option value="Admin SD">Admin SD</option>
                      </>
                    )}
                    {editJenjang === "SMP" && (
                      <>
                        <option value="Kepala Sekolah SMP">Kepala Sekolah SMP</option>
                        <option value="Bidang Kurikulum SMP">Bidang Kurikulum SMP</option>
                        <option value="Bidang Kesiswaan SMP">Bidang Kesiswaan SMP</option>
                        <option value="Admin SMP">Admin SMP</option>
                      </>
                    )}
                    {editJenjang === "ALL" && (
                      <>
                        <option value="Tim IT / Sekolah">Tim IT / Sekolah</option>
                        <option value="Yayasan / Pimpinan">Yayasan / Pimpinan Sekolah</option>
                        <option value="Kepala Sekolah SD & SMP">Kepala Sekolah (SD & SMP)</option>
                        <option value="Humas Sekolah">Humas Sekolah</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Sasaran Penerima */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-target-type" className="text-xs font-semibold">
                    Sasaran Penerima
                  </Label>
                  <select
                    id="edit-target-type"
                    value={editTargetType}
                    onChange={(e) =>
                      setEditTargetType(e.target.value as "ALL" | "GURU" | "SISWA" | "KELAS")
                    }
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs sm:text-sm font-medium shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer h-10"
                  >
                    <option value="ALL">
                      {editJenjang === "ALL"
                        ? "Semua (Guru & Siswa)"
                        : `Semua Civitas ${editJenjang}`}
                    </option>
                    <option value="GURU">
                      {editJenjang === "ALL"
                        ? "Khusus Guru"
                        : `Khusus Guru ${editJenjang}`}
                    </option>
                    <option value="SISWA">
                      {editJenjang === "ALL"
                        ? "Khusus Siswa & Wali"
                        : `Khusus Siswa ${editJenjang}`}
                    </option>
                    <option value="KELAS">
                      {editJenjang === "ALL"
                        ? "Pilih Kelas Tertentu..."
                        : `Pilih Kelas ${editJenjang}...`}
                    </option>
                  </select>
                </div>
              </div>

              {/* Pilihan Rombel Kelas jika Sasaran = KELAS */}
              {editTargetType === "KELAS" && (
                <div className="space-y-1.5 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                  <Label htmlFor="edit-target-kelas" className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Pilih Kelas Tujuan <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="edit-target-kelas"
                    value={editTargetKelas}
                    onChange={(e) => setEditTargetKelas(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs sm:text-sm font-semibold shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer h-10"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {availableEditClasses.map((c) => (
                      <option key={c.id} value={c.nama_kelas}>
                        {c.nama_kelas} {c.jenjang ? `(${c.jenjang})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 4. Upload / Ganti Lampiran */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-file" className="text-xs font-semibold">
                  Lampiran Berkas (PDF / Gambar) - Opsional
                </Label>

                {/* Existing File Info */}
                {editTarget.file && !removeExistingFile && !editFile && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-2.5 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Paperclip className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-xs truncate">
                          {editTarget.file.split("/").pop()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Lampiran saat ini terpasang
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRemoveExistingFile(true)}
                      className="h-7 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30 rounded-lg px-2.5 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Hapus
                    </Button>
                  </div>
                )}

                {/* Existing File Marked for Removal */}
                {removeExistingFile && !editFile && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 p-2.5 text-xs">
                    <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs">
                      Lampiran saat ini akan dihapus setelah disimpan.
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoveExistingFile(false)}
                      className="h-7 text-[11px] text-muted-foreground hover:text-foreground rounded-lg px-2 shrink-0 cursor-pointer"
                    >
                      Batalkan
                    </Button>
                  </div>
                )}

                {/* Input Ganti Berkas */}
                <input
                  id="edit-file"
                  name="file_upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleEditFileChange}
                  className="w-full text-xs rounded-xl border border-input bg-background p-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-700 dark:file:text-amber-300 hover:file:bg-amber-500/20 cursor-pointer h-10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Maksimal ukuran berkas 2MB (format: PDF, JPG, PNG, WEBP).
                </p>

                {/* New Selected File Info */}
                {editFile && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="font-semibold text-foreground text-xs truncate">
                        Berkas pengganti: {editFile.name}
                      </span>
                      <span className="text-muted-foreground text-[10px] shrink-0">
                        ({(editFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditFile(null)}
                      className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer shrink-0"
                      title="Batal pilih berkas baru"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 5. Isi Konten Pengumuman */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-pengumuman" className="text-xs font-semibold">
                  Isi Konten Pengumuman <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="edit-pengumuman"
                  name="pengumuman"
                  value={editPengumuman}
                  onChange={(e) => setEditPengumuman(e.target.value)}
                  rows={6}
                  required
                  placeholder="Tuliskan isi pengumuman lengkap di sini..."
                  className="text-xs sm:text-sm leading-relaxed rounded-xl p-3 focus-visible:ring-amber-500"
                />
              </div>

              <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditTarget(null)}
                  disabled={isSubmitting}
                  className="text-xs rounded-xl h-9.5 px-4 cursor-pointer w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-9.5 px-5 cursor-pointer shadow-sm w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 3: KONFIRMASI HAPUS                                */}
      {/* ======================================================== */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-rose-600 dark:text-rose-400">
                  Hapus Pengumuman Ini?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Pengumuman yang dihapus tidak dapat dipulihkan kembali.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteTarget && (
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs space-y-1">
              <p className="font-semibold text-foreground text-sm line-clamp-2">
                &ldquo;{deleteTarget.title}&rdquo;
              </p>
              {deleteTarget.created_at && (
                <p className="text-muted-foreground text-[11px]">
                  Diterbitkan pada {formatDateIndo(deleteTarget.created_at)}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="text-xs rounded-xl w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteAnnouncement}
              disabled={isDeleting}
              className="gap-1.5 font-bold text-xs rounded-xl bg-rose-600 hover:bg-rose-700 w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Ya, Hapus Sekarang</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
