"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Eye,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  Upload,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  createClassAction,
  updateClassAction,
  deleteClassAction,
  deleteClassesAction,
  importClassesAction,
} from "@/actions/admin";
import { toast } from "sonner";
import { KelasItem } from "@/types";

const AVAILABLE_CLASS_EXPORT_FIELDS = [
  { id: "no", label: "No (Nomor Urut)", default: true },
  { id: "nama_kelas", label: "Nama Kelas", default: true },
  { id: "jenjang", label: "Jenjang (SD/SMP)", default: true },
  { id: "tingkat", label: "Tingkat Kelas", default: true },
  { id: "wali_kelas", label: "Wali Kelas", default: true },
  { id: "jumlah_siswa", label: "Kapasitas / Jumlah Siswa", default: true },
  { id: "code_restrict", label: "Code Restrict iPad", default: true },
];

interface ClassTableProps {
  initialClasses: KelasItem[];
  teachersList: string[];
  adminJenjang?: "SD" | "SMP" | "ALL";
  activeJenjang?: "SD" | "SMP" | "ALL";
}

export function ClassTable({
  initialClasses,
  teachersList,
  adminJenjang = "ALL",
  activeJenjang = "ALL",
}: ClassTableProps) {
  const [classes, setClasses] = useState<KelasItem[]>(initialClasses);
  const [search, setSearch] = useState("");
  const isSuperAdmin = adminJenjang === "ALL";
  const defaultJenjangFilter = isSuperAdmin
    ? (activeJenjang === "SD" || activeJenjang === "SMP" ? (activeJenjang as "SD" | "SMP") : "all")
    : (adminJenjang as "SD" | "SMP");
  const [filterJenjang, setFilterJenjang] = useState<"all" | "SD" | "SMP">(defaultJenjangFilter);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [openExportModal, setOpenExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<"all" | "selected" | "filtered" | "custom">("all");
  const [exportJenjang, setExportJenjang] = useState<"all" | "SD" | "SMP">(
    isSuperAdmin ? "all" : (adminJenjang as "SD" | "SMP")
  );
  const [exportTingkat, setExportTingkat] = useState<string>("all");
  const [exportHasWali, setExportHasWali] = useState<string>("all");
  const [exportFields, setExportFields] = useState<string[]>([
    "no",
    "nama_kelas",
    "jenjang",
    "tingkat",
    "wali_kelas",
    "jumlah_siswa",
    "code_restrict",
  ]);

  const [editTarget, setEditTarget] = useState<KelasItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KelasItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Multiple selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openBulkDeleteModal, setOpenBulkDeleteModal] = useState(false);

  const filtered = classes.filter((c) => {
    const matchesSearch =
      c.nama_kelas.toLowerCase().includes(search.toLowerCase()) ||
      (c.wali_kelas || "").toLowerCase().includes(search.toLowerCase());
    const matchesJenjang =
      filterJenjang === "all" ||
      (filterJenjang === "SMP"
        ? c.jenjang === "SMP" ||
          c.nama_kelas.startsWith("7") ||
          c.nama_kelas.startsWith("8") ||
          c.nama_kelas.startsWith("9")
        : c.jenjang === "SD" ||
          (!c.nama_kelas.startsWith("7") &&
            !c.nama_kelas.startsWith("8") &&
            !c.nama_kelas.startsWith("9")));
    return matchesSearch && matchesJenjang;
  });

  // Target data kelas yang akan diekspor sesuai cakupan modal
  const exportTargetClasses = useMemo(() => {
    if (exportScope === "selected") {
      return classes.filter((c) => selectedIds.includes(c.id));
    }
    if (exportScope === "filtered") {
      return filtered;
    }
    if (exportScope === "all") {
      return classes;
    }
    // custom scope
    return classes.filter((c) => {
      const isSMP =
        c.jenjang === "SMP" ||
        c.nama_kelas.startsWith("7") ||
        c.nama_kelas.startsWith("8") ||
        c.nama_kelas.startsWith("9");
      const cJenjang = isSMP ? "SMP" : "SD";
      const matchJenjang = exportJenjang === "all" ? true : cJenjang === exportJenjang;

      const detectedNum = c.nama_kelas.match(/\b([1-9]|1[0-2])\b/)?.[1];
      const cTingkat = String(c.tingkat ?? (detectedNum || (isSMP ? "7" : "3")));
      const matchTingkat = exportTingkat === "all" ? true : cTingkat === exportTingkat;

      const hasWali = Boolean(c.wali_kelas && c.wali_kelas !== "-" && c.wali_kelas.trim() !== "");
      const matchWali =
        exportHasWali === "all"
          ? true
          : exportHasWali === "with_wali"
          ? hasWali
          : !hasWali;

      return matchJenjang && matchTingkat && matchWali;
    });
  }, [
    exportScope,
    selectedIds,
    filtered,
    classes,
    exportJenjang,
    exportTingkat,
    exportHasWali,
  ]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Multiple selection helpers & handlers
  const currentPageIds = paginated.map((c) => c.id);
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
    setSelectedIds(filtered.map((c) => c.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await deleteClassesAction(selectedIds);
      if (res.success) {
        setClasses((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
        toast.success(res.message || `Berhasil menghapus ${selectedIds.length} kelas.`);
        setSelectedIds([]);
        setOpenBulkDeleteModal(false);
      } else {
        toast.error(res.error || "Gagal menghapus beberapa kelas.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createClassAction(formData);
      if (res.success) {
        toast.success(res.message);
        setOpenAddModal(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Gagal membuat kelas");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateClassAction(editTarget.id, formData);
      if (res.success) {
        toast.success(res.message);
        const updatedNama = (formData.get("nama_kelas") as string) || editTarget.nama_kelas;
        const updatedJenjang = (formData.get("jenjang") as string) || editTarget.jenjang;
        const updatedTingkat = formData.get("tingkat")
          ? parseInt(formData.get("tingkat") as string, 10)
          : editTarget.tingkat;
        const updatedWali = (formData.get("wali_kelas") as string) || "-";
        const updatedJumlah = (formData.get("jumlah_siswa") as string) || editTarget.jumlah_siswa;
        const updatedRestrict = (formData.get("code_restrict") as string) || "-";

        setClasses((prev) =>
          prev.map((c) =>
            c.id === editTarget.id
              ? {
                  ...c,
                  nama_kelas: updatedNama,
                  jenjang: updatedJenjang,
                  tingkat: updatedTingkat,
                  wali_kelas: updatedWali,
                  jumlah_siswa: updatedJumlah,
                  code_restrict: updatedRestrict,
                }
              : c
          )
        );
        setEditTarget(null);
      } else {
        toast.error(res.error || "Gagal memperbarui kelas");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await deleteClassAction(deleteTarget.id);
      if (res.success) {
        setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        toast.success(res.message);
      } else {
        toast.error("Gagal menghapus kelas");
      }
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const handleOpenExportModal = () => {
    if (selectedIds.length > 0) {
      setExportScope("selected");
    } else if (search || filterJenjang !== "all") {
      setExportScope("filtered");
    } else {
      setExportScope("all");
    }
    setOpenExportModal(true);
  };

  const handleExecuteExport = async () => {
    if (exportTargetClasses.length === 0) {
      toast.error("Tidak ada data kelas yang memenuhi kriteria untuk diekspor");
      return;
    }
    if (exportFields.length === 0) {
      toast.error("Pilih minimal satu kolom data untuk diekspor");
      return;
    }

    try {
      setIsExporting(true);
      const XLSX = await import("xlsx");

      const exportData = exportTargetClasses.map((c, idx) => {
        const isSMP =
          c.jenjang === "SMP" ||
          c.nama_kelas.startsWith("7") ||
          c.nama_kelas.startsWith("8") ||
          c.nama_kelas.startsWith("9");

        const row: Record<string, any> = {};
        if (exportFields.includes("no")) row["No"] = idx + 1;
        if (exportFields.includes("nama_kelas")) row["Nama Kelas"] = c.nama_kelas;
        if (exportFields.includes("jenjang")) row["Jenjang"] = isSMP ? "SMP" : "SD";
        const detectedNum = c.nama_kelas.match(/\b([1-9]|1[0-2])\b/)?.[1];
        const valTingkat = c.tingkat ?? (detectedNum ? parseInt(detectedNum, 10) : (isSMP ? 7 : 3));
        if (exportFields.includes("tingkat")) row["Tingkat"] = valTingkat;
        if (exportFields.includes("wali_kelas")) row["Wali Kelas"] = c.wali_kelas || "-";
        if (exportFields.includes("jumlah_siswa")) row["Kapasitas Siswa"] = c.jumlah_siswa || "0";
        if (exportFields.includes("code_restrict")) row["Code Restrict iPad"] = c.code_restrict || "-";
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Kelas");

      const today = new Date().toISOString().split("T")[0];
      let filePrefix = "Data_Kelas";
      if (exportScope === "selected") {
        filePrefix = `Data_Kelas_Terpilih_${exportTargetClasses.length}`;
      } else if (exportScope === "custom") {
        if (exportJenjang !== "all") filePrefix += `_${exportJenjang}`;
        if (exportTingkat !== "all") filePrefix += `_Tingkat${exportTingkat}`;
        if (exportHasWali !== "all") filePrefix += exportHasWali === "with_wali" ? "_AdaWali" : "_TanpaWali";
      } else if (filterJenjang !== "all") {
        filePrefix += `_${filterJenjang}`;
      }

      const fileName = `${filePrefix}_${today}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Berhasil mengekspor ${exportData.length} data kelas (${exportFields.length} kolom).`);
      setOpenExportModal(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Gagal mengekspor data kelas ke Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const templateData = [
        [
          "Nama Kelas",
          "Jenjang (SD/SMP)",
          "Tingkat (3-9)",
          "Wali Kelas",
          "Kapasitas Siswa",
          "Code Restrict iPad",
        ],
        [
          "Kelas 3 - Ibnu Batutah",
          "SD",
          "3",
          "",
          "",
          "",
        ],
        [
          "Kelas 4 - Mehmed Al Fatih",
          "SD",
          "4",
          "Ustadz Ahmad Fauzi, S.Pd",
          "28",
          "2739",
        ],
        [
          "Kelas 5 - Ibnu Khaldun",
          "SD",
          "5",
          "Ustadzah Siti Aminah, M.Pd",
          "28",
          "2841",
        ],
        [
          "Kelas 7 - Ibnu Sina",
          "SMP",
          "7",
          "Ustadz Mansyur, M.Pd",
          "30",
          "1820",
        ],
        [
          "Kelas 8 - Al Farabi",
          "SMP",
          "8",
          "",
          "30",
          "",
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(templateData);

      // Sheet kedua: Referensi Dewan Guru
      const teacherRefData = [
        ["No", "Nama Guru / Wali"],
        ...teachersList.map((teacher, idx) => [idx + 1, teacher]),
      ];
      const wsTeachers = XLSX.utils.aoa_to_sheet(teacherRefData);

      // Sheet ketiga: Panduan Pengisian
      const guideData = [
        ["Kolom", "Keterangan", "Wajib / Opsional", "Contoh Nilai"],
        ["Nama Kelas", "Nama rombel / kelas resmi", "Wajib", "Kelas 4 - Mehmed Al Fatih"],
        ["Jenjang (SD/SMP)", "Pilihan: SD atau SMP (otomatis terdeteksi bila kosong)", "Opsional", "SD"],
        ["Tingkat (3-9)", "Angka kelas 3, 4, 5, 6, 7, 8, atau 9 (otomatis terdeteksi bila kosong)", "Opsional", "4"],
        ["Wali Kelas", "Nama lengkap guru (sesuai sheet Referensi Guru)", "Opsional", "Ustadz Ahmad Fauzi, S.Pd"],
        ["Kapasitas Siswa", "Perkiraan kuota siswa per kelas (angka)", "Opsional", "28"],
        ["Code Restrict iPad", "Kode 4-digit restrict iPad per kelas", "Opsional", "2739"],
      ];
      const wsGuide = XLSX.utils.aoa_to_sheet(guideData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Kelas");
      XLSX.utils.book_append_sheet(wb, wsTeachers, "Referensi Guru");
      XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan Kolom");
      XLSX.writeFile(wb, "Template_Import_Kelas_AlAzhar.xlsx");
      toast.success("Template Excel Kelas berhasil diunduh.");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("Gagal mengunduh template Excel.");
    }
  };

  const handleImportExcel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("excelFile") as HTMLInputElement;
    const defaultJenjangInput = e.currentTarget.elements.namedItem("defaultJenjang") as HTMLSelectElement;
    const defaultJenjang = defaultJenjangInput?.value || (!isSuperAdmin ? adminJenjang : "");

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
        const res = await importClassesAction(base64, defaultJenjang);
        if (res.success) {
          toast.success(res.message);
          setOpenImportModal(false);
          window.location.reload();
        } else {
          toast.error(res.error || "Gagal mengimpor data kelas");
        }
      } catch {
        toast.error("Format file tidak didukung");
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Filters and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama kelas atau wali..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {isSuperAdmin ? (
            <select
              value={filterJenjang}
              onChange={(e) => {
                setFilterJenjang(e.target.value as "all" | "SD" | "SMP");
                setPage(1);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-auto min-w-[150px] cursor-pointer h-9"
            >
              <option value="all">Semua Jenjang</option>
              <option value="SD">Jenjang SD</option>
              <option value="SMP">Jenjang SMP</option>
            </select>
          ) : (
            <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border text-xs font-semibold text-muted-foreground shrink-0 h-9">
              <span>Wewenang:</span>
              <Badge
                variant="outline"
                className={
                  adminJenjang === "SD"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                }
              >
                Jenjang {adminJenjang}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setOpenBulkDeleteModal(true)}
              className="gap-1.5 border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs sm:text-sm font-medium"
              title="Hapus kelas terpilih"
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
            title="Ekspor daftar kelas ke file Excel"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isExporting ? "Mengekspor..." : "Export Excel"}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setOpenImportModal(true)}
            className="gap-1.5 text-xs sm:text-sm"
            title="Impor data kelas dari file Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import Excel</span>
          </Button>

          <Button
            onClick={() => setOpenAddModal(true)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs sm:text-sm shadow-xs"
          >
            <Plus className="h-4 w-4" /> Tambah Kelas Baru
          </Button>
        </div>
      </div>

      {/* Selection notice banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              <strong>{selectedIds.length}</strong> kelas dipilih.
            </span>
            {filtered.length > selectedIds.length && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="underline hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Pilih semua ({filtered.length}) hasil filter
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Batal Pilih
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeCurrentPageSelected;
                  }}
                  onChange={handleToggleCurrentPage}
                  className="h-4 w-4 rounded border-input bg-background accent-emerald-600 cursor-pointer focus:ring-2 focus:ring-emerald-500 align-middle"
                  title="Pilih semua di halaman ini"
                  aria-label="Pilih semua di halaman ini"
                />
              </TableHead>
              <TableHead className="w-12 text-center font-bold">No</TableHead>
              <TableHead className="font-bold">Nama Kelas</TableHead>
              <TableHead className="font-bold">Jenjang</TableHead>
              <TableHead className="font-bold">Wali Kelas</TableHead>
              <TableHead className="font-bold text-center">Kapasitas / Siswa</TableHead>
              <TableHead className="font-bold">Code Restrict iPad</TableHead>
              <TableHead className="w-14 text-center font-bold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Tidak ada data kelas ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((c, idx) => {
                const isSMP =
                  c.jenjang === "SMP" ||
                  c.nama_kelas.startsWith("7") ||
                  c.nama_kelas.startsWith("8") ||
                  c.nama_kelas.startsWith("9");
                const isSelected = selectedIds.includes(c.id);
                return (
                  <TableRow
                    key={c.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      isSelected ? "bg-emerald-500/5 dark:bg-emerald-500/10" : ""
                    }`}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(c.id)}
                        className="h-4 w-4 rounded border-input bg-background accent-emerald-600 cursor-pointer focus:ring-2 focus:ring-emerald-500 align-middle"
                        aria-label={`Pilih ${c.nama_kelas}`}
                      />
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">{c.nama_kelas}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isSMP ? "smp" : "emerald"} size="sm">
                        {isSMP ? "SMP" : "SD"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.wali_kelas ? (
                        <span className="font-medium text-sm text-foreground">{c.wali_kelas}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Belum ditentukan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="sky" size="sm" className="font-mono">
                        {c.jumlah_siswa || "0"} Siswa
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.code_restrict && c.code_restrict !== "-" ? (
                        <Badge variant="amber" size="sm" className="font-mono">
                          {c.code_restrict}
                        </Badge>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground/60">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          title="Pilihan Aksi"
                          aria-label={`Menu aksi ${c.nama_kelas}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1">
                          <Link href={`/admin/classes/${c.id}`} className="w-full">
                            <DropdownMenuItem className="cursor-pointer gap-2">
                              <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                              <span>Detail Siswa Kelas</span>
                            </DropdownMenuItem>
                          </Link>

                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={() => setEditTarget(c)}
                          >
                            <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span>Edit Data Kelas</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer gap-2 text-rose-600 dark:text-rose-400 focus:text-rose-600"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Hapus Kelas</span>
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

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
        <div>
          Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} dari {filtered.length} kelas
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-8 gap-1"
          >
            Berikutnya <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Modal Tambah Kelas */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Data Kelas Baru</DialogTitle>
            <DialogDescription>
              Buat rombongan belajar baru untuk tahun ajaran aktif.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClass} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="jenjang">Jenjang Sekolah</Label>
                {isSuperAdmin ? (
                  <select
                    id="jenjang"
                    name="jenjang"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    defaultValue="SD"
                  >
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                  </select>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-md bg-muted/40 border text-xs">
                    <span className="text-muted-foreground font-medium">Jenjang:</span>
                    <Badge variant="outline" className={adminJenjang === "SD" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-semibold" : "bg-blue-500/10 text-blue-700 border-blue-500/30 font-semibold"}>
                      {adminJenjang}
                    </Badge>
                    <input type="hidden" name="jenjang" value={adminJenjang} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="tingkat">Tingkat Kelas</Label>
                <select
                  id="tingkat"
                  name="tingkat"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  defaultValue="4"
                >
                  <option value="1">Kelas 1 (SD)</option>
                  <option value="2">Kelas 2 (SD)</option>
                  <option value="3">Kelas 3 (SD)</option>
                  <option value="4">Kelas 4 (SD)</option>
                  <option value="5">Kelas 5 (SD)</option>
                  <option value="6">Kelas 6 (SD)</option>
                  <option value="7">Kelas 7 (SMP)</option>
                  <option value="8">Kelas 8 (SMP)</option>
                  <option value="9">Kelas 9 (SMP)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="nama_kelas">Nama Kelas</Label>
              <Input
                id="nama_kelas"
                name="nama_kelas"
                placeholder="Contoh: Kelas 7 - Ibnu Sina atau Kelas 4 - Sholahuddin"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="wali_kelas">Wali Kelas (Opsional)</Label>
              <select
                id="wali_kelas"
                name="wali_kelas"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              >
                <option value="">-- Pilih Guru Wali Kelas --</option>
                {teachersList.map((t, idx) => (
                  <option key={`${t}-${idx}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="jumlah_siswa">Perkiraan Siswa</Label>
                <Input id="jumlah_siswa" name="jumlah_siswa" placeholder="28" type="number" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="code_restrict">Code Restrict iPad</Label>
                <Input id="code_restrict" name="code_restrict" placeholder="2739" />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenAddModal(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Kelas"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Import Excel */}
      <Dialog open={openImportModal} onOpenChange={setOpenImportModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Data Kelas dari Excel</DialogTitle>
            <DialogDescription>
              Upload file spreadsheet Excel (.xlsx / .xls). Format kolom mendukung: <strong>Nama Kelas</strong>, <strong>Jenjang (SD/SMP)</strong>, <strong>Tingkat (3-9)</strong>, <strong>Wali Kelas</strong>, <strong>Kapasitas Siswa</strong>, dan <strong>Code Restrict iPad</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Banner Unduh Template Excel */}
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-3 text-xs">
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Format Template Excel Kelas
              </p>
              <p className="text-emerald-700 dark:text-emerald-400">
                Dilengkapi contoh format, referensi nama guru, & panduan pengisian.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-1.5 text-xs shrink-0 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Template</span>
            </Button>
          </div>

          <form onSubmit={handleImportExcel} className="space-y-4">
            {isSuperAdmin ? (
              <div className="space-y-1.5">
                <Label htmlFor="defaultJenjang" className="text-xs font-semibold">
                  Pilih Jenjang Default (Opsional)
                </Label>
                <select
                  id="defaultJenjang"
                  name="defaultJenjang"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Deteksi Otomatis dari Nama / Kolom Excel --</option>
                  <option value="SD">SD (Sekolah Dasar)</option>
                  <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Jika di dalam file Excel kolom Jenjang tidak diisi, sistem akan menggunakan pilihan default ini atau mendeteksi dari angka nama kelas.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border text-xs">
                <span className="text-muted-foreground font-medium">Scope Import:</span>
                <Badge variant="outline" className={adminJenjang === "SD" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"}>
                  Kelas Jenjang {adminJenjang}
                </Badge>
                <input type="hidden" name="defaultJenjang" value={adminJenjang} />
              </div>
            )}

            <div className="rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted/20 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
              <Label htmlFor="excelFileClass" className="cursor-pointer font-medium text-emerald-600 dark:text-emerald-400 hover:underline block">
                Pilih file Excel (.xlsx, .xls)
              </Label>
              <p className="text-[11px] text-muted-foreground mt-1">
                Data kelas yang sudah ada (dengan nama yang sama) akan diperbarui secara otomatis.
              </p>
              <Input
                id="excelFileClass"
                name="excelFile"
                type="file"
                accept=".xlsx, .xls"
                className="mt-3"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenImportModal(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                {isSubmitting ? "Mengimpor..." : "Mulai Import"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Data Kelas */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Kelas</DialogTitle>
            <DialogDescription>
              Perbarui rombel, wali kelas, jenjang, atau kode restrict iPad.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEditClass} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-jenjang">Jenjang Sekolah</Label>
                  {isSuperAdmin ? (
                    <select
                      id="edit-jenjang"
                      name="jenjang"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                      defaultValue={
                        editTarget.jenjang ||
                        (editTarget.nama_kelas.startsWith("7") ||
                        editTarget.nama_kelas.startsWith("8") ||
                        editTarget.nama_kelas.startsWith("9")
                          ? "SMP"
                          : "SD")
                      }
                    >
                      <option value="SD">SD (Sekolah Dasar)</option>
                      <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    </select>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-md bg-muted/40 border text-xs">
                      <span className="text-muted-foreground font-medium">Jenjang:</span>
                      <Badge
                        variant="outline"
                        className={
                          adminJenjang === "SD"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-semibold"
                            : "bg-blue-500/10 text-blue-700 border-blue-500/30 font-semibold"
                        }
                      >
                        {adminJenjang}
                      </Badge>
                      <input type="hidden" name="jenjang" value={adminJenjang} />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-tingkat">Tingkat Kelas</Label>
                  <select
                    id="edit-tingkat"
                    name="tingkat"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    defaultValue={
                      editTarget.tingkat?.toString() ||
                      (editTarget.nama_kelas.match(/\b([1-9]|1[0-2])\b/)?.[1] || "4")
                    }
                  >
                    <option value="1">Kelas 1 (SD)</option>
                    <option value="2">Kelas 2 (SD)</option>
                    <option value="3">Kelas 3 (SD)</option>
                    <option value="4">Kelas 4 (SD)</option>
                    <option value="5">Kelas 5 (SD)</option>
                    <option value="6">Kelas 6 (SD)</option>
                    <option value="7">Kelas 7 (SMP)</option>
                    <option value="8">Kelas 8 (SMP)</option>
                    <option value="9">Kelas 9 (SMP)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-nama_kelas">Nama Kelas</Label>
                <Input
                  id="edit-nama_kelas"
                  name="nama_kelas"
                  defaultValue={editTarget.nama_kelas}
                  placeholder="Contoh: Kelas 7 - Ibnu Sina atau Kelas 4 - Sholahuddin"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-wali_kelas">Wali Kelas (Opsional)</Label>
                <select
                  id="edit-wali_kelas"
                  name="wali_kelas"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  defaultValue={
                    editTarget.wali_kelas === "-" || !editTarget.wali_kelas
                      ? ""
                      : editTarget.wali_kelas
                  }
                >
                  <option value="">-- Pilih Guru Wali Kelas --</option>
                  {teachersList.map((t, idx) => (
                    <option key={`edit-${t}-${idx}`} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-jumlah_siswa">Perkiraan Siswa</Label>
                  <Input
                    id="edit-jumlah_siswa"
                    name="jumlah_siswa"
                    defaultValue={
                      editTarget.jumlah_siswa === "-" || !editTarget.jumlah_siswa
                        ? ""
                        : editTarget.jumlah_siswa
                    }
                    placeholder="28"
                    type="number"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-code_restrict">Code Restrict iPad</Label>
                  <Input
                    id="edit-code_restrict"
                    name="code_restrict"
                    defaultValue={
                      editTarget.code_restrict === "-" || !editTarget.code_restrict
                        ? ""
                        : editTarget.code_restrict
                    }
                    placeholder="2739"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditTarget(null)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Hapus Tunggal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Data Kelas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kelas <strong>{deleteTarget?.nama_kelas}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Menghapus..." : "Hapus Kelas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Hapus Massal / Bulk Delete */}
      <Dialog open={openBulkDeleteModal} onOpenChange={setOpenBulkDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Hapus {selectedIds.length} Kelas</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus {selectedIds.length} kelas yang dipilih?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm">
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-400">
              Tindakan ini tidak dapat dibatalkan. Kelas yang dipilih beserta seluruh jadwal pelajaran, materi pertemuan, tugas, dan kode restrict iPad terkait akan dihapus secara permanen dari sistem.
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Daftar kelas yang akan dihapus:
              </p>
              <div className="max-h-44 overflow-y-auto rounded-lg border bg-muted/30 p-2 divide-y divide-border/50 text-xs">
                {classes
                  .filter((c) => selectedIds.includes(c.id))
                  .slice(0, 10)
                  .map((c) => (
                    <div key={c.id} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="font-semibold text-foreground">{c.nama_kelas}</span>
                        {c.wali_kelas && c.wali_kelas !== "-" && (
                          <span className="text-muted-foreground ml-1.5 font-normal">
                            (Wali: {c.wali_kelas})
                          </span>
                        )}
                      </div>
                      <Badge variant={c.jenjang === "SMP" ? "smp" : "emerald"} size="sm" className="shrink-0 text-[10px]">
                        {c.jenjang || "SD"}
                      </Badge>
                    </div>
                  ))}
                {selectedIds.length > 10 && (
                  <div className="text-muted-foreground italic text-center pt-1.5">
                    dan {selectedIds.length - 10} kelas lainnya...
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
              {isSubmitting ? "Menghapus..." : `Ya, Hapus ${selectedIds.length} Kelas`}
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
                  Kustomisasi Ekspor Data Kelas
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Pilih cakupan data kelas dan kolom apa saja yang ingin disertakan dalam file Excel (.xlsx).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Bagian 1: Cakupan & Filter Data Kelas */}
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Cakupan Data Kelas
                </Label>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {exportTargetClasses.length} kelas akan diekspor
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
                    <span className="text-[10px] text-muted-foreground mt-0.5">{selectedIds.length} kelas dicentang</span>
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
                  <span className="font-semibold text-foreground">Semua Kelas</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Seluruh {classes.length} kelas</span>
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
                  <span className="text-[10px] text-muted-foreground mt-0.5">{filtered.length} kelas (filter aktif)</span>
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
                  <span className="text-[10px] text-muted-foreground mt-0.5">Pilih jenjang, tingkat, dll</span>
                </button>
              </div>

              {/* Parameter Filter Kustom */}
              {exportScope === "custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-border/60 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Filter Jenjang</Label>
                    <select
                      value={exportJenjang}
                      onChange={(e) => setExportJenjang(e.target.value as "all" | "SD" | "SMP")}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                    >
                      <option value="all">Semua Jenjang</option>
                      <option value="SD">Khusus SD Saja</option>
                      <option value="SMP">Khusus SMP Saja</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Filter Tingkat</Label>
                    <select
                      value={exportTingkat}
                      onChange={(e) => setExportTingkat(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                    >
                      <option value="all">Semua Tingkat</option>
                      {exportJenjang !== "SMP" && (
                        <>
                          <option value="1">Tingkat 1 (SD)</option>
                          <option value="2">Tingkat 2 (SD)</option>
                          <option value="3">Tingkat 3 (SD)</option>
                          <option value="4">Tingkat 4 (SD)</option>
                          <option value="5">Tingkat 5 (SD)</option>
                          <option value="6">Tingkat 6 (SD)</option>
                        </>
                      )}
                      {exportJenjang !== "SD" && (
                        <>
                          <option value="7">Tingkat 7 (SMP)</option>
                          <option value="8">Tingkat 8 (SMP)</option>
                          <option value="9">Tingkat 9 (SMP)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Status Wali Kelas</Label>
                    <select
                      value={exportHasWali}
                      onChange={(e) => setExportHasWali(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                    >
                      <option value="all">Semua Kelas</option>
                      <option value="with_wali">Ada Wali Kelas</option>
                      <option value="no_wali">Belum Ada Wali Kelas</option>
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
                    onClick={() => setExportFields(AVAILABLE_CLASS_EXPORT_FIELDS.map((f) => f.id))}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExportFields(AVAILABLE_CLASS_EXPORT_FIELDS.filter((f) => f.default).map((f) => f.id))
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
                {AVAILABLE_CLASS_EXPORT_FIELDS.map((field) => {
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
                  <strong className="text-foreground">{exportTargetClasses.length} kelas</strong> dengan{" "}
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
              disabled={isExporting || exportTargetClasses.length === 0 || exportFields.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Menyiapkan Excel..." : "Unduh File Excel"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
