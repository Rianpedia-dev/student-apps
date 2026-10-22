"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  FileText,
  Image as ImageIcon,
  Paperclip,
  X,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  CheckCircle2,
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
import { createAnnouncementAction, deleteAnnouncementAction } from "@/actions/admin";
import { formatDateIndo } from "@/lib/utils";
import { AnnouncementAttachment } from "@/components/shared/announcement-attachment";
import { toast } from "sonner";

export interface AnnouncementItem {
  id: string;
  title: string;
  from: string | null;
  file: string | null;
  pengumuman: string;
  like?: string | null;
  created_at: string | Date | null;
  updated_at?: string | Date | null;
}

export interface ClassOption {
  id: string;
  nama_kelas: string;
}

interface AnnouncementsManagerProps {
  initialAnnouncements: AnnouncementItem[];
  classes: ClassOption[];
}

export function AnnouncementsManager({
  initialAnnouncements,
  classes,
}: AnnouncementsManagerProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements);
  const [search, setSearch] = useState("");
  const [filterTarget, setFilterTarget] = useState<string>("ALL");
  const [filterAttachment, setFilterAttachment] = useState<"ALL" | "WITH_FILE" | "NO_FILE">("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Modals state
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // File upload state in modal
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Badge sender color helper
  const getSenderBadgeVariant = (fromStr?: string | null) => {
    if (!fromStr) return "secondary";
    const lower = fromStr.toLowerCase();
    if (lower.includes("kepala")) return "indigo";
    if (lower.includes("admin") || lower.includes("it")) return "emerald";
    if (lower.includes("kurikulum")) return "teal";
    if (lower.includes("kesiswaan")) return "amber";
    return "smp";
  };

  // Filtered announcements
  const filtered = useMemo(() => {
    return announcements.filter((item) => {
      // Search by title or content
      const matchesSearch =
        search.trim() === "" ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.pengumuman.toLowerCase().includes(search.toLowerCase()) ||
        (item.from && item.from.toLowerCase().includes(search.toLowerCase()));

      // Target filter
      const matchesTarget =
        filterTarget === "ALL" ||
        (filterTarget === "IT" && (item.from === "IT" || item.from?.toLowerCase().includes("it"))) ||
        item.from === filterTarget;

      // Attachment filter
      const matchesAttachment =
        filterAttachment === "ALL"
          ? true
          : filterAttachment === "WITH_FILE"
          ? !!item.file
          : !item.file;

      return matchesSearch && matchesTarget && matchesAttachment;
    });
  }, [announcements, search, filterTarget, filterAttachment]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // File change handler in modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran berkas melebihi batas maksimal 2MB.");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
    }
  };

  // Form submit handler for creating announcement
  const handleCreateAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await createAnnouncementAction(formData);
      if (res.success) {
        toast.success(res.message || "Pengumuman berhasil dipublikasikan!");
        setOpenCreateModal(false);
        setSelectedFile(null);
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

  // Delete announcement handler
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

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-emerald-500/20 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 sm:p-5 backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Kelola Pengumuman Sekolah
          </h1>

          {/* Primary Action: Buat Pengumuman */}
          <Button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setOpenCreateModal(true);
            }}
            size="lg"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 cursor-pointer self-start sm:self-auto shrink-0 transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Pengumuman</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-card shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari judul atau isi pengumuman..."
            className="pl-9 text-xs sm:text-sm h-9 bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Target / Pengirim */}
          <select
            value={filterTarget}
            onChange={(e) => {
              setFilterTarget(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[140px]"
          >
            <option value="ALL">Semua Sasaran</option>
            <option value="IT">Tim IT / Sekolah</option>
            <option value="Kepala Sekolah">Kepala Sekolah</option>
            <option value="Kurikulum">Kurikulum</option>
            <option value="Kesiswaan">Kesiswaan</option>
            {classes.length > 0 && (
              <optgroup label="Khusus Kelas">
                {classes.map((c) => (
                  <option key={c.id} value={c.nama_kelas}>
                    {c.nama_kelas}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Lampiran filter */}
          <select
            value={filterAttachment}
            onChange={(e) => {
              setFilterAttachment(e.target.value as any);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Lampiran</option>
            <option value="WITH_FILE">Ada Lampiran Berkas</option>
            <option value="NO_FILE">Tanpa Lampiran</option>
          </select>
        </div>
      </div>

      {/* List of Announcements */}
      <div className="space-y-4">
        {paginated.length === 0 ? (
          <Card className="border-dashed border-border py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <Megaphone className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Tidak ada pengumuman ditemukan
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {search || filterTarget !== "ALL" || filterAttachment !== "ALL"
                  ? "Tidak ada data yang cocok dengan kriteria filter atau pencarian Anda."
                  : "Belum ada pengumuman yang diterbitkan. Klik tombol 'Buat Pengumuman' di atas untuk mempublikasikan pengumuman baru."}
              </p>
              {(search || filterTarget !== "ALL" || filterAttachment !== "ALL") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setFilterTarget("ALL");
                    setFilterAttachment("ALL");
                  }}
                  className="mt-3 text-xs"
                >
                  Reset Filter
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          paginated.map((item) => {
            const hasAttachment = Boolean(item.file);
            return (
              <Card
                key={item.id}
                className="overflow-hidden border border-border/80 bg-card hover:border-emerald-500/40 transition-all shadow-xs"
              >
                <div className="h-1 bg-linear-to-r from-emerald-500 to-teal-500" />
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  {/* Top Bar: Sender, Date, & Actions */}
                  <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getSenderBadgeVariant(item.from) as any} size="sm">
                        {item.from || "Sekolah"}
                      </Badge>

                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {item.created_at ? formatDateIndo(item.created_at) : "Baru saja"}
                      </span>

                      {hasAttachment && (
                        <Badge variant="outline" size="sm" className="gap-1 border-muted-foreground/30 text-[10px]">
                          <Paperclip className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Lampiran Tersedia</span>
                        </Badge>
                      )}
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/admin/announcements/${item.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1"
                          title="Edit Pengumuman"
                        >
                          <Pencil className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(item)}
                        className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-400 gap-1"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Hapus</span>
                      </Button>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug">
                    {item.title}
                  </h2>

                  {/* Attachment Box */}
                  {item.file && (
                    <div className="pt-1">
                      <AnnouncementAttachment
                        fileUrl={item.file}
                        title={item.title}
                        defaultExpanded={true}
                      />
                    </div>
                  )}

                  {/* HTML / Text Content */}
                  <div
                    className="text-xs sm:text-sm text-foreground/80 leading-relaxed prose dark:prose-invert max-w-none pt-1"
                    dangerouslySetInnerHTML={{ __html: item.pengumuman }}
                  />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1 pt-2">
          <div>
            Menampilkan {paginated.length} dari {filtered.length} pengumuman
            {filtered.length !== announcements.length && ` (Total data: ${announcements.length})`}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="h-8 px-3 text-xs"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
            </Button>
            <span className="text-xs font-medium px-2">
              Halaman {page} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="h-8 px-3 text-xs"
            >
              Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CREATE PENGUMUMAN                                  */}
      {/* ======================================================== */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="max-w-xl rounded-2xl p-6 overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  Publikasikan Pengumuman Baru
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Informasi akan langsung tampil di dashboard admin, guru, dan siswa terkait.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4 pt-2">
            {/* Judul Pengumuman */}
            <div className="space-y-1.5">
              <Label htmlFor="create-title" className="text-xs font-semibold">
                Judul Pengumuman <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="create-title"
                name="title"
                placeholder="Contoh: Jadwal Ujian Tengah Semester Genap 2026/2027"
                required
                className="text-xs sm:text-sm font-medium"
              />
            </div>

            {/* Grid Pengirim / Sasaran & Lampiran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="create-from" className="text-xs font-semibold">
                  Pengirim / Sasaran
                </Label>
                <select
                  id="create-from"
                  name="from"
                  defaultValue="IT"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="IT">Tim IT / Sekolah (Semua Pengguna)</option>
                  <option value="Kepala Sekolah">Kepala Sekolah</option>
                  <option value="Kurikulum">Bidang Kurikulum</option>
                  <option value="Kesiswaan">Bidang Kesiswaan</option>
                  {classes.length > 0 && (
                    <optgroup label="Khusus Kelas">
                      {classes.map((c) => (
                        <option key={c.id} value={c.nama_kelas}>
                          {c.nama_kelas}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Upload Lampiran */}
              <div className="space-y-1.5">
                <Label htmlFor="create-file" className="text-xs font-semibold">
                  Lampiran Berkas (PDF / Gambar)
                </Label>
                <div className="relative">
                  <input
                    id="create-file"
                    name="file_upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="w-full text-xs rounded-md border border-input bg-background p-1.5 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-700 dark:file:text-emerald-300 hover:file:bg-emerald-500/20 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Maksimal berkas 2MB (PDF, JPG, PNG).
                </p>
              </div>
            </div>

            {/* Selected File Notice if any */}
            {selectedFile && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-foreground truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-muted-foreground text-[11px] shrink-0">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-muted-foreground hover:text-rose-500 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Konten Pengumuman */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="create-pengumuman" className="text-xs font-semibold">
                  Isi Konten Pengumuman <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Mendukung teks biasa dan HTML
                </span>
              </div>
              <Textarea
                id="create-pengumuman"
                name="pengumuman"
                placeholder="Tuliskan isi pengumuman lengkap di sini..."
                rows={7}
                required
                className="text-xs sm:text-sm leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenCreateModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menerbitkan...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Terbitkan Pengumuman</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL KONFIRMASI HAPUS                                  */}
      {/* ======================================================== */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-rose-600 dark:text-rose-400">
                  Hapus Pengumuman Ini?
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Pengumuman yang dihapus tidak dapat dipulihkan kembali.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteTarget && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground line-clamp-2">
                {deleteTarget.title}
              </p>
              <p className="text-muted-foreground text-[11px]">
                Sasaran: <strong>{deleteTarget.from || "Sekolah"}</strong> • Diterbitkan:{" "}
                {deleteTarget.created_at ? formatDateIndo(deleteTarget.created_at) : "-"}
              </p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteAnnouncement}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Ya, Hapus</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
