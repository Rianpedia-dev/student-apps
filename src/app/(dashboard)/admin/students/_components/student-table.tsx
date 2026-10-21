"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  FileSpreadsheet,
  Trash2,
  CheckCircle,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
} from "lucide-react";
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
  deleteUserAction,
  deleteUsersAction,
  verifyUserAction,
  importStudentsAction,
} from "@/actions/admin";
import { toast } from "sonner";
import { UserItem } from "@/types";

interface StudentTableProps {
  initialStudents: UserItem[];
  classList: string[];
}

export function StudentTable({ initialStudents, classList }: StudentTableProps) {
  const [students, setStudents] = useState<UserItem[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Multiple selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openBulkDeleteModal, setOpenBulkDeleteModal] = useState(false);

  // Filtered & Paginated
  const filtered = students.filter((s) => {
    const matchName = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchClass = selectedClassFilter ? s.kelas === selectedClassFilter : true;
    return matchName && matchClass;
  });

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

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const XLSX = await import("xlsx");

      const targetStudents =
        selectedIds.length > 0
          ? students.filter((s) => selectedIds.includes(s.id))
          : filtered;

      if (targetStudents.length === 0) {
        toast.error("Tidak ada data siswa untuk diekspor");
        return;
      }

      const exportData = targetStudents.map((s, idx) => ({
        No: idx + 1,
        NIS: s.nis || "-",
        "Nama Lengkap": s.name,
        Kelas: s.kelas || "-",
        "Jenis Kelamin": s.gender === "P" ? "Perempuan" : s.gender === "L" ? "Laki-laki" : "-",
        "Email / Username": s.email,
        "Apple ID": s.appleid || "-",
        Status: s.status === "1" ? "Aktif" : s.status === "0" ? "Pending" : "Non-Aktif",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");

      const today = new Date().toISOString().split("T")[0];
      const fileName =
        selectedIds.length > 0
          ? `Data_Siswa_Terpilih_${today}.xlsx`
          : selectedClassFilter
          ? `Data_Siswa_${selectedClassFilter.replace(/[^a-zA-Z0-9]/g, "_")}_${today}.xlsx`
          : `Data_Siswa_AlAzhar_${today}.xlsx`;

      XLSX.writeFile(wb, fileName);
      toast.success(`Berhasil mengekspor ${exportData.length} data siswa ke Excel.`);
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

  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const templateData = [
        [
          "NIS",
          "Nama Lengkap",
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

      // Sheet kedua: Referensi 23 Rombel Resmi
      const classRefData = [
        ["No", "Nama Rombel / Kelas Resmi", "Tingkat", "Jenjang"],
        ...classList.map((cls, idx) => {
          const match = cls.match(/\b([3-6])\b/);
          return [idx + 1, cls, match ? parseInt(match[1], 10) : 4, "SD"];
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
        const res = await importStudentsAction(base64, defaultKelas);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-xs w-full">
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
          <select
            value={selectedClassFilter}
            onChange={(e) => {
              setSelectedClassFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-xs"
          >
            <option value="">Semua Kelas</option>
            {classList.map((k) => (
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
            onClick={handleExportExcel}
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
              <TableHead className="font-bold">Kelas</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Apple ID</TableHead>
              <TableHead className="font-bold text-center">Status</TableHead>
              <TableHead className="w-36 text-center font-bold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/admin/students/${s.id}`}>
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8" title="Detail Siswa">
                          <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        </Button>
                      </Link>
                      {s.status === "0" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          title="Verifikasi Siswa"
                          onClick={() => handleVerify(s.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                        title="Hapus Siswa"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
              Upload file spreadsheet Excel (.xlsx / .xls). Format kolom mendukung: <strong>Nama Lengkap</strong>, <strong>Kelas</strong>, <strong>Email / Username</strong>, <strong>Password</strong>, <strong>Apple ID</strong>, <strong>Password Apple ID</strong>, <strong>Jenis Kelamin (L/P)</strong>, <strong>NIS</strong>, dan <strong>Status</strong>.
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
    </div>
  );
}
