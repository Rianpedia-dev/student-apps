"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  UserPlus,
  FileSpreadsheet,
  Pencil,
  Trash2,
  CheckCircle,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
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
  createUserAction,
  updateUserAction,
  deleteUserAction,
  deleteUsersAction,
  verifyUserAction,
  importStudentsAction,
} from "@/actions/admin";
import { toast } from "sonner";
import { UserItem } from "@/types";

const AVAILABLE_EXPORT_FIELDS = [
  { id: "no", label: "No (Nomor Urut)", default: true },
  { id: "nis", label: "NIS", default: true },
  { id: "name", label: "Nama Lengkap", default: true },
  { id: "jenjang", label: "Jenjang (SD/SMP)", default: true },
  { id: "kelas", label: "Kelas / Rombel", default: true },
  { id: "gender", label: "Jenis Kelamin (L/P)", default: true },
  { id: "email", label: "Email / Username", default: true },
  { id: "appleid", label: "Apple ID", default: true },
  { id: "status", label: "Status Akun", default: true },
  { id: "passwordappleid", label: "Password Apple ID", default: false },
  { id: "point", label: "Poin Siswa", default: false },
  { id: "notes", label: "Catatan Profil", default: false },
];

interface StudentTableProps {
  initialStudents: UserItem[];
  classList: string[];
  classJenjangMap?: Record<string, string>;
  adminJenjang?: "SD" | "SMP" | "ALL";
  activeJenjang?: "SD" | "SMP" | "ALL";
}

