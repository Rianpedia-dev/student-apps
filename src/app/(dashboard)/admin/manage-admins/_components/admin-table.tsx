"use client";

import { useState, useTransition } from "react";
import {
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createAdminAction,
  updateAdminAction,
  deleteAdminAction,
} from "@/actions/manage-admins";
import { toast } from "sonner";
import { formatDateIndo } from "@/lib/utils";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  jenjang: "SD" | "SMP" | "ALL" | null;
  gender: string | null;
  created_at: string | null;
}

interface AdminTableProps {
  admins: AdminUserItem[];
  currentUserId: string;
}

export function AdminManagementTable({ admins, currentUserId }: AdminTableProps) {
  const [data, setData] = useState<AdminUserItem[]>(admins);
  const [search, setSearch] = useState("");
  const [filterJenjang, setFilterJenjang] = useState<"ALL" | "SD" | "SMP" | "SELESAI">("ALL");

  // Create Modal
  const [openCreate, setOpenCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createJenjang, setCreateJenjang] = useState<"SD" | "SMP" | "ALL">("SD");
  const [createGender, setCreateGender] = useState<"L" | "P">("L");
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edit Modal
  const [editingItem, setEditingItem] = useState<AdminUserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editJenjang, setEditJenjang] = useState<"SD" | "SMP" | "ALL">("SD");
  const [editGender, setEditGender] = useState<"L" | "P">("L");
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Delete Modal
  const [deletingItem, setDeletingItem] = useState<AdminUserItem | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filtered List
  const filteredAdmins = data.filter((adm) => {
    const matchesSearch =
      adm.name.toLowerCase().includes(search.toLowerCase()) ||
      adm.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterJenjang === "ALL") return true;
    return (adm.jenjang || "ALL") === filterJenjang;
  });

  // Handlers
  const handleOpenCreate = () => {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setShowCreatePassword(false);
    setCreateJenjang("SD");
    setCreateGender("L");
    setOpenCreate(true);
  };

  const handleCreate = () => {
    if (!createName || !createEmail || !createPassword) {
      toast.error("Nama, email, dan password wajib diisi.");
      return;
    }

    const formData = new FormData();
    formData.append("name", createName);
    formData.append("email", createEmail);
    formData.append("password", createPassword);
    formData.append("jenjang", createJenjang);
    formData.append("gender", createGender);

    startTransition(async () => {
      const res = await createAdminAction(formData);
      if (res.success) {
        toast.success(res.message);
        setOpenCreate(false);
        // Refresh local state
        setData((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            name: createName,
            email: createEmail,
            jenjang: createJenjang,
            gender: createGender,
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleOpenEdit = (adm: AdminUserItem) => {
    setEditingItem(adm);
    setEditName(adm.name);
    setEditEmail(adm.email);
    setEditPassword("");
    setShowEditPassword(false);
    setEditJenjang(adm.jenjang || "ALL");
    setEditGender((adm.gender as "L" | "P") || "L");
  };

  const handleEdit = () => {
    if (!editingItem) return;
    if (!editName || !editEmail) {
      toast.error("Nama dan email wajib diisi.");
      return;
    }

    const formData = new FormData();
    formData.append("id", editingItem.id);
    formData.append("name", editName);
    formData.append("email", editEmail);
    if (editPassword) formData.append("password", editPassword);
    formData.append("jenjang", editJenjang);
    formData.append("gender", editGender);

    startTransition(async () => {
      const res = await updateAdminAction(formData);
      if (res.success) {
        toast.success(res.message);
        setEditingItem(null);
        setData((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  name: editName,
                  email: editEmail,
                  jenjang: editJenjang,
                  gender: editGender,
                }
              : item
          )
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = () => {
    if (!deletingItem) return;

    const formData = new FormData();
    formData.append("id", deletingItem.id);

    startTransition(async () => {
      const res = await deleteAdminAction(formData);
      if (res.success) {
        toast.success(res.message);
        setData((prev) => prev.filter((item) => item.id !== deletingItem.id));
        setDeletingItem(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  const getJenjangBadge = (jenjang: string | null) => {
    if (jenjang === "ALL" || !jenjang) {
      return (
        <Badge variant="purple" className="gap-1 font-semibold text-xs py-0.5">
          <ShieldCheck className="h-3 w-3" />
          Super Admin
        </Badge>
      );
    }
    if (jenjang === "SD") {
      return (
        <Badge variant="emerald" className="gap-1 font-semibold text-xs py-0.5">
          <Shield className="h-3 w-3" />
          Admin SD
        </Badge>
      );
    }
    return (
      <Badge variant="blue" className="gap-1 font-semibold text-xs py-0.5">
        <Shield className="h-3 w-3" />
        Admin SMP
      </Badge>
    );
  };

  return (
    <>
      <Card elevationSize="sm" className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border-border/60 shadow-sm overflow-hidden">
      {/* Top action & filter bar */}
      <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari admin berdasarkan nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/80 h-9 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setFilterJenjang("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterJenjang === "ALL"
                  ? "bg-background shadow-xs text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({data.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterJenjang("SD")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterJenjang === "SD"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SD ({data.filter((d) => d.jenjang === "SD").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterJenjang("SMP")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterJenjang === "SMP"
                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SMP ({data.filter((d) => d.jenjang === "SMP").length})
            </button>
          </div>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 px-3.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Admin</span>
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-12 text-center text-xs font-semibold">No</TableHead>
              <TableHead className="text-xs font-semibold">Nama Administrator</TableHead>
              <TableHead className="text-xs font-semibold">Email Akun</TableHead>
              <TableHead className="text-xs font-semibold">Jenjang Otoritas</TableHead>
              <TableHead className="text-xs font-semibold">Gender</TableHead>
              <TableHead className="text-xs font-semibold">Terdaftar</TableHead>
              <TableHead className="text-right text-xs font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  Tidak ada data administrator yang sesuai kriteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredAdmins.map((adm, idx) => {
                const isCurrentUser = adm.id === currentUserId;
                return (
                  <TableRow key={adm.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center font-medium text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-foreground">{adm.name}</span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            Akun Anda
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {adm.email}
                    </TableCell>
                    <TableCell>{getJenjangBadge(adm.jenjang)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {adm.gender === "P" ? "Perempuan" : "Laki-laki"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {adm.created_at ? formatDateIndo(adm.created_at) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(adm)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          title="Edit Admin"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isCurrentUser}
                          onClick={() => setDeletingItem(adm)}
                          className={`h-7 w-7 ${
                            isCurrentUser
                              ? "opacity-30 cursor-not-allowed"
                              : "text-rose-500 hover:text-rose-700 hover:bg-rose-500/10"
                          }`}
                          title={isCurrentUser ? "Tidak dapat menghapus akun sendiri" : "Hapus Admin"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

      {/* Modal Create Admin */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              Tambah Administrator Baru
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Nama Lengkap</Label>
              <Input
                id="create-name"
                placeholder="Contoh: Ustadz Ahmad, S.Kom"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Alamat Email</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="admin.sd@gmail.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">Password Akun</Label>
              <div className="relative">
                <Input
                  id="create-password"
                  type={showCreatePassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none cursor-pointer"
                  title={showCreatePassword ? "Sembunyikan password" : "Lihat password"}
                  tabIndex={-1}
                >
                  {showCreatePassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Jenjang Otoritas Akses</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCreateJenjang("SD")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    createJenjang === "SD"
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Admin SD
                  <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                    Hanya data SD
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCreateJenjang("SMP")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    createJenjang === "SMP"
                      ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Admin SMP
                  <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                    Hanya data SMP
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCreateJenjang("ALL")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    createJenjang === "ALL"
                      ? "border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/30"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Super Admin
                  <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                    SD + SMP + Kelola
                  </div>
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Kelamin</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={createGender === "L"}
                    onChange={() => setCreateGender("L")}
                  />
                  Laki-laki
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={createGender === "P"}
                    onChange={() => setCreateGender("P")}
                  />
                  Perempuan
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Admin */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-600" />
              Edit Data Administrator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Alamat Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-password">
                Password Baru{" "}
                <span className="text-xs text-muted-foreground">(Kosongkan jika tidak diganti)</span>
              </Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showEditPassword ? "text" : "password"}
                  placeholder="Isi untuk mereset password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none cursor-pointer"
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
            <div className="space-y-1.5">
              <Label>Jenjang Otoritas Akses</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEditJenjang("SD")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    editJenjang === "SD"
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Admin SD
                </button>
                <button
                  type="button"
                  onClick={() => setEditJenjang("SMP")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    editJenjang === "SMP"
                      ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Admin SMP
                </button>
                <button
                  type="button"
                  onClick={() => setEditJenjang("ALL")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    editJenjang === "ALL"
                      ? "border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/30"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Super Admin
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Kelamin</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="editGender"
                    checked={editGender === "L"}
                    onChange={() => setEditGender("L")}
                  />
                  Laki-laki
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="editGender"
                    checked={editGender === "P"}
                    onChange={() => setEditGender("P")}
                  />
                  Perempuan
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Hapus Akun Administrator
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akun administrator{" "}
              <strong>{deletingItem?.name}</strong> ({deletingItem?.email})? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isPending ? "Menghapus..." : "Ya, Hapus Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
