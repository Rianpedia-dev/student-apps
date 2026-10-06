"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Loader2, UploadCloud, X, Edit3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createAchievementAction, updateAchievementAction } from "@/actions/guru";
import { useRouter } from "next/navigation";

export interface StudentOption {
  id: string;
  name: string;
  nis?: string;
}

export interface EditableAchievement {
  id: string;
  id_user: string;
  nama: string;
  kelas: string;
  prestasi: string;
  fotoanak?: string;
}

interface AddAchievementModalProps {
  students: StudentOption[];
  guruClass: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  achievementToEdit?: EditableAchievement | null;
  triggerButton?: React.ReactNode;
}

interface AchievementFormProps {
  students: StudentOption[];
  guruClass: string;
  achievementToEdit?: EditableAchievement | null;
  onClose: () => void;
}

function AchievementFormInner({
  students,
  guruClass,
  achievementToEdit,
  onClose,
}: AchievementFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(achievementToEdit);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(achievementToEdit?.id_user || "");
  const [studentName, setStudentName] = useState(achievementToEdit?.nama || "");
  const [prestasi, setPrestasi] = useState(achievementToEdit?.prestasi || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const initialPhoto =
    achievementToEdit?.fotoanak &&
    !achievementToEdit.fotoanak.includes("trophy") &&
    !achievementToEdit.fotoanak.includes("best-student") &&
    !achievementToEdit.fotoanak.includes("best-point")
      ? achievementToEdit.fotoanak
      : null;

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhoto);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value;
    setSelectedStudentId(studentId);
    const found = students.find((s) => s.id === studentId);
    if (found) {
      setStudentName(found.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentName.trim() || !prestasi.trim()) {
      toast.error("Nama siswa dan deskripsi prestasi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("id_user", selectedStudentId || "0");
      formData.set("nama", studentName.trim());
      formData.set("kelas", achievementToEdit?.kelas || guruClass);
      formData.set("prestasi", prestasi.trim());

      if (selectedFile) {
        formData.set("foto_upload", selectedFile);
      } else if (previewUrl && isEditMode) {
        formData.set("fotoanak", previewUrl);
      }

      let res: { error?: string; message?: string } | undefined;

      if (isEditMode && achievementToEdit) {
        res = await updateAchievementAction(achievementToEdit.id, formData);
      } else {
        res = await createAchievementAction(formData);
      }

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(
          res?.message || (isEditMode ? "Prestasi berhasil diperbarui!" : "Prestasi berhasil ditambahkan!")
        );
        onClose();
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan prestasi.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {/* Student Picker */}
      <div className="space-y-1.5">
        <Label htmlFor="id_user" className="text-xs font-semibold">
          Pilih Siswa Terdaftar
        </Label>
        <select
          id="id_user"
          name="id_user"
          value={selectedStudentId}
          onChange={handleStudentChange}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">-- Pilih Siswa Kelas (Opsional) --</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.nis ? `(${s.nis})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Student Name */}
      <div className="space-y-1.5">
        <Label htmlFor="nama" className="text-xs font-semibold">
          Nama Lengkap Siswa *
        </Label>
        <Input
          id="nama"
          name="nama"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Contoh: Muhammad Rayhan Al-Fatih"
          required
          className="text-xs sm:text-sm"
        />
      </div>

      {/* Deskripsi Prestasi & Kejuaraan */}
      <div className="space-y-1.5">
        <Label htmlFor="prestasi" className="text-xs font-semibold">
          Deskripsi Prestasi & Kejuaraan *
        </Label>
        <Input
          id="prestasi"
          name="prestasi"
          value={prestasi}
          onChange={(e) => setPrestasi(e.target.value)}
          placeholder="Contoh: Juara 1 Olimpiade Sains & Matematika Nasional (OSMN) 2026"
          required
          className="text-xs sm:text-sm font-medium"
        />
      </div>

      {/* Photo / Certificate Upload with Live Preview */}
      <div className="space-y-1.5">
        <Label htmlFor="foto_upload" className="text-xs font-semibold">
          Foto Piagam / Sertifikat / Piala (Maks 5MB)
        </Label>

        {previewUrl ? (
          <div className="relative rounded-xl border border-border p-2 bg-muted/30 flex items-center gap-3">
            <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-border/80 bg-background shrink-0">
              <Image src={previewUrl} alt="Pratinjau Foto" fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {selectedFile ? selectedFile.name : "Foto Dokumentasi Terpasang"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : "Tersimpan di server"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleRemovePhoto}
              className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
              title="Hapus / Ganti Foto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative border-2 border-dashed border-border/80 hover:border-amber-500/50 rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
            <input
              id="foto_upload"
              name="foto_upload"
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.avif"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="space-y-1 flex flex-col items-center justify-center">
              <div className="h-9 w-9 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <UploadCloud className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-foreground">
                Pilih atau tarik foto piagam / sertifikat ke sini
              </p>
              <p className="text-[10px] text-muted-foreground">
                PNG, JPG, WEBP atau AVIF (Maks 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="pt-3 gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="cursor-pointer">
          Batal
        </Button>
        <Button type="submit" variant="launch" disabled={isSubmitting} className="gap-2 cursor-pointer">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              {isEditMode ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isEditMode ? "Perbarui Prestasi" : "Simpan Prestasi Siswa"}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddAchievementModal({
  students,
  guruClass,
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
  achievementToEdit,
  triggerButton,
}: AddAchievementModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) {
      setControlledOpen?.(val);
    } else {
      setInternalOpen(val);
    }
  };

  const isEditMode = Boolean(achievementToEdit);

  return (
    <>
      {!isControlled && (
        triggerButton ? (
          <div onClick={() => setOpen(true)}>{triggerButton}</div>
        ) : (
          <Button
            onClick={() => setOpen(true)}
            variant="launch"
            size="default"
            className="gap-2 cursor-pointer shadow-xs hover:shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Tambah Prestasi
          </Button>
        )
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Edit3 className="h-5 w-5 text-amber-500" />
                  Edit Catatan Prestasi
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-amber-500" />
                  Catat Prestasi Baru
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isEditMode
                ? "Perbarui informasi raihan kejuaraan atau ganti foto piagam penghargaan siswa."
                : `Tambahkan rekam jejak juara atau prestasi siswa ${guruClass ? `kelas ${guruClass}` : ""}.`}
            </DialogDescription>
          </DialogHeader>

          {open && (
            <AchievementFormInner
              key={achievementToEdit ? achievementToEdit.id : "new"}
              students={students}
              guruClass={guruClass}
              achievementToEdit={achievementToEdit}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