export function StudentTable({
  initialStudents,
  classList,
  classJenjangMap = {},
  adminJenjang = "ALL",
  activeJenjang = "ALL",
}: StudentTableProps) {
  const [students, setStudents] = useState<UserItem[]>(initialStudents);
  const [search, setSearch] = useState("");
  const isSuperAdmin = adminJenjang === "ALL";
  const defaultJenjangFilter = isSuperAdmin
    ? (activeJenjang === "SD" || activeJenjang === "SMP" ? (activeJenjang as "SD" | "SMP") : "all")
    : (adminJenjang as "SD" | "SMP");
  const [filterJenjang, setFilterJenjang] = useState<"all" | "SD" | "SMP">(defaultJenjangFilter);
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
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
  const [exportKelas, setExportKelas] = useState<string>("");
  const [exportStatus, setExportStatus] = useState<string>("all");
  const [exportGender, setExportGender] = useState<string>("all");
  const [exportFields, setExportFields] = useState<string[]>([
    "no",
    "nis",
    "name",
    "jenjang",
    "kelas",
    "gender",
    "email",
    "appleid",
    "status",
  ]);

  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Multiple selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openBulkDeleteModal, setOpenBulkDeleteModal] = useState(false);

  // Helper check if student belongs to SMP
  const isSmp = (s: UserItem) => {
    if (s.jenjang) return s.jenjang === "SMP";
    if (!s.kelas) return false;
    if (classJenjangMap && classJenjangMap[s.kelas]) {
      return classJenjangMap[s.kelas] === "SMP";
    }
    const clean = s.kelas.trim().toUpperCase();
    return (
      clean.includes("SMP") ||
      clean.startsWith("7") ||
      clean.startsWith("8") ||
      clean.startsWith("9")
    );
  };

  const availableClasses = useMemo(() => {
    if (filterJenjang === "all") return classList;
    return classList.filter((k) => {
      const isClassSmp =
        (classJenjangMap && classJenjangMap[k] === "SMP") ||
        k.toUpperCase().includes("SMP") ||
        k.startsWith("7") ||
        k.startsWith("8") ||
        k.startsWith("9");
      return filterJenjang === "SMP" ? isClassSmp : !isClassSmp;
    });
  }, [classList, filterJenjang, classJenjangMap]);

  const handleFilterJenjangChange = (newJenjang: "all" | "SD" | "SMP") => {
    setFilterJenjang(newJenjang);
    setPage(1);
    if (selectedClassFilter) {
      const isCurrentClassSmp =
        (classJenjangMap && classJenjangMap[selectedClassFilter] === "SMP") ||
        selectedClassFilter.toUpperCase().includes("SMP") ||
        selectedClassFilter.startsWith("7") ||
        selectedClassFilter.startsWith("8") ||
        selectedClassFilter.startsWith("9");
      if (newJenjang === "SD" && isCurrentClassSmp) setSelectedClassFilter("");
      if (newJenjang === "SMP" && !isCurrentClassSmp) setSelectedClassFilter("");
    }
  };

  // Filtered & Paginated
  const filtered = students.filter((s) => {
    const matchName =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchClass = selectedClassFilter ? s.kelas === selectedClassFilter : true;
    const matchJenjang =
      filterJenjang === "all" || (filterJenjang === "SMP" ? isSmp(s) : !isSmp(s));
    return matchName && matchClass && matchJenjang;
  });

  // Target data siswa yang akan diekspor sesuai cakupan modal
  const exportTargetStudents = useMemo(() => {
    if (exportScope === "selected") {
      return students.filter((s) => selectedIds.includes(s.id));
    }
    if (exportScope === "filtered") {
      return filtered;
    }
    if (exportScope === "all") {
      return students;
    }
    // custom scope
    return students.filter((s) => {
      const matchJenjang =
        exportJenjang === "all" || (exportJenjang === "SMP" ? isSmp(s) : !isSmp(s));
      const matchKelas = exportKelas ? s.kelas === exportKelas : true;
      const matchStatus = exportStatus === "all" ? true : s.status === exportStatus;
      const matchGender = exportGender === "all" ? true : s.gender === exportGender;
      return matchJenjang && matchKelas && matchStatus && matchGender;
    });
  }, [
    exportScope,
    selectedIds,
    filtered,
    students,
    exportJenjang,
    exportKelas,
    exportStatus,
    exportGender,
    classJenjangMap,
  ]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Multiple selection helpers & handlers
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await deleteUsersAction(selectedIds);
      if (res.success) {
        setStudents((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
        toast.success(res.message || `Berhasil menghapus ${selectedIds.length} akun siswa.`);
        setSelectedIds([]);
        setOpenBulkDeleteModal(false);
      } else {
        toast.error(res.error || "Gagal menghapus beberapa akun siswa.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actions
  const handleVerify = async (id: string) => {
    const res = await verifyUserAction(id, "1");
    if (res.success) {
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "1" } : s))
      );
      toast.success(res.message);
    } else {
      toast.error("Gagal memverifikasi siswa");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await deleteUserAction(deleteTarget.id);
      if (res.success) {
        setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        toast.success(res.message);
      } else {
        toast.error("Gagal menghapus siswa");
      }
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const handleOpenExportModal = () => {
    if (selectedIds.length > 0) {
      setExportScope("selected");
    } else if (search || selectedClassFilter || filterJenjang !== "all") {
      setExportScope("filtered");
    } else {
      setExportScope("all");
    }
    setOpenExportModal(true);
  };

  const handleExecuteExport = async () => {
    if (exportTargetStudents.length === 0) {
      toast.error("Tidak ada data siswa yang memenuhi kriteria untuk diekspor");
      return;
    }
    if (exportFields.length === 0) {
      toast.error("Pilih minimal satu kolom data untuk diekspor");
      return;
    }

    try {
      setIsExporting(true);
      const XLSX = await import("xlsx");

      const exportData = exportTargetStudents.map((s, idx) => {
        const row: Record<string, any> = {};
        if (exportFields.includes("no")) row["No"] = idx + 1;
        if (exportFields.includes("nis")) row["NIS"] = s.nis || "-";
        if (exportFields.includes("name")) row["Nama Lengkap"] = s.name;
        if (exportFields.includes("jenjang")) row["Jenjang"] = isSmp(s) ? "SMP" : "SD";
        if (exportFields.includes("kelas")) row["Kelas"] = s.kelas || "-";
        if (exportFields.includes("gender")) {
          row["Jenis Kelamin"] = s.gender === "P" ? "Perempuan" : s.gender === "L" ? "Laki-laki" : "-";
        }
        if (exportFields.includes("email")) row["Email / Username"] = s.email;
        if (exportFields.includes("appleid")) row["Apple ID"] = s.appleid || "-";
        if (exportFields.includes("passwordappleid")) row["Password Apple ID"] = (s as any).passwordappleid || "-";
        if (exportFields.includes("status")) {
          row["Status"] = s.status === "1" ? "Aktif" : s.status === "0" ? "Pending" : "Non-Aktif";
        }
        if (exportFields.includes("point")) row["Poin"] = s.point || "0";
        if (exportFields.includes("notes")) row["Catatan"] = s.notes || "-";
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");

      const today = new Date().toISOString().split("T")[0];
      let filePrefix = "Data_Siswa";
      if (exportScope === "selected") {
        filePrefix = `Data_Siswa_Terpilih_${exportTargetStudents.length}`;
      } else if (exportScope === "custom") {
        if (exportJenjang !== "all") filePrefix += `_${exportJenjang}`;
        if (exportKelas) filePrefix += `_${exportKelas.replace(/[^a-zA-Z0-9]/g, "_")}`;
        if (exportStatus !== "all") filePrefix += `_${exportStatus === "1" ? "Aktif" : "Nonaktif"}`;
      } else if (selectedClassFilter) {
        filePrefix += `_${selectedClassFilter.replace(/[^a-zA-Z0-9]/g, "_")}`;
      } else if (filterJenjang !== "all") {
        filePrefix += `_${filterJenjang}`;
      }

      const fileName = `${filePrefix}_${today}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Berhasil mengekspor ${exportData.length} data siswa (${exportFields.length} kolom).`);
      setOpenExportModal(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Gagal mengekspor data siswa ke Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("role", "1"); // Siswa
    if (!isSuperAdmin) {
      formData.set("jenjang", adminJenjang);
    }

    try {
      const res = await createUserAction(formData);
      if (res.success) {
        toast.success(res.message);
        setOpenAddModal(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Gagal menambahkan siswa");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateUserAction(editTarget.id, formData);
      if (res.success) {
        toast.success(res.message);
        const updatedName = formData.get("name") as string;
        const updatedNis = (formData.get("nis") as string) || null;
        const updatedGender = (formData.get("gender") as string) || "L";
        const updatedKelas = (formData.get("kelas") as string) || null;
        const updatedJenjang = (formData.get("jenjang") as string) || editTarget.jenjang;
        const updatedEmail = formData.get("email") as string;
        const updatedAppleid = (formData.get("appleid") as string) || null;
        const updatedStatus = (formData.get("status") as string) || editTarget.status;

        setStudents((prev) =>
          prev.map((s) =>
            s.id === editTarget.id
              ? {
                  ...s,
                  name: updatedName,
                  nis: updatedNis,
                  gender: updatedGender,
                  kelas: updatedKelas,
                  jenjang: updatedJenjang,
                  email: updatedEmail,
                  appleid: updatedAppleid,
                  status: updatedStatus,
                }
              : s
          )
        );
        setEditTarget(null);
      } else {
        toast.error(res.error || "Gagal memperbarui data siswa");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const templateData = [
        [
          "NIS",
          "Nama Lengkap",
          "Jenjang (SD/SMP)",
          "Kelas",
          "Email / Username",
          "Password",
          "Apple ID",
          "Password Apple ID",
          "Jenis Kelamin (L/P)",
          "Status (1=Aktif)",
        ],
        [
          "202604001",
          "Muhammad Rayhan Al-Fatih",
          "SD",
          "Kelas 4 - Mehmed Al Fatih",
          "rayhan.alfatih@alazhar.sch.id",
          "Alazhar2026!",
          "rayhan@icloud.com",
          "Apple2026!",
          "L",
          "1",
        ],
        [
          "202604002",
          "Zahra Amira Salsabila",
          "SD",
          "Kelas 3 - Ibnu Batutah",
          "zahra.salsabila@alazhar.sch.id",
          "Alazhar2026!",
          "",
          "",
          "P",
          "1",
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(templateData);

      // Sheet kedua: Referensi Rombel Resmi
      const classRefData = [
        ["No", "Nama Rombel / Kelas Resmi", "Tingkat", "Jenjang"],
        ...classList.map((cls, idx) => {
          const match = cls.match(/\b([1-9]|1[0-2])\b/);
          const resolvedJenjang = classJenjangMap[cls] || (isSmp({ kelas: cls } as any) ? "SMP" : "SD");
          return [idx + 1, cls, match ? parseInt(match[1], 10) : 1, resolvedJenjang];
        }),
      ];
      const wsClasses = XLSX.utils.aoa_to_sheet(classRefData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
      XLSX.utils.book_append_sheet(wb, wsClasses, "Referensi Kelas Resmi");
      XLSX.writeFile(wb, "Template_Import_Siswa_AlAzhar.xlsx");
      toast.success("Template Excel Siswa berhasil diunduh.");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("Gagal mengunduh template Excel.");
    }
  };

  const handleImportExcel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("excelFile") as HTMLInputElement;
    const defaultKelasInput = e.currentTarget.elements.namedItem("defaultKelas") as HTMLSelectElement;
    const defaultKelas = defaultKelasInput?.value || "";
    const defaultJenjangInput = e.currentTarget.elements.namedItem("defaultJenjang") as HTMLSelectElement;
    const defaultJenjang = defaultJenjangInput?.value || (!isSuperAdmin ? adminJenjang : undefined);

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
        const res = await importStudentsAction(base64, defaultKelas, defaultJenjang);
        if (res.success) {
          toast.success(res.message);
          setOpenImportModal(false);
          window.location.reload();
        } else {
          toast.error(res.error || "Gagal mengimpor data");
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
      {/* Top action toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          {/* Filter Jenjang Pills */}
          {isSuperAdmin ? (
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => handleFilterJenjangChange("all")}
                className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                  filterJenjang === "all"
                    ? "bg-gradient-to-b from-slate-800 to-slate-900 text-white dark:from-slate-100 dark:to-slate-200 dark:text-slate-900 shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => handleFilterJenjangChange("SD")}
                className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                  filterJenjang === "SD"
                    ? "bg-gradient-to-b from-emerald-400 to-teal-500 text-white shadow-sm font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                SD
              </button>
              <button
                type="button"
                onClick={() => handleFilterJenjangChange("SMP")}
                className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                  filterJenjang === "SMP"
                    ? "bg-gradient-to-b from-blue-300 to-blue-500 text-black shadow-sm font-bold border border-blue-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                SMP
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border text-xs font-semibold text-muted-foreground shrink-0">
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

          <select
            value={selectedClassFilter}
            onChange={(e) => {
              setSelectedClassFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-auto min-w-[150px] max-w-[220px] truncate shrink-0"
          >
            <option value="">
              {filterJenjang === "SD"
                ? "Semua Kelas SD"
                : filterJenjang === "SMP"
                ? "Semua Kelas SMP"
                : "Semua Kelas"}
            </option>
            {availableClasses.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setOpenBulkDeleteModal(true)}
              className="gap-1.5 border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs sm:text-sm font-medium"
              title="Hapus akun siswa terpilih"
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
            title="Ekspor daftar siswa ke file Excel"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isExporting
                ? "Mengekspor..."
                : selectedIds.length > 0
                ? `Export Terpilih (${selectedIds.length})`
                : "Export Excel"}
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setOpenImportModal(true)}
            className="gap-1.5 text-xs sm:text-sm"
            title="Impor data siswa dari file Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import Excel</span>
          </Button>

          <Button
            onClick={() => setOpenAddModal(true)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Siswa</span>
          </Button>
        </div>
      </div>

      {/* Selection notice banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              <strong>{selectedIds.length}</strong> siswa dipilih.
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
              <TableHead className="font-bold">Nama Siswa</TableHead>
              <TableHead className="font-bold text-center w-24">Jenjang</TableHead>
              <TableHead className="font-bold">Kelas</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Apple ID</TableHead>
              <TableHead className="font-bold text-center">Status</TableHead>
              <TableHead className="w-14 text-center font-bold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Tidak ada data siswa yang cocok.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((s, idx) => (
                <TableRow
                  key={s.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    selectedIds.includes(s.id) ? "bg-emerald-500/5 dark:bg-emerald-500/10" : ""
                  }`}
                >
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => handleToggleRow(s.id)}
                      className="h-4 w-4 rounded border-input bg-background accent-emerald-600 cursor-pointer focus:ring-2 focus:ring-emerald-500 align-middle"
                      aria-label={`Pilih ${s.name}`}
                    />
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {(page - 1) * pageSize + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{s.name}</div>
                    {s.nis && <div className="text-xs text-muted-foreground">NIS: {s.nis}</div>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      size="sm"
                      className={
                        (s.jenjang === "SMP" || isSmp(s))
                          ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold text-[11px]"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold text-[11px]"
                      }
                    >
                      {s.jenjang || (isSmp(s) ? "SMP" : "SD")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.kelas ? (
                      <Badge
                        variant={
                          s.kelas.startsWith("7") || s.kelas.startsWith("8") || s.kelas.startsWith("9")
                            ? "indigo"
                            : "teal"
                        }
                        size="sm"
                      >
                        {s.kelas}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Belum diatur</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-mono">{s.email}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {s.appleid || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.status === "1" ? (
                      <Badge variant="success" size="sm">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="destructive" size="sm">
                        Non-Aktif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        title="Pilihan Aksi"
                        aria-label={`Menu aksi ${s.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 p-1">
                        <Link href={`/admin/students/${s.id}`} className="w-full">
                          <DropdownMenuItem className="cursor-pointer gap-2">
                            <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                            <span>Detail Siswa</span>
                          </DropdownMenuItem>
                        </Link>

                        {s.status === "0" && (
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-600"
                            onClick={() => handleVerify(s.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Verifikasi Akun</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          className="cursor-pointer gap-2"
                          onClick={() => setEditTarget(s)}
                        >
                          <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span>Edit Data</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          variant="destructive"
                          className="cursor-pointer gap-2 text-rose-600 dark:text-rose-400 focus:text-rose-600"
                          onClick={() => setDeleteTarget(s)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Hapus Siswa</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
        <div>
          Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} dari {filtered.length} siswa
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

      {/* Modal Tambah Siswa */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Data Siswa Baru</DialogTitle>
            <DialogDescription>
              Isi data formulir untuk membuat akun siswa baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStudent} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" placeholder="Nama siswa" required />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="nis">NIS (Opsional)</Label>
                <Input id="nis" name="nis" placeholder="2024..." />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <select
                  name="gender"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
            </div>

            {isSuperAdmin ? (
              <div className="space-y-1">
                <Label htmlFor="jenjang">Jenjang Pendidikan</Label>
                <select
                  name="jenjang"
                  id="jenjang"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <option value="SD">SD (Sekolah Dasar)</option>
                  <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/40 border text-xs">
                <span className="text-muted-foreground font-medium">Jenjang Siswa:</span>
                <Badge variant="outline" className={adminJenjang === "SD" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-semibold" : "bg-blue-500/10 text-blue-700 border-blue-500/30 font-semibold"}>
                  {adminJenjang} (Otomatis)
                </Badge>
                <input type="hidden" name="jenjang" value={adminJenjang} />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="kelas">Kelas</Label>
              <select
                name="kelas"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              >
                <option value="">-- Pilih Kelas --</option>
                {classList.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="email">Email Login</Label>
                <Input id="email" name="email" type="email" placeholder="siswa@gmail.com" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="appleid">Apple ID (Opsional)</Label>
                <Input id="appleid" name="appleid" placeholder="apple@icloud.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="passwordappleid">Password Apple ID</Label>
                <Input id="passwordappleid" name="passwordappleid" type="password" placeholder="••••••••" />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setOpenAddModal(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Siswa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Import Excel */}
      <Dialog open={openImportModal} onOpenChange={setOpenImportModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Data Siswa dari Excel</DialogTitle>
            <DialogDescription>
              Upload file spreadsheet Excel (.xlsx / .xls). Format kolom mendukung: <strong>Nama Lengkap</strong>, <strong>Jenjang (SD/SMP)</strong>, <strong>Kelas</strong>, <strong>Email / Username</strong>, <strong>Password</strong>, <strong>Apple ID</strong>, <strong>Password Apple ID</strong>, <strong>Jenis Kelamin (L/P)</strong>, <strong>NIS</strong>, dan <strong>Status</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Banner Unduh Template Excel Lengkap dengan Kolom Kelas */}
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-3 text-xs">
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Format Template Excel Siswa
              </p>
              <p className="text-emerald-700 dark:text-emerald-400">
                Sudah dilengkapi kolom <strong>Kelas</strong> & daftar 23 rombel resmi.
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
                  Pilih Jenjang Default
                </Label>
                <select
                  id="defaultJenjang"
                  name="defaultJenjang"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Otomatis Deteksi dari Kolom Kelas / Jenjang Excel --</option>
                  <option value="SD">Khusus Jenjang SD</option>
                  <option value="SMP">Khusus Jenjang SMP</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border text-xs">
                <span className="text-muted-foreground font-medium">Scope Import:</span>
                <Badge variant="outline" className={adminJenjang === "SD" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"}>
                  Siswa Jenjang {adminJenjang} Saja
                </Badge>
                <input type="hidden" name="defaultJenjang" value={adminJenjang} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="defaultKelas" className="text-xs font-semibold">
                Pilih Kelas Default (Opsional)
              </Label>
              <select
                id="defaultKelas"
                name="defaultKelas"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">-- Gunakan Kolom Kelas dari File Excel (Otomatis) --</option>
                {classList.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Jika di dalam file Excel sudah ada kolom <strong>Kelas</strong> per siswa, sistem akan otomatis memprioritaskan kelas dari baris Excel tersebut.
              </p>
            </div>

            <div className="rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted/20 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
              <Label htmlFor="excelFile" className="cursor-pointer font-medium text-emerald-600 dark:text-emerald-400 hover:underline block">
                Pilih file Excel (.xlsx, .xls)
              </Label>
              <p className="text-[11px] text-muted-foreground mt-1">
                Kolom kosong tetap aman diimpor (password default: 123456, status: Aktif).
              </p>
              <Input
                id="excelFile"
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

      {/* Modal Edit Siswa */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Data Siswa</DialogTitle>
            <DialogDescription>
              Perbarui identitas, kelas, akun login, atau informasi Apple ID siswa.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEditStudent} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-student-name">Nama Lengkap</Label>
                <Input
                  id="edit-student-name"
                  name="name"
                  defaultValue={editTarget.name}
                  placeholder="Nama siswa"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-student-nis">NIS</Label>
                  <Input
                    id="edit-student-nis"
                    name="nis"
                    defaultValue={editTarget.nis || ""}
                    placeholder="Contoh: 2026..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-student-gender">Jenis Kelamin</Label>
                  <select
                    id="edit-student-gender"
                    name="gender"
                    defaultValue={editTarget.gender || "L"}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              {isSuperAdmin ? (
                <div className="space-y-1">
                  <Label htmlFor="edit-student-jenjang">Jenjang Pendidikan</Label>
                  <select
                    id="edit-student-jenjang"
                    name="jenjang"
                    defaultValue={editTarget.jenjang || (isSmp(editTarget) ? "SMP" : "SD")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/40 border text-xs">
                  <span className="text-muted-foreground font-medium">Jenjang Siswa:</span>
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

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-student-kelas">Kelas</Label>
                  <select
                    id="edit-student-kelas"
                    name="kelas"
                    defaultValue={editTarget.kelas || ""}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="">-- Belum Diatur / Pilih Kelas --</option>
                    {classList.map((k) => (
                      <option key={`edit-student-class-${k}`} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-student-status">Status Akun</Label>
                  <select
                    id="edit-student-status"
                    name="status"
                    defaultValue={editTarget.status}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Pending / Menunggu Verifikasi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-student-email">Email Login</Label>
                  <Input
                    id="edit-student-email"
                    name="email"
                    type="email"
                    defaultValue={editTarget.email}
                    placeholder="siswa@gmail.com"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-student-password">Password Baru (Opsional)</Label>
                  <Input
                    id="edit-student-password"
                    name="password"
                    type="password"
                    placeholder="Kosongkan jika tak diubah"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-student-appleid">Apple ID (Opsional)</Label>
                  <Input
                    id="edit-student-appleid"
                    name="appleid"
                    defaultValue={editTarget.appleid || ""}
                    placeholder="apple@icloud.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-student-passwordappleid">Password Apple ID</Label>
                  <Input
                    id="edit-student-passwordappleid"
                    name="passwordappleid"
                    type="password"
                    placeholder="Kosongkan jika tak diubah"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditTarget(null)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Siswa</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akun siswa <strong>{deleteTarget?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Menghapus..." : "Hapus Akun"}
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
                <DialogTitle>Hapus {selectedIds.length} Akun Siswa</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus {selectedIds.length} akun siswa yang dipilih?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm">
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-400">
              Tindakan ini tidak dapat dibatalkan. Seluruh data akun siswa yang dipilih (termasuk riwayat absensi, prestasi, & catatan pelanggaran terkait) akan dihapus secara permanen dari sistem.
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Daftar akun yang akan dihapus:
              </p>
              <div className="max-h-44 overflow-y-auto rounded-lg border bg-muted/30 p-2 divide-y divide-border/50 text-xs">
                {students
                  .filter((s) => selectedIds.includes(s.id))
                  .slice(0, 10)
                  .map((s) => (
                    <div key={s.id} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="font-semibold text-foreground">{s.name}</span>
                        {s.kelas && <span className="text-muted-foreground ml-1.5 font-normal">({s.kelas})</span>}
                      </div>
                      <span className="text-muted-foreground font-mono text-[11px] shrink-0">{s.email}</span>
                    </div>
                  ))}
                {selectedIds.length > 10 && (
                  <div className="text-muted-foreground italic text-center pt-1.5">
                    dan {selectedIds.length - 10} akun siswa lainnya...
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
              {isSubmitting ? "Menghapus..." : `Ya, Hapus ${selectedIds.length} Akun`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Kustomisasi Export Excel */}
      <Dialog open={openExportModal} onOpenChange={setOpenExportModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Kustomisasi Export Data Siswa</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Pilih cakupan data siswa dan tentukan kolom data apa saja yang ingin dimasukkan ke file Excel.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Bagian 1: Cakupan & Filter Data Siswa */}
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Cakupan Data Siswa
                </Label>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {exportTargetStudents.length} siswa akan diekspor
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
                    <span className="text-[10px] text-muted-foreground mt-0.5">{selectedIds.length} siswa dicentang</span>
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
                  <span className="font-semibold text-foreground">Semua Siswa</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Seluruh {students.length} siswa</span>
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
                  <span className="text-[10px] text-muted-foreground mt-0.5">{filtered.length} siswa (filter aktif)</span>
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
                  <span className="text-[10px] text-muted-foreground mt-0.5">Pilih jenjang, kelas, dll</span>
                </button>
              </div>

              {/* Parameter Filter Kustom */}
              {exportScope === "custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-border/60 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Filter Jenjang</Label>
                    {isSuperAdmin ? (
                      <select
                        value={exportJenjang}
                        onChange={(e) => {
                          setExportJenjang(e.target.value as "all" | "SD" | "SMP");
                          setExportKelas("");
                        }}
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                      >
                        <option value="all">Semua Jenjang (SD & SMP)</option>
                        <option value="SD">Khusus SD Saja</option>
                        <option value="SMP">Khusus SMP Saja</option>
                      </select>
                    ) : (
                      <div className="flex items-center justify-between p-1.5 rounded-md border bg-muted/30 text-xs">
                        <span className="text-muted-foreground">Terkunci Scope:</span>
                        <Badge variant="outline" className={adminJenjang === "SD" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[11px]" : "bg-blue-500/10 text-blue-700 border-blue-500/30 text-[11px]"}>
                          {adminJenjang}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Filter Kelas</Label>
                    <select
                      value={exportKelas}
                      onChange={(e) => setExportKelas(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                    >
                      <option value="">Semua Kelas</option>
                      {classList
                        .filter((k) => {
                          if (exportJenjang === "all") return true;
                          const isClassSmp =
                            (classJenjangMap && classJenjangMap[k] === "SMP") ||
                            k.toUpperCase().includes("SMP") ||
                            k.startsWith("7") ||
                            k.startsWith("8") ||
                            k.startsWith("9");
                          return exportJenjang === "SMP" ? isClassSmp : !isClassSmp;
                        })
                        .map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Status Akun</Label>
                    <select
                      value={exportStatus}
                      onChange={(e) => setExportStatus(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                    >
                      <option value="all">Semua Status</option>
                      <option value="1">Aktif Saja</option>
                      <option value="0">Menunggu Verifikasi (Pending)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Jenis Kelamin</Label>
                    <select
                      value={exportGender}
                      onChange={(e) => setExportGender(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                    >
                      <option value="all">Semua Jenis Kelamin</option>
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
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
                    onClick={() => setExportFields(AVAILABLE_EXPORT_FIELDS.map((f) => f.id))}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExportFields(AVAILABLE_EXPORT_FIELDS.filter((f) => f.default).map((f) => f.id))
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
                {AVAILABLE_EXPORT_FIELDS.map((field) => {
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
                  <strong className="text-foreground">{exportTargetStudents.length} siswa</strong> dengan{" "}
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
              disabled={isExporting || exportTargetStudents.length === 0 || exportFields.length === 0}
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
