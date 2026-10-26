"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  BookOpen,
  Check,
  X,
  Loader2,
  MoreVertical,
  Pencil,
  Download,
  FileSpreadsheet,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createMataPelajaranAction,
  updateMataPelajaranAction,
  deleteMataPelajaranAction,
  deleteMataPelajaranBulkAction,
  importMataPelajaranAction,
} from "@/actions/subject";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface SubjectItem {
  id: string;
  kode: string;
  nama: string;
  jenjang: string;
  deskripsi: string;
  icon: string;
  warna: string;
  totalJadwal: number;
  totalTugas: number;
}

interface SubjectsManagerProps {
  initialSubjects: SubjectItem[];
  adminJenjang?: "SD" | "SMP" | "ALL";
  activeJenjang?: "SD" | "SMP" | "ALL";
}

const AVAILABLE_MAPEL_EXPORT_FIELDS = [
  { id: "no", label: "No (Nomor Urut)", default: true },
  { id: "kode", label: "Kode Mata Pelajaran", default: true },
  { id: "nama", label: "Nama Mata Pelajaran", default: true },
  { id: "jenjang", label: "Jenjang (SD/SMP/SEMUA)", default: true },
  { id: "deskripsi", label: "Deskripsi Pembelajaran", default: true },
];

export function SubjectsManager({
  initialSubjects,
  adminJenjang = "ALL",
  activeJenjang = "ALL",
}: SubjectsManagerProps) {
  const router = useRouter();
  const isSuperAdmin = adminJenjang === "ALL";
  const [subjects, setSubjects] = useState<SubjectItem[]>(initialSubjects);
  const [search, setSearch] = useState("");
  const [filterJenjang, setFilterJenjang] = useState<"SEMUA" | "SD" | "SMP" | "SD_SMP">("SEMUA");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [openModal, setOpenModal] = useState(false);
  const [editTarget, setEditTarget] = useState<SubjectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);
  const [openBulkDeleteModal, setOpenBulkDeleteModal] = useState(false);
  const [openExportModal, setOpenExportModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Export customization state
  const [exportScope, setExportScope] = useState<"all" | "selected" | "filtered" | "custom">("all");
  const [exportJenjang, setExportJenjang] = useState<"all" | "SD" | "SMP" | "SEMUA">("all");
  const [exportFields, setExportFields] = useState<string[]>([
    "no",
    "kode",
    "nama",
    "jenjang",
    "deskripsi",
  ]);

  // Filtering
  const filtered = subjects.filter((s) => {
    const matchesSearch =
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.kode.toLowerCase().includes(search.toLowerCase());
    const matchesJenjang =
      filterJenjang === "SEMUA"
        ? true
        : filterJenjang === "SD_SMP"
        ? s.jenjang === "SEMUA"
        : s.jenjang === filterJenjang;
    return matchesSearch && matchesJenjang;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Multiple selection helpers
  const currentPageIds = paginated.map((s) => s.id);
  const isAllCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.includes(id));
  const isSomeCurrentPageSelected =
    currentPageIds.some((id) => selectedIds.includes(id)) &&
    !isAllCurrentPageSelected;

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(filtered.map((s) => s.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await deleteMataPelajaranBulkAction(selectedIds);
      if (res.success) {
        setSubjects((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
        toast.success(res.message || `Berhasil menghapus ${selectedIds.length} mata pelajaran.`);
        setSelectedIds([]);
        setOpenBulkDeleteModal(false);
      } else {
        toast.error(res.error || "Gagal menghapus beberapa mata pelajaran.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Target data mapel yang akan diekspor sesuai modal
  const exportTargetSubjects = useMemo(() => {
    if (exportScope === "selected") {
      return subjects.filter((s) => selectedIds.includes(s.id));
    }
    if (exportScope === "filtered") {
      return filtered;
    }
    if (exportScope === "all") {
      return subjects;
    }
    // custom scope
    return subjects.filter((s) => {
      const matchJenjang =
        exportJenjang === "all" ? true : s.jenjang === exportJenjang;
      return matchJenjang;
    });
  }, [exportScope, selectedIds, filtered, subjects, exportJenjang]);

  const handleOpenExportModal = () => {
    if (selectedIds.length > 0) {
      setExportScope("selected");
    } else if (search || filterJenjang !== "SEMUA") {
      setExportScope("filtered");
    } else {
      setExportScope("all");
    }
    setOpenExportModal(true);
  };

  // Eksekusi Export Excel
  const handleExecuteExport = async () => {
    if (exportTargetSubjects.length === 0) {
      toast.error("Tidak ada data mata pelajaran untuk diekspor");
      return;
    }
    if (exportFields.length === 0) {
      toast.error("Pilih minimal satu kolom data untuk diekspor");
      return;
    }

    try {
      setIsExporting(true);
      const XLSX = await import("xlsx");

      const exportData = exportTargetSubjects.map((s, idx) => {
        const row: Record<string, any> = {};
        if (exportFields.includes("no")) row["No"] = idx + 1;
        if (exportFields.includes("kode")) row["Kode Mapel"] = s.kode;
        if (exportFields.includes("nama")) row["Nama Mata Pelajaran"] = s.nama;
        if (exportFields.includes("jenjang")) {
          row["Jenjang"] = s.jenjang === "SEMUA" ? "SD & SMP" : s.jenjang;
        }
        if (exportFields.includes("warna")) row["Warna Badge"] = s.warna;
        if (exportFields.includes("deskripsi")) row["Deskripsi"] = s.deskripsi || "-";
        if (exportFields.includes("totalJadwal")) row["Total Sesi Jadwal"] = s.totalJadwal;
        if (exportFields.includes("totalTugas")) row["Total Tugas"] = s.totalTugas;
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mata Pelajaran");

      const today = new Date().toISOString().split("T")[0];
      let filePrefix = "Data_Mata_Pelajaran";
      if (exportScope === "selected") {
        filePrefix = `Data_Mapel_Terpilih_${exportTargetSubjects.length}`;
      } else if (exportScope === "custom") {
        if (exportJenjang !== "all") filePrefix += `_${exportJenjang}`;
      } else if (filterJenjang !== "SEMUA") {
        filePrefix += `_${filterJenjang}`;
      }

      const fileName = `${filePrefix}_${today}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(
        `Berhasil mengekspor ${exportData.length} mata pelajaran (${exportFields.length} kolom).`
      );
      setOpenExportModal(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Gagal mengekspor data mata pelajaran ke Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  // Download Template Excel
  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");

      const templateData = [
        ["Kode Mapel", "Nama Mata Pelajaran", "Jenjang (SD/SMP/SEMUA)", "Deskripsi"],
        ["MTK", "Matematika", "SEMUA", "Mata pelajaran matematika dasar dan terapan"],
        ["IPA", "Ilmu Pengetahuan Alam", "SD", "Pembelajaran sains dan eksperimen alam"],
        ["ENG", "English Language", "SMP", "General English & conversation practice"],
        ["PAI", "Pendidikan Agama Islam", "SEMUA", "Akidah, akhlak, fiqih, dan tarikh Islam"],
      ];

      const guideData = [
        ["Nama Kolom", "Keterangan", "Wajib / Opsional", "Pilihan Nilai Valid"],
        ["Kode Mapel", "Kode unik mata pelajaran (huruf/angka)", "Wajib", "Contoh: MTK, IPA, PAI, ROBOTIK"],
        ["Nama Mata Pelajaran", "Nama lengkap mata pelajaran", "Wajib", "Contoh: Matematika Terapan & HOTS"],
        ["Jenjang (SD/SMP/SEMUA)", "Tingkat satuan pendidikan", "Opsional (Default: SEMUA)", "SD, SMP, atau SEMUA"],
        ["Deskripsi", "Catatan target pembelajaran dan silabus", "Opsional", "Deskripsi bebas materi mapel"],
      ];

      const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
      const wsGuide = XLSX.utils.aoa_to_sheet(guideData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsTemplate, "Template Mapel");
      XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan Kolom");

      XLSX.writeFile(wb, "Template_Import_Mata_Pelajaran.xlsx");
      toast.success("Template Excel Mata Pelajaran berhasil diunduh.");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("Gagal mengunduh template Excel.");
    }
  };

  // Import Excel Submit Handler
  const handleImportExcel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("excelFile") as HTMLInputElement;
    const defaultJenjangInput = e.currentTarget.elements.namedItem(
      "defaultJenjang"
    ) as HTMLSelectElement;
    const defaultJenjang = defaultJenjangInput?.value || "SEMUA";

    const file = input?.files?.[0];
    if (!file) {
      toast.error("Pilih file Excel terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64 = (evt.target?.result as string).split(",")[1];
        const res = await importMataPelajaranAction(base64, defaultJenjang);
        if (res.success) {
          toast.success(res.message);
          setOpenImportModal(false);
          window.location.reload();
        } else {
          toast.error(res.error || "Gagal mengimpor data mata pelajaran");
        }
      } catch {
        toast.error("Format file Excel tidak didukung");
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create single subject
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    // Otomatis pilih warna badge secara acak jika belum ada
    if (!formData.get("warna")) {
      const allowedWarna = ["emerald", "indigo", "violet", "amber", "rose", "teal"];
      const randomWarna = allowedWarna[Math.floor(Math.random() * allowedWarna.length)];
      formData.set("warna", randomWarna);
    }
    try {
      const res = await createMataPelajaranAction(formData);
      if (res.success) {
        toast.success(res.message);
        setOpenModal(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Gagal membuat mata pelajaran.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update single subject
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateMataPelajaranAction(editTarget.id, formData);
      if (res.success) {
        toast.success(res.message);
        const updatedKode = (
          (formData.get("kode_mapel") as string) || editTarget.kode
        ).toUpperCase();
        const updatedNama =
          (formData.get("nama_mapel") as string) || editTarget.nama;
        const updatedJenjang =
          (formData.get("jenjang") as string) || editTarget.jenjang;
        const updatedWarna =
          (formData.get("warna") as string) || editTarget.warna;
        const updatedDeskripsi =
          (formData.get("deskripsi") as string) || editTarget.deskripsi;

        setSubjects((prev) =>
          prev.map((s) =>
            s.id === editTarget.id
              ? {
                  ...s,
                  kode: updatedKode,
                  nama: updatedNama,
                  jenjang: updatedJenjang,
                  warna: updatedWarna,
                  deskripsi: updatedDeskripsi,
                }
              : s
          )
        );
        setEditTarget(null);
      } else {
        toast.error(res.error || "Gagal memperbarui mata pelajaran.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete single subject
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await deleteMataPelajaranAction(deleteTarget.id);
      if (res.success) {
        toast.success(res.message);
        setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast.error(res.error || "Gagal menghapus.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Filter Jenjang & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama atau kode mapel..."
              className="pl-9 h-9 text-xs sm:text-sm"
            />
          </div>

          {isSuperAdmin ? (
            <select
              value={filterJenjang}
              onChange={(e) => {
                setFilterJenjang(e.target.value as "SEMUA" | "SD" | "SMP" | "SD_SMP");
                setPage(1);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-auto min-w-[150px] cursor-pointer h-9"
            >
              <option value="SEMUA">Semua Jenjang</option>
              <option value="SD">Khusus Jenjang SD</option>
              <option value="SMP">Khusus Jenjang SMP</option>
              <option value="SD_SMP">SD & SMP (Keduanya)</option>
            </select>
          ) : (
            <select
              value={filterJenjang}
              onChange={(e) => {
                setFilterJenjang(e.target.value as "SEMUA" | "SD" | "SMP" | "SD_SMP");
                setPage(1);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-auto min-w-[150px] cursor-pointer h-9"
            >
              <option value="SEMUA">Semua Mapel ({adminJenjang} & Umum)</option>
              <option value={adminJenjang}>Khusus Jenjang {adminJenjang}</option>
              <option value="SD_SMP">Mapel Umum (SD & SMP)</option>
            </select>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setOpenBulkDeleteModal(true)}
              className="gap-1.5 border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs sm:text-sm font-medium"
              title="Hapus mata pelajaran terpilih"
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus ({selectedIds.length})</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleOpenExportModal}
            disabled={isExporting}
            className="gap-1.5 text-xs sm:text-sm"
            title="Ekspor daftar mata pelajaran ke file Excel"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isExporting ? "Mengekspor..." : "Export Excel"}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setOpenImportModal(true)}
            className="gap-1.5 text-xs sm:text-sm"
            title="Impor mata pelajaran dari file Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import Excel</span>
          </Button>

          <Button
            type="button"
            onClick={() => setOpenModal(true)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs sm:text-sm shadow-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Mapel</span>
          </Button>
        </div>
      </div>

      {/* Selection notice banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              <strong>{selectedIds.length}</strong> mata pelajaran dipilih.
            </span>
            {filtered.length > selectedIds.length && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="underline hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Pilih semua {filtered.length} mapel sesuai filter
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-muted-foreground hover:text-foreground underline cursor-pointer text-left sm:text-right"
          >
            Batalkan Pilihan
          </button>
        </div>
      )}

      {/* Table of Subjects */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-b border-border/80">
              <TableHead className="w-10 px-3 text-center">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = isSomeCurrentPageSelected;
                    }
                  }}
                  onChange={handleToggleCurrentPage}
                  className="h-4 w-4 rounded border-input text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  title={
                    isAllCurrentPageSelected
                      ? "Batalkan pilihan halaman ini"
                      : "Pilih semua mapel di halaman ini"
                  }
                />
              </TableHead>
              <TableHead className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                No
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[100px]">
                Kode
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[240px]">
                Nama Mata Pelajaran
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[130px]">
                Jenjang
              </TableHead>
              <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-14">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Search className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      Mata pelajaran tidak ditemukan
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm">
                      Tidak ada data yang cocok dengan kata kunci &ldquo;{search}&rdquo; atau filter jenjang yang dipilih.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((sub, idx) => {
                const isSelected = selectedIds.includes(sub.id);
                const actualIndex = (page - 1) * pageSize + idx + 1;
                return (
                  <TableRow
                    key={sub.id}
                    className={`transition-colors border-b border-border/60 ${
                      isSelected ? "bg-emerald-500/10" : "hover:bg-muted/40"
                    }`}
                  >
                    {/* Checkbox */}
                    <TableCell className="w-10 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(sub.id)}
                        className="h-4 w-4 rounded border-input text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                        title={isSelected ? "Batalkan pilihan" : "Pilih mata pelajaran ini"}
                      />
                    </TableCell>

                    {/* 1. No */}
                    <TableCell className="text-center text-xs font-medium text-muted-foreground/80 py-3.5">
                      {actualIndex}
                    </TableCell>

                    {/* 2. Kode */}
                    <TableCell className="py-3.5">
                      <Badge
                        variant={(sub.warna as any) || "emerald"}
                        size="sm"
                        className="font-bold font-mono uppercase"
                      >
                        {sub.kode}
                      </Badge>
                    </TableCell>

                    {/* 3. Nama Mata Pelajaran */}
                    <TableCell className="py-3.5">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {sub.nama}
                      </p>
                      {sub.deskripsi && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">
                          {sub.deskripsi}
                        </p>
                      )}
                    </TableCell>

                    {/* 4. Jenjang */}
                    <TableCell className="py-3.5">
                      <Badge
                        variant={
                          sub.jenjang === "SMP"
                            ? "smp"
                            : sub.jenjang === "SD"
                            ? "amber"
                            : "teal"
                        }
                        size="sm"
                      >
                        {sub.jenjang === "SEMUA"
                          ? "SD & SMP"
                          : `Jenjang ${sub.jenjang}`}
                      </Badge>
                    </TableCell>

                    {/* 5. Aksi */}
                    <TableCell
                      className="py-3.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          title="Pilihan Aksi"
                          aria-label={`Menu aksi ${sub.nama}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 p-1">
                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={() => setEditTarget(sub)}
                          >
                            <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span>Edit Data</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer gap-2 text-rose-600 dark:text-rose-400 focus:text-rose-600"
                            onClick={() => setDeleteTarget(sub)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Hapus Mapel</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination & Summary info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div>
          Menampilkan {paginated.length} dari {filtered.length} mata pelajaran
          {filtered.length !== subjects.length && ` (Total: ${subjects.length})`}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="h-8 w-8 p-0"
              title="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium px-2">
              Halaman {page} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="h-8 w-8 p-0"
              title="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Tambah Mata Pelajaran Baru</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-bold block mb-1">Kode Mata Pelajaran (Unik) *</label>
              <input
                type="text"
                name="kode_mapel"
                placeholder="Contoh: MTK, PAI, IPA, ROBOTIK"
                className="w-full text-xs uppercase font-mono rounded-xl border border-input bg-background p-2.5"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Nama Mata Pelajaran *</label>
              <input
                type="text"
                name="nama_mapel"
                placeholder="Contoh: Matematika Terapan & HOTS"
                className="w-full text-xs font-semibold rounded-xl border border-input bg-background p-2.5"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Jenjang *</label>
              {isSuperAdmin ? (
                <select
                  name="jenjang"
                  defaultValue="SEMUA"
                  className="w-full text-xs rounded-xl border border-input bg-background p-2.5 cursor-pointer"
                >
                  <option value="SEMUA">SD & SMP (Semua)</option>
                  <option value="SD">Khusus SD</option>
                  <option value="SMP">Khusus SMP</option>
                </select>
              ) : (
                <select
                  name="jenjang"
                  defaultValue={adminJenjang}
                  className="w-full text-xs rounded-xl border border-input bg-background p-2.5 cursor-pointer"
                >
                  <option value={adminJenjang}>Khusus Jenjang {adminJenjang}</option>
                  <option value="SEMUA">SD & SMP (Semua / Umum)</option>
                </select>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                Warna badge tema akan dipilihkan secara otomatis (acak) oleh sistem.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Deskripsi Singkat</label>
              <textarea
                name="deskripsi"
                rows={2}
                placeholder="Deskripsi target pembelajaran dan silabus..."
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpenModal(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} size="sm" className="font-bold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Simpan Mata Pelajaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Mata Pelajaran</DialogTitle>
          </DialogHeader>

          {editTarget && (
            <form onSubmit={handleUpdate} className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-bold block mb-1">Kode Mata Pelajaran (Unik) *</label>
                <input
                  type="text"
                  name="kode_mapel"
                  defaultValue={editTarget.kode}
                  placeholder="Contoh: MTK, PAI, IPA, ROBOTIK"
                  className="w-full text-xs uppercase font-mono rounded-xl border border-input bg-background p-2.5"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Nama Mata Pelajaran *</label>
                <input
                  type="text"
                  name="nama_mapel"
                  defaultValue={editTarget.nama}
                  placeholder="Contoh: Matematika Terapan & HOTS"
                  className="w-full text-xs font-semibold rounded-xl border border-input bg-background p-2.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Jenjang *</label>
                  {isSuperAdmin ? (
                    <select
                      name="jenjang"
                      defaultValue={editTarget.jenjang || "SEMUA"}
                      className="w-full text-xs rounded-xl border border-input bg-background p-2.5 cursor-pointer"
                    >
                      <option value="SEMUA">SD & SMP (Semua)</option>
                      <option value="SD">Khusus SD</option>
                      <option value="SMP">Khusus SMP</option>
                    </select>
                  ) : (
                    <select
                      name="jenjang"
                      defaultValue={editTarget.jenjang || adminJenjang}
                      className="w-full text-xs rounded-xl border border-input bg-background p-2.5 cursor-pointer"
                    >
                      <option value={adminJenjang}>Khusus Jenjang {adminJenjang}</option>
                      <option value="SEMUA">SD & SMP (Semua / Umum)</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Warna Badge</label>
                  <select
                    name="warna"
                    defaultValue={editTarget.warna || "emerald"}
                    className="w-full text-xs rounded-xl border border-input bg-background p-2.5"
                  >
                    <option value="emerald">Hijau (Emerald)</option>
                    <option value="indigo">Biru (Indigo)</option>
                    <option value="violet">Ungu (Violet)</option>
                    <option value="amber">Emas (Amber)</option>
                    <option value="rose">Merah (Rose)</option>
                    <option value="teal">Teal (Cyan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Deskripsi Singkat</label>
                <textarea
                  name="deskripsi"
                  rows={2}
                  defaultValue={editTarget.deskripsi || ""}
                  placeholder="Deskripsi target pembelajaran dan silabus..."
                  className="w-full text-xs rounded-xl border border-input bg-background p-2.5"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditTarget(null)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} size="sm" className="font-bold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Single Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-red-600 dark:text-red-400">Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Apakah Anda yakin ingin menghapus mata pelajaran <strong>{deleteTarget?.nama}</strong>? Jadwal dan tugas yang terhubung akan ikut terhapus secara otomatis.
          </p>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="text-xs font-bold"
            >
              {isSubmitting ? "Menghapus..." : "Hapus Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Modal */}
      <Dialog open={openBulkDeleteModal} onOpenChange={setOpenBulkDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-rose-600 dark:text-rose-400">
                  Hapus {selectedIds.length} Mata Pelajaran Sekaligus
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Konfirmasi tindakan penghapusan massal data mata pelajaran terpilih.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm">
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-400">
              Tindakan ini tidak dapat dibatalkan. Seluruh mata pelajaran yang dipilih beserta sesi jadwal dan tugas terkait akan dihapus secara permanen.
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Daftar mata pelajaran yang akan dihapus:
              </p>
              <div className="max-h-44 overflow-y-auto rounded-lg border bg-muted/30 p-2 divide-y divide-border/50 text-xs">
                {subjects
                  .filter((s) => selectedIds.includes(s.id))
                  .slice(0, 10)
                  .map((s) => (
                    <div key={s.id} className="py-1.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground truncate">{s.nama}</span>
                      <Badge variant="outline" size="xs" className="font-mono uppercase shrink-0">
                        {s.kode}
                      </Badge>
                    </div>
                  ))}
                {selectedIds.length > 10 && (
                  <div className="text-muted-foreground italic text-center pt-1.5">
                    dan {selectedIds.length - 10} mata pelajaran lainnya...
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenBulkDeleteModal(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menghapus..." : `Ya, Hapus ${selectedIds.length} Mapel`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Kustomisasi Export Excel */}
      <Dialog open={openExportModal} onOpenChange={setOpenExportModal}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Kustomisasi Ekspor Data Mata Pelajaran
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Pilih cakupan data dan kolom apa saja yang ingin disertakan dalam file Excel (.xlsx).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Bagian 1: Cakupan & Filter Data Mapel */}
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Cakupan Data Mata Pelajaran
                </Label>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {exportTargetSubjects.length} mapel akan diekspor
                </span>
              </div>

              {/* Pilihan Cakupan / Scope */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExportScope("selected")}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      exportScope === "selected"
                        ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500"
                        : "border-input bg-background hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold text-foreground">Terpilih Saja</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{selectedIds.length} mapel dicentang</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setExportScope("all")}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    exportScope === "all"
                      ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500"
                      : "border-input bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="font-semibold text-foreground">Semua Mapel</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Seluruh {subjects.length} mapel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope("filtered")}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    exportScope === "filtered"
                      ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500"
                      : "border-input bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="font-semibold text-foreground">Sesuai Tabel</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{filtered.length} mapel (filter aktif)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope("custom")}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    exportScope === "custom"
                      ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500"
                      : "border-input bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="font-semibold text-foreground">Filter Kustom</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Pilih jenjang khusus</span>
                </button>
              </div>

              {/* Parameter Filter Kustom */}
              {exportScope === "custom" && (
                <div className="grid grid-cols-1 gap-3 pt-2.5 border-t border-border/60 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Filter Jenjang Mapel</Label>
                    <select
                      value={exportJenjang}
                      onChange={(e) =>
                        setExportJenjang(e.target.value as "all" | "SD" | "SMP" | "SEMUA")
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                    >
                      {isSuperAdmin ? (
                        <>
                          <option value="all">Semua Jenjang</option>
                          <option value="SD">Khusus Jenjang SD</option>
                          <option value="SMP">Khusus Jenjang SMP</option>
                          <option value="SEMUA">SD & SMP (Mapel Gabungan)</option>
                        </>
                      ) : (
                        <>
                          <option value="all">Semua Mapel ({adminJenjang} & Gabungan)</option>
                          <option value={adminJenjang}>Khusus Jenjang {adminJenjang}</option>
                          <option value="SEMUA">Mapel Gabungan (SD & SMP)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Bagian 2: Pilihan Kolom / Field Data */}
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Kolom Data ({exportFields.length} Dipilih)
                </Label>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setExportFields(AVAILABLE_MAPEL_EXPORT_FIELDS.map((f) => f.id))
                    }
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExportFields(
                        AVAILABLE_MAPEL_EXPORT_FIELDS.filter((f) => f.default).map(
                          (f) => f.id
                        )
                      )
                    }
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Format Default
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() => setExportFields([])}
                    className="text-muted-foreground hover:text-foreground text-[11px] cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              {/* Grid Checkbox Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {AVAILABLE_MAPEL_EXPORT_FIELDS.map((field) => {
                  const isChecked = exportFields.includes(field.id);
                  return (
                    <label
                      key={field.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? "border-emerald-500/40 bg-emerald-500/5 text-foreground font-medium"
                          : "border-input bg-background hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setExportFields((prev) =>
                            prev.includes(field.id)
                              ? prev.filter((id) => id !== field.id)
                              : [...prev, field.id]
                          );
                        }}
                        className="h-3.5 w-3.5 rounded border-input text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                      />
                      <span className="truncate">{field.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Kotak Ringkasan Pratinjau */}
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-muted-foreground">
                  File Excel akan berisi:{" "}
                  <strong className="text-foreground">{exportTargetSubjects.length} mapel</strong> dengan{" "}
                  <strong className="text-foreground">{exportFields.length} kolom data</strong>.
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenExportModal(false)}
              disabled={isExporting}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleExecuteExport}
              disabled={
                isExporting ||
                exportTargetSubjects.length === 0 ||
                exportFields.length === 0
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Menyiapkan Excel..." : "Unduh File Excel"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Import Excel */}
      <Dialog open={openImportModal} onOpenChange={setOpenImportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Impor Mata Pelajaran dari Excel
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Unggah file spreadsheet (.xlsx/.xls) untuk menambahkan atau memperbarui mata pelajaran secara massal.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleImportExcel} className="space-y-4 pt-2">
            {/* Download Template Banner */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
              <div>
                <p className="font-semibold text-foreground">Gunakan Template Resmi</p>
                <p className="text-[11px] text-muted-foreground">
                  Format tabel berisi kolom kode, nama, jenjang, & deskripsi. Warna badge otomatis acak.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-1.5 shrink-0 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Template</span>
              </Button>
            </div>

            {/* Default Jenjang Select */}
            <div className="space-y-1">
              <Label className="text-xs">Default Jenjang (Bila Kolom di Excel Kosong)</Label>
              {isSuperAdmin ? (
                <select
                  name="defaultJenjang"
                  defaultValue="SEMUA"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm cursor-pointer"
                >
                  <option value="SEMUA">SD & SMP (Semua Jenjang)</option>
                  <option value="SD">Khusus SD Saja</option>
                  <option value="SMP">Khusus SMP Saja</option>
                </select>
              ) : (
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/40 border text-xs">
                  <span className="text-muted-foreground font-medium">Scope Admin:</span>
                  <Badge variant="outline" className={adminJenjang === "SD" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-semibold" : "bg-blue-500/10 text-blue-700 border-blue-500/30 font-semibold"}>
                    Jenjang {adminJenjang}
                  </Badge>
                  <input type="hidden" name="defaultJenjang" value={adminJenjang} />
                </div>
              )}
            </div>

            {/* File Input */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Pilih File Excel (.xlsx, .xls) *</Label>
              <input
                type="file"
                name="excelFile"
                accept=".xlsx, .xls"
                required
                className="w-full text-xs rounded-md border border-input bg-background p-2 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-700 dark:file:text-emerald-300 hover:file:bg-emerald-500/20 cursor-pointer"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenImportModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Mulai Impor</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
