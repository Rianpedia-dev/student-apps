"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Eye,
  CheckCircle2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  FileSpreadsheet,
  Upload,
  Download,
  Pencil,
  EyeOff,
  MoreVertical,
  Clock,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  deleteUserAction,
  deleteUsersAction,
  verifyUserAction,
  createTeacherAction,
  importTeachersAction,
  updateTeacherAction,
} from "@/actions/admin";
import { toast } from "sonner";
import { UserItem } from "@/types";
import { getRoleLabel } from "@/lib/utils";

interface TeacherTableProps {
  initialTeachers: UserItem[];
  classList?: string[];
  subjectList?: string[];
}

export function TeacherTable({
  initialTeachers,
  classList = [],
  subjectList = [],
}: TeacherTableProps) {
  const [teachers, setTeachers] = useState<UserItem[]>(initialTeachers);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [addRoleChoice, setAddRoleChoice] = useState<"2" | "4">("2");
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [editRoleChoice, setEditRoleChoice] = useState<"2" | "4">("2");
  const [verifyTarget, setVerifyTarget] = useState<UserItem | null>(null);
  const [verifyStatusChoice, setVerifyStatusChoice] = useState<string>("2"); // 2=guru, 4=wali
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Multiple selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openBulkDeleteModal, setOpenBulkDeleteModal] = useState(false);

  // Password visibility states
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showAddApplePassword, setShowAddApplePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditApplePassword, setShowEditApplePassword] = useState(false);

  // Status Filter State: ALL, 0 (pending verifikasi), 2 (guru mapel), 4 (wali kelas)
  const [statusFilter, setStatusFilter] = useState<"ALL" | "0" | "2" | "4">("ALL");

  const countAll = teachers.length;
  const countPending = teachers.filter((t) => t.status === "0").length;
  const countMapel = teachers.filter((t) => t.status === "2").length;
  const countWali = teachers.filter((t) => t.status === "4").length;

  const filtered = teachers.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.guru_bidang && t.guru_bidang.toLowerCase().includes(search.toLowerCase())) ||
      (t.nip && t.nip.includes(search));
    const matchStatus = statusFilter === "ALL" ? true : t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleConfirmVerify = async () => {
    if (!verifyTarget) return;
    setIsSubmitting(true);
    try {
      const res = await verifyUserAction(verifyTarget.id, verifyStatusChoice);
      if (res.success) {
        setTeachers((prev) =>
          prev.map((t) =>
            t.id === verifyTarget.id ? { ...t, status: verifyStatusChoice } : t
          )
        );
        toast.success(res.message);
        setVerifyTarget(null);
      } else {
        toast.error("Gagal memverifikasi guru");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multiple selection handlers
  const currentPageIds = paginated.map((t) => t.id);
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await deleteUsersAction(selectedIds);
      if (res.success) {
        setTeachers((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
        toast.success(res.message || `Berhasil menghapus ${selectedIds.length} akun guru.`);
        setSelectedIds([]);
        setOpenBulkDeleteModal(false);
      } else {
        toast.error(res.error || "Gagal menghapus beberapa akun guru.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await deleteUserAction(deleteTarget.id);
      if (res.success) {
        setTeachers((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        toast.success(res.message);
      } else {
        toast.error("Gagal menghapus akun");
      }
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("role", addRoleChoice);

    try {
      const res = await createTeacherAction(formData);
      if (res.success) {
        toast.success(res.message);
        setOpenAddModal(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Gagal menambahkan guru");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("role", editRoleChoice);

    const updatedName = formData.get("name") as string;
    const updatedEmail = (formData.get("email") as string)?.toLowerCase();
    const updatedNip = (formData.get("nip") as string) || null;
    const updatedGender = formData.get("gender") as string;
    const updatedBidang = (formData.get("guru_bidang") as string) || null;
    const updatedKelas = (formData.get("kelas") as string) || null;
    const updatedAppleid = (formData.get("appleid") as string) || null;
    const updatedPasswordAppleid = (formData.get("passwordappleid") as string) || null;

    try {
      const res = await updateTeacherAction(editTarget.id, formData);
      if (res.success) {
        setTeachers((prev) =>
          prev.map((t) =>
            t.id === editTarget.id
              ? {
                  ...t,
                  name: updatedName,
                  email: updatedEmail,
                  nip: updatedNip,
                  gender: updatedGender,
                  guru_bidang: updatedBidang,
                  status: editRoleChoice,
                  kelas: updatedKelas,
                  appleid: updatedAppleid,
                  passwordappleid: updatedPasswordAppleid,
                }
              : t
          )
        );
        toast.success(res.message);
        setEditTarget(null);
      } else {
        toast.error(res.error || "Gagal memperbarui data guru");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportExcel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("excelFile") as HTMLInputElement;
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
        const res = await importTeachersAction(base64);
        if (res.success) {
          toast.success(res.message);
          setOpenImportModal(false);
          window.location.reload();
        } else {
          toast.error(res.error || "Gagal mengimpor data");
        }
      } catch {
        toast.error("Format file Excel tidak didukung");
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const XLSX = await import("xlsx");
      const exportData = filtered.map((t, idx) => ({
        No: idx + 1,
        NIP: t.nip || "-",
        "Nama Lengkap": t.name,
        "Jenis Kelamin": t.gender === "P" ? "Perempuan" : "Laki-laki",
        Email: t.email,
        "Bidang Studi": t.guru_bidang || "-",
        Peran: t.status === "0" ? "Pending Verifikasi" : getRoleLabel(t.status),
        "Kelas Diampu / Wali": t.kelas || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Dewan Guru");

      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `Data_Guru_AlAzhar_${today}.xlsx`);
      toast.success(`Berhasil mengekspor ${exportData.length} data guru ke Excel.`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Gagal mengekspor data guru ke Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const templateData = [
        [
          "NIP",
          "Nama Lengkap",
          "Email",
          "Password",
          "Jenis Kelamin (L/P)",
          "Bidang Studi",
          "Peran (Guru/Wali Kelas)",
          "Kelas Wali",
          "Apple ID",
          "Password Apple ID",
        ],
        [
          "198501152010011002",
          "Ustadzah Fatimah, S.Pd",
          "fatimah@alazhar.sch.id",
          "123456",
          "P",
          "Bahasa Indonesia",
          "Wali Kelas",
          "4 - Mehmed Al Fatih",
          "fatimah@icloud.com",
          "Apple123!",
        ],
        [
          "198802202012011003",
          "Ustadz Ahmad Fauzi, S.Pd",
          "ahmad.fauzi@alazhar.sch.id",
          "123456",
          "L",
          "Pendidikan Agama Islam",
          "Guru",
          "",
          "",
          "",
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Guru");
      XLSX.writeFile(wb, "Template_Import_Guru_AlAzhar.xlsx");
      toast.success("Template Excel berhasil diunduh.");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("Gagal mengunduh template Excel.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert banner if there are new unverified registrations */}
      {countPending > 0 && statusFilter !== "0" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p>
              <strong>Perhatian:</strong> Terdapat <strong>{countPending}</strong> akun guru baru yang baru mendaftar dan menunggu verifikasi Admin sebelum bisa login ke sistem.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setStatusFilter("0");
              setPage(1);
            }}
            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-bold rounded-lg shadow-xs"
          >
            Lihat Akun Pending ({countPending})
          </Button>
        </div>
      )}

      {/* Filter Tabs / Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: "ALL" as const, label: "Semua Guru", count: countAll, isPending: false },
          {
            id: "0" as const,
            label: "Menunggu Verifikasi",
            count: countPending,
            isPending: true,
          },
          { id: "2" as const, label: "Guru Mapel", count: countMapel, isPending: false },
          { id: "4" as const, label: "Guru & Wali Kelas", count: countWali, isPending: false },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                isActive
                  ? "bg-emerald-600 text-white shadow-xs"
                  : tab.isPending && countPending > 0
                  ? "bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.isPending && countPending > 0
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Top action toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIP, mapel, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setOpenBulkDeleteModal(true)}
              className="gap-1.5 border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs sm:text-sm font-medium"
              title="Hapus akun guru terpilih"
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
            title="Ekspor daftar guru ke file Excel"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isExporting ? "Mengekspor..." : "Export Excel"}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setOpenImportModal(true)}
            className="gap-1.5 text-xs sm:text-sm"
            title="Impor data guru dari file Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import Excel</span>
          </Button>

          <Button
            onClick={() => setOpenAddModal(true)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Guru</span>
          </Button>
        </div>
      </div>


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
              <TableHead className="font-bold">Nama Guru</TableHead>
              <TableHead className="font-bold">Bidang Studi / NIP</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Kelas Diampu</TableHead>
              <TableHead className="font-bold text-center">Status</TableHead>
              <TableHead className="w-16 text-center font-bold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Tidak ada data guru ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((t, idx) => (
                <TableRow
                  key={t.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    selectedIds.includes(t.id) ? "bg-emerald-500/5 dark:bg-emerald-500/10" : ""
                  }`}
                >
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(t.id)}
                      onChange={() => handleToggleRow(t.id)}
                      className="h-4 w-4 rounded border-input bg-background accent-emerald-600 cursor-pointer focus:ring-2 focus:ring-emerald-500 align-middle"
                      aria-label={`Pilih ${t.name}`}
                    />
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {(page - 1) * pageSize + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{t.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{t.guru_bidang || "-"}</div>
                    {t.nip && <div className="text-xs text-muted-foreground">NIP: {t.nip}</div>}
                  </TableCell>
                  <TableCell className="text-sm font-mono">{t.email}</TableCell>
                  <TableCell>
                    {t.kelas ? (
                      <Badge variant="sky" size="sm">
                        {t.kelas}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {t.status === "0" ? (
                      <Badge variant="warning" size="sm" className="gap-1 inline-flex items-center">
                        <Clock className="h-3 w-3" />
                        <span>Pending Verifikasi</span>
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        {getRoleLabel(t.status)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Tombol aksi langsung verifikasi khusus akun pending */}
                      {t.status === "0" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setVerifyTarget(t);
                            setVerifyStatusChoice(t.kelas ? "4" : "2");
                          }}
                          className="h-7 px-2.5 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-all"
                          title="Verifikasi Akun Guru Baru"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Verifikasi</span>
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          title="Pilihan Aksi"
                          aria-label={`Menu aksi ${t.name}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 p-1">
                          <Link href={`/admin/teachers/${t.id}`} className="w-full">
                            <DropdownMenuItem className="cursor-pointer gap-2">
                              <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                              <span>Detail Guru</span>
                            </DropdownMenuItem>
                          </Link>

                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={() => {
                              setEditTarget(t);
                              setEditRoleChoice(t.status === "4" ? "4" : "2");
                              setShowEditPassword(false);
                              setShowEditApplePassword(false);
                            }}
                          >
                            <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span>Edit Data</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer gap-2 text-rose-600 dark:text-rose-400 focus:text-rose-600"
                            onClick={() => setDeleteTarget(t)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Hapus Akun</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} dari {filtered.length} guru
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

      {/* Modal Tambah Guru Baru */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Akun Guru Baru</DialogTitle>
            <DialogDescription>
              Lengkapi formulir di bawah ini untuk membuat akun dewan guru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTeacher} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label htmlFor="add-name">Nama Lengkap Guru</Label>
              <Input
                id="add-name"
                name="name"
                placeholder="Contoh: Ustadzah Fatimah, S.Pd"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="add-nip">NIP (Nomor Induk)</Label>
                <Input id="add-nip" name="nip" placeholder="19850115..." />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-gender">Jenis Kelamin</Label>
                <select
                  id="add-gender"
                  name="gender"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="add-email">Email Login</Label>
                <Input
                  id="add-email"
                  name="email"
                  type="email"
                  placeholder="guru@alazhar.sch.id"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-password">Password</Label>
                <div className="relative">
                  <Input
                    id="add-password"
                    name="password"
                    type={showAddPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none"
                    title={showAddPassword ? "Sembunyikan password" : "Lihat password"}
                    tabIndex={-1}
                  >
                    {showAddPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Pilihan Peran Guru */}
            <div className="space-y-1.5 rounded-lg border p-3 bg-muted/20">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Peran & Penugasan
              </Label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-xs font-medium transition-colors ${addRoleChoice === "2" ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "hover:bg-muted/50"}`}>
                  <input
                    type="radio"
                    name="roleOption"
                    value="2"
                    checked={addRoleChoice === "2"}
                    onChange={() => setAddRoleChoice("2")}
                    className="h-3.5 w-3.5 text-emerald-600"
                  />
                  <span>Guru Mata Pelajaran</span>
                </label>
                <label className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-xs font-medium transition-colors ${addRoleChoice === "4" ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "hover:bg-muted/50"}`}>
                  <input
                    type="radio"
                    name="roleOption"
                    value="4"
                    checked={addRoleChoice === "4"}
                    onChange={() => setAddRoleChoice("4")}
                    className="h-3.5 w-3.5 text-emerald-600"
                  />
                  <span>Guru & Wali Kelas</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="add-bidang">Bidang Studi (Mapel)</Label>
                <select
                  id="add-bidang"
                  name="guru_bidang"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjectList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-kelas">
                  Kelas Wali {addRoleChoice === "4" && <span className="text-emerald-600">*</span>}
                </Label>
                <select
                  id="add-kelas"
                  name="kelas"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classList.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="add-appleid">Apple ID (Opsional)</Label>
                <Input
                  id="add-appleid"
                  name="appleid"
                  placeholder="guru@icloud.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-passwordappleid">Password Apple ID</Label>
                <div className="relative">
                  <Input
                    id="add-passwordappleid"
                    name="passwordappleid"
                    type={showAddApplePassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddApplePassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none"
                    title={showAddApplePassword ? "Sembunyikan password" : "Lihat password"}
                    tabIndex={-1}
                  >
                    {showAddApplePassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenAddModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Guru"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Import Excel Guru */}
      <Dialog open={openImportModal} onOpenChange={setOpenImportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Data Guru dari Excel</DialogTitle>
            <DialogDescription>
              Upload file spreadsheet Excel (.xlsx / .xls). Kolom opsional (NIP, Bidang Studi, Kelas, Apple ID, Password, dll.) boleh dikosongkan dan dapat dilengkapi mandiri di profil masing-masing guru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImportExcel} className="space-y-4 pt-1">
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-3 text-xs">
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Format Template Excel Fleksibel
                </p>
                <p className="text-emerald-700 dark:text-emerald-400">
                  Kolom kosong tetap berhasil diimpor. Password default: 123456.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDownloadTemplate}
                className="gap-1 text-xs shrink-0 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Template</span>
              </Button>
            </div>

            <div className="rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted/20 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
              <Label
                htmlFor="teacherExcelFile"
                className="cursor-pointer font-medium text-emerald-600 dark:text-emerald-400 hover:underline block"
              >
                Pilih file Excel (.xlsx, .xls)
              </Label>
              <p className="text-[11px] text-muted-foreground mt-1">
                Kolom kosong akan otomatis diisi nilai default dan dapat diedit kemudian.
              </p>
              <Input
                id="teacherExcelFile"
                name="excelFile"
                type="file"
                accept=".xlsx, .xls"
                className="mt-3"
                required
              />
            </div>

            <DialogFooter>
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? "Mengimpor..." : "Mulai Import"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Data Guru */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setShowEditPassword(false);
            setShowEditApplePassword(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Data Guru</DialogTitle>
            <DialogDescription>
              Perbarui profil, data penugasan mapel, atau kelas wali dewan guru.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEditTeacher} className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <Label htmlFor="edit-name">Nama Lengkap Guru</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editTarget.name}
                  placeholder="Contoh: Ustadzah Fatimah, S.Pd"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-nip">NIP (Nomor Induk)</Label>
                  <Input
                    id="edit-nip"
                    name="nip"
                    defaultValue={editTarget.nip || ""}
                    placeholder="19850115..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-gender">Jenis Kelamin</Label>
                  <select
                    id="edit-gender"
                    name="gender"
                    defaultValue={editTarget.gender || "L"}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-email">Email Login</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editTarget.email}
                    placeholder="guru@alazhar.sch.id"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-password">Password Baru (Opsional)</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      name="password"
                      type={showEditPassword ? "text" : "password"}
                      placeholder="Kosongkan jika tak diubah"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none"
                      title={showEditPassword ? "Sembunyikan password" : "Lihat password"}
                      tabIndex={-1}
                    >
                      {showEditPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Pilihan Peran Guru */}
              <div className="space-y-1.5 rounded-lg border p-3 bg-muted/20">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Peran & Penugasan
                </Label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label
                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-xs font-medium transition-colors ${
                      editRoleChoice === "2"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editRoleOption"
                      value="2"
                      checked={editRoleChoice === "2"}
                      onChange={() => setEditRoleChoice("2")}
                      className="h-3.5 w-3.5 text-emerald-600"
                    />
                    <span>Guru Mata Pelajaran</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-xs font-medium transition-colors ${
                      editRoleChoice === "4"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editRoleOption"
                      value="4"
                      checked={editRoleChoice === "4"}
                      onChange={() => setEditRoleChoice("4")}
                      className="h-3.5 w-3.5 text-emerald-600"
                    />
                    <span>Guru & Wali Kelas</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-bidang">Bidang Studi (Mapel)</Label>
                  <select
                    id="edit-bidang"
                    name="guru_bidang"
                    defaultValue={editTarget.guru_bidang || ""}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {editTarget.guru_bidang && !subjectList.includes(editTarget.guru_bidang) && (
                      <option value={editTarget.guru_bidang}>
                        {editTarget.guru_bidang}
                      </option>
                    )}
                    {subjectList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-kelas">
                    Kelas Wali {editRoleChoice === "4" && <span className="text-emerald-600">*</span>}
                  </Label>
                  <select
                    id="edit-kelas"
                    name="kelas"
                    defaultValue={editTarget.kelas || ""}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classList.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-appleid">Apple ID (Opsional)</Label>
                  <Input
                    id="edit-appleid"
                    name="appleid"
                    defaultValue={editTarget.appleid || ""}
                    placeholder="guru@icloud.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-passwordappleid">Password Apple ID</Label>
                  <div className="relative">
                    <Input
                      id="edit-passwordappleid"
                      name="passwordappleid"
                      type={showEditApplePassword ? "text" : "password"}
                      defaultValue={editTarget.passwordappleid || ""}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditApplePassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none"
                      title={showEditApplePassword ? "Sembunyikan password" : "Lihat password"}
                      tabIndex={-1}
                    >
                      {showEditApplePassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditTarget(null);
                    setShowEditPassword(false);
                    setShowEditApplePassword(false);
                  }}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Verifikasi Status Guru */}
      <Dialog open={!!verifyTarget} onOpenChange={(open) => !open && setVerifyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi & Set Status Guru</DialogTitle>
            <DialogDescription>
              Tentukan hak akses untuk <strong>{verifyTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium">Pilih Peran Guru:</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                <input
                  type="radio"
                  name="statusOption"
                  value="2"
                  checked={verifyStatusChoice === "2"}
                  onChange={() => setVerifyStatusChoice("2")}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-sm font-semibold">Guru Mata Pelajaran</div>
                  <div className="text-xs text-muted-foreground">
                    Akses modul absensi mapel, nilai, materi KBM, dan tugas siswa.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                <input
                  type="radio"
                  name="statusOption"
                  value="4"
                  checked={verifyStatusChoice === "4"}
                  onChange={() => setVerifyStatusChoice("4")}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-sm font-semibold">Guru & Wali Kelas</div>
                  <div className="text-xs text-muted-foreground">
                    Akses penuh guru ditambah hak kelola rekap kelas, prestasi, dan catatan siswa.
                  </div>
                </div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyTarget(null)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleConfirmVerify} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSubmitting ? "Menyimpan..." : "Verifikasi Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Hapus */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Akun Guru</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akun guru <strong>{deleteTarget?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Menghapus..." : "Hapus"}
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
                <DialogTitle>Hapus {selectedIds.length} Akun Guru</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus {selectedIds.length} akun guru yang dipilih?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm">
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-400">
              Tindakan ini tidak dapat dibatalkan. Seluruh data akun guru yang dipilih akan dihapus secara permanen dari sistem.
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Daftar akun yang akan dihapus:
              </p>
              <div className="max-h-44 overflow-y-auto rounded-lg border bg-muted/30 p-2 divide-y divide-border/50 text-xs">
                {teachers
                  .filter((t) => selectedIds.includes(t.id))
                  .slice(0, 10)
                  .map((t) => (
                    <div key={t.id} className="py-1.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground truncate">{t.name}</span>
                      <span className="text-muted-foreground font-mono text-[11px] shrink-0">{t.email}</span>
                    </div>
                  ))}
                {selectedIds.length > 10 && (
                  <div className="text-muted-foreground italic text-center pt-1.5">
                    dan {selectedIds.length - 10} akun lainnya...
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
