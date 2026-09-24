"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  BookOpen, 
  Check, 
  X, 
  Loader2,
  Calendar,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { createMataPelajaranAction, deleteMataPelajaranAction } from "@/actions/subject";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SubjectItem {
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
}

export function SubjectsManager({ initialSubjects }: SubjectsManagerProps) {
  const router = useRouter();
  const [subjects, setSubjects] = useState(initialSubjects);
  const [search, setSearch] = useState("");
  const [filterJenjang, setFilterJenjang] = useState<"SEMUA" | "SD" | "SMP">("SEMUA");
  const [openModal, setOpenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);

  const filtered = subjects.filter((s) => {
    const matchesSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.kode.toLowerCase().includes(search.toLowerCase());
    const matchesJenjang = filterJenjang === "SEMUA" || s.jenjang === "SEMUA" || s.jenjang === filterJenjang;
    return matchesSearch && matchesJenjang;
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createMataPelajaranAction(formData);
      if (res.success) {
        toast.success(res.message);
        setOpenModal(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal membuat mata pelajaran.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await deleteMataPelajaranAction(deleteTarget.id);
      if (res.success) {
        toast.success(res.message);
        setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
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
      {/* Controls: Filter & Search & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(["SEMUA", "SD", "SMP"] as const).map((jenjang) => (
            <button
              key={jenjang}
              type="button"
              onClick={() => setFilterJenjang(jenjang)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                filterJenjang === jenjang
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {jenjang === "SEMUA" ? "Semua Jenjang" : `Jenjang ${jenjang}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode..."
              className="w-full text-xs rounded-xl border border-input bg-card pl-8 pr-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <Button
            type="button"
            onClick={() => setOpenModal(true)}
            size="sm"
            className="h-8 text-xs font-bold gap-1.5 rounded-xl shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Mapel</span>
          </Button>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sub) => (
          <div
            key={sub.id}
            className="rounded-2xl bg-card border border-border p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs font-bold uppercase text-primary border-primary/30">
                  {sub.kode}
                </Badge>
                <Badge variant={sub.jenjang === "SMP" ? "secondary" : "default"} className="text-[10px]">
                  {sub.jenjang === "SEMUA" ? "SD & SMP" : `Jenjang ${sub.jenjang}`}
                </Badge>
              </div>

              <h3 className="text-base font-bold text-foreground leading-snug">
                {sub.nama}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {sub.deskripsi || "Mata pelajaran kurikulum Al-Azhar Cairo Palembang."}
              </p>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  {sub.totalJadwal} Sesi
                </span>
                <span className="flex items-center gap-1">
                  <FileCheck className="h-3 w-3 text-primary" />
                  {sub.totalTugas} Tugas
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(sub)}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                title="Hapus Mata Pelajaran"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1">Jenjang *</label>
                <select
                  name="jenjang"
                  defaultValue="SEMUA"
                  className="w-full text-xs rounded-xl border border-input bg-background p-2.5"
                >
                  <option value="SEMUA">SD & SMP (Semua)</option>
                  <option value="SD">Khusus SD</option>
                  <option value="SMP">Khusus SMP</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Warna Badge</label>
                <select
                  name="warna"
                  defaultValue="emerald"
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
                placeholder="Deskripsi target pembelajaran dan silabus..."
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpenModal(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} size="sm" className="font-bold text-xs gap-1.5">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Simpan Mata Pelajaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-red-600">Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Apakah Anda yakin ingin menghapus mata pelajaran <strong>{deleteTarget?.nama}</strong>? Jadwal yang terhubung akan ikut terhapus.
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
              Hapus Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
