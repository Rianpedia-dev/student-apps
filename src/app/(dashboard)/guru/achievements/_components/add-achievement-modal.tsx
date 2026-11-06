"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Loader2,
  UploadCloud,
  X,
  Edit3,
  Award,
  Sparkles,
  Search,
  Check,
  ChevronDown,
} from "lucide-react";
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
import { createAchievementAction, updateAchievementAction } from "@/actions/achievement";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  TINGKAT_PRESTASI,
  PERINGKAT_PRESTASI,
  type TingkatPrestasi,
  type PeringkatPrestasi,
  calculateAchievementPoints,
  getTingkatBadgeProps,
  getPeringkatBadgeProps,
} from "@/lib/achievement-points";

export interface StudentOption {
  id: string;
  name: string;
  nis?: string;
  kelas?: string;
  image?: string | null;
  gender?: string | null;
}

export interface EditableAchievement {
  id: string;
  id_user: string;
  nama: string;
  kelas: string;
  kelas_saat_prestasi?: string;
  tahun_ajaran?: string;
  tingkat?: string;
  peringkat?: string;
  poin?: number;
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
  onSuccess?: () => void;
}

interface AchievementFormProps {
  students: StudentOption[];
  guruClass: string;
  achievementToEdit?: EditableAchievement | null;
  onClose: () => void;
  onSuccess?: () => void;
}

function getCurrentAcademicYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
}

function AchievementFormInner({
  students,
  guruClass,
  achievementToEdit,
  onClose,
  onSuccess,
}: AchievementFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(achievementToEdit);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(achievementToEdit?.id_user || "");
  const [studentName, setStudentName] = useState(achievementToEdit?.nama || "");
  const [prestasi, setPrestasi] = useState(achievementToEdit?.prestasi || "");

  // Search Combobox State
  const [studentSearch, setStudentSearch] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStudentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form Fields Skala 1-16
  const [tingkat, setTingkat] = useState<TingkatPrestasi>(
    (achievementToEdit?.tingkat as TingkatPrestasi) || "Nasional"
  );
  const [peringkat, setPeringkat] = useState<PeringkatPrestasi>(
    (achievementToEdit?.peringkat as PeringkatPrestasi) || "Juara 1"
  );

  // Field otomatis yang tidak perlu diinput manual oleh user
  const [kelasSaatPrestasi, setKelasSaatPrestasi] = useState<string>(
    achievementToEdit?.kelas_saat_prestasi || achievementToEdit?.kelas || guruClass || ""
  );
  const [tahunAjaran, setTahunAjaran] = useState<string>(
    achievementToEdit?.tahun_ajaran || getCurrentAcademicYear()
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const initialPhoto =
    achievementToEdit?.fotoanak &&
    !achievementToEdit.fotoanak.includes("trophy") &&
    !achievementToEdit.fotoanak.includes("best-student") &&
    !achievementToEdit.fotoanak.includes("best-point")
      ? achievementToEdit.fotoanak
      : null;

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhoto);

  // Live Auto Poin Calculation (1 - 16)
  const currentPoints = useMemo(() => {
    return calculateAchievementPoints(tingkat, peringkat);
  }, [tingkat, peringkat]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Filter siswa berdasarkan input pencarian nama atau NIS (tanpa memunculkan nama kelas)
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nis && s.nis.toLowerCase().includes(q))
    );
  }, [students, studentSearch]);

  const handleSelectStudent = (student: StudentOption) => {
    setSelectedStudentId(student.id);
    setStudentName(student.name);
    if (!achievementToEdit) {
      setKelasSaatPrestasi(student.kelas || guruClass || "");
    }
    setIsStudentDropdownOpen(false);
    setStudentSearch("");
  };

  const handleClearStudent = () => {
    setSelectedStudentId("");
    setStudentName("");
    setIsStudentDropdownOpen(true);
    setStudentSearch("");
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

    const finalStudentId = selectedStudentId.trim();
    const finalStudentName = studentName.trim() || selectedStudent?.name || "";
    const finalKelas = kelasSaatPrestasi.trim() || selectedStudent?.kelas || guruClass || "Umum";

    if (!finalStudentId && !isEditMode) {
      toast.error("Silakan pilih siswa terlebih dahulu.");
      return;
    }

    if (!prestasi.trim()) {
      toast.error("Nama kejuaraan / cabang lomba wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("id_user", finalStudentId || "0");
      formData.set("nama", finalStudentName);
      formData.set("kelas", finalKelas);
      formData.set("kelas_saat_prestasi", finalKelas);
      formData.set("tahun_ajaran", tahunAjaran);
      formData.set("tingkat", tingkat);
      formData.set("peringkat", peringkat);
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
          res?.message || (isEditMode ? "Prestasi berhasil diperbarui!" : "Prestasi berhasil dicatat!")
        );
        onClose();
        onSuccess?.();
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
      {/* 1. Student Picker (Searchable Combobox Tanpa Nama Kelas) */}
      {isEditMode ? (
        <div className="p-3 rounded-2xl bg-muted/60 border border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar
              src={selectedStudent?.image}
              gender={selectedStudent?.gender}
              name={studentName}
              className="h-8 w-8 rounded-lg shrink-0 border border-border/50"
              previewable={false}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Siswa Terpilih
              </p>
              <p className="text-sm font-bold text-foreground mt-0.5 truncate">{studentName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {selectedStudent?.nis ? `NIS: ${selectedStudent.nis}` : "Tanpa NIS"}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
            Mode Edit
          </span>
        </div>
      ) : (
        <div className="space-y-1.5" ref={studentDropdownRef}>
          <div className="flex items-center justify-between">
            <Label htmlFor="student_search" className="text-xs font-semibold">
              Pilih Siswa Terdaftar <span className="text-amber-600 dark:text-amber-400">*</span>
            </Label>
            {selectedStudent && (
              <button
                type="button"
                onClick={handleClearStudent}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Ganti Siswa
              </button>
            )}
          </div>

          <div className="relative">
            {selectedStudent && !isStudentDropdownOpen ? (
              /* Kartu Siswa Terpilih (Menampilkan NIS, Tanpa Nama Kelas) */
              <div
                onClick={() => setIsStudentDropdownOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar
                    src={selectedStudent.image}
                    gender={selectedStudent.gender}
                    name={selectedStudent.name}
                    className="h-8 w-8 rounded-lg shrink-0 border border-amber-500/30"
                    previewable={false}
                  />
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-foreground truncate">
                      {selectedStudent.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selectedStudent.nis ? `NIS: ${selectedStudent.nis}` : "Tanpa NIS"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearStudent();
                    }}
                    title="Ganti Siswa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ) : (
              /* Input Pencarian Siswa (Search by Nama atau NIS) */
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="student_search"
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setIsStudentDropdownOpen(true);
                  }}
                  onFocus={() => setIsStudentDropdownOpen(true)}
                  placeholder="Ketik nama atau NIS siswa untuk mencari..."
                  className="pl-9 pr-8 text-xs sm:text-sm rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-amber-500/20"
                  autoComplete="off"
                />
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Dropdown Menu Hasil Pencarian (Hanya Nama & NIS, Tanpa Nama Kelas) */}
            {isStudentDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-border bg-popover shadow-xl p-1.5 text-popover-foreground divide-y divide-border/30">
                {filteredStudents.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Tidak ada siswa ditemukan untuk &quot;{studentSearch}&quot;
                  </div>
                ) : (
                  filteredStudents.map((s) => {
                    const isSelected = s.id === selectedStudentId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar
                            src={s.image}
                            gender={s.gender}
                            name={s.name}
                            className="h-7 w-7 rounded-md shrink-0 border border-border/50"
                            previewable={false}
                          />
                          <div className="min-w-0">
                            <p className="truncate leading-tight font-medium text-foreground">
                              {s.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {s.nis ? `NIS: ${s.nis}` : "Tanpa NIS"}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-amber-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Tingkat Kompetisi (Dropdown List) */}
      <div className="space-y-1.5">
        <Label htmlFor="tingkat" className="text-xs font-semibold">
          Tingkat Kompetisi
        </Label>
        <select
          id="tingkat"
          name="tingkat"
          value={tingkat}
          onChange={(e) => setTingkat(e.target.value as TingkatPrestasi)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
        >
          {TINGKAT_PRESTASI.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Peringkat Juara (4 Peringkat) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Peringkat Juara</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PERINGKAT_PRESTASI.map((p) => {
            const props = getPeringkatBadgeProps(p);
            const isSelected = peringkat === p;
            return (
              <button
                type="button"
                key={p}
                onClick={() => setPeringkat(p)}
                className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 font-bold"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <div className="text-sm mb-0.5">{props.icon}</div>
                <div className="truncate">{p}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Live Auto Points Calculator Banner (Skala 1 - 16) */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Kalkulasi Nilai Skala 1–16</p>
            <p className="text-xs font-bold text-foreground">
              {tingkat} • {peringkat}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
            +{currentPoints} Poin
          </span>
        </div>
      </div>

      {/* 5. Deskripsi Prestasi / Nama Kejuaraan */}
      <div className="space-y-1.5">
        <Label htmlFor="prestasi" className="text-xs font-semibold">
          Nama Kejuaraan / Cabang Lomba
        </Label>
        <Input
          id="prestasi"
          name="prestasi"
          placeholder="Contoh: Olimpiade Sains Nasional (OSN) Tingkat Pelajar 2026"
          value={prestasi}
          onChange={(e) => setPrestasi(e.target.value)}
          className="text-xs sm:text-sm rounded-xl"
          required
        />
      </div>

      {/* 6. Upload Foto Piagam / Piala */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Foto Piagam / Sertifikat / Piala</Label>
        {previewUrl ? (
          <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-border group">
            <Image src={previewUrl} alt="Preview Foto Prestasi" fill className="object-cover" />
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
              title="Hapus Foto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-2xl border-2 border-dashed border-input hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors cursor-pointer text-center px-4">
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Klik untuk Unggah Piagam</span>
            <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP (Maks. 5MB)</span>
            <input
              type="file"
              name="foto_upload"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-xl cursor-pointer"
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="launch"
          size="sm"
          disabled={isSubmitting}
          className="rounded-xl cursor-pointer gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Menyimpan...
            </>
          ) : isEditMode ? (
            "Perbarui Prestasi"
          ) : (
            `Simpan Prestasi (+${currentPoints} Poin)`
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddAchievementModal({
  students,
  guruClass,
  isOpen,
  onOpenChange,
  achievementToEdit,
  triggerButton,
  onSuccess,
}: AddAchievementModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = Boolean(achievementToEdit);

  return (
    <>
      {!isControlled && (
        triggerButton ? (
          <div onClick={() => setInternalOpen(true)} className="cursor-pointer">
            {triggerButton}
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => setInternalOpen(true)}
            className="rounded-xl shadow-md font-semibold gap-2 cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Prestasi Siswa</span>
          </Button>
        )
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[92vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {isEditMode ? "Edit Catatan Prestasi" : "Catat Prestasi Baru Siswa"}
            </DialogTitle>
          </DialogHeader>

          <AchievementFormInner
            students={students}
            guruClass={guruClass}
            achievementToEdit={achievementToEdit}
            onClose={() => setOpen?.(false)}
            onSuccess={onSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
