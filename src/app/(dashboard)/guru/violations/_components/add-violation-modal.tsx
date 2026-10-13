"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Loader2, Search, X, Check, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { VIOLATION_CATEGORIES, type ViolationSeverity } from "@/lib/constants/violations";
import { createViolationAction } from "@/actions/guru";
import { UserAvatar } from "@/components/shared/user-avatar";

export interface StudentOption {
  id: string;
  name: string;
  nis: string;
  kelas?: string | null;
  image?: string | null;
  gender?: string | null;
}

interface AddViolationModalProps {
  students: StudentOption[];
  guruClass?: string;
  defaultStudentId?: string;
}

export function AddViolationModal({
  students,
  guruClass,
  defaultStudentId,
}: AddViolationModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudentId || "");
  const [studentSearch, setStudentSearch] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState(VIOLATION_CATEGORIES[0]?.name || "");
  const [keterangan, setKeterangan] = useState("");
  const [severity, setSeverity] = useState<ViolationSeverity>("RINGAN");
  const [points, setPoints] = useState<number>(5);
  const [tindakan, setTindakan] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nis && s.nis.toLowerCase().includes(q)) ||
        (s.kelas && s.kelas.toLowerCase().includes(q))
    );
  }, [students, studentSearch]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleSeverityChange = (newSev: ViolationSeverity) => {
    setSeverity(newSev);
    if (newSev === "RINGAN") setPoints(5);
    else if (newSev === "SEDANG") setPoints(15);
    else if (newSev === "BERAT") setPoints(25);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      toast.error("Silakan pilih siswa terlebih dahulu.");
      return;
    }

    if (!keterangan.trim()) {
      toast.error("Deskripsi kejadian pelanggaran wajib diisi.");
      return;
    }

    const student = students.find((s) => s.id === selectedStudentId);

    try {
      setLoading(true);
      const formData = new FormData();
      formData.set("user_id", selectedStudentId);
      formData.set("nama", student?.name || "");
      formData.set("kelas", student?.kelas || guruClass || "");
      formData.set("kategori", selectedCategory);
      formData.set("keterangan", keterangan.trim());
      formData.set("severity", severity);
      formData.set("points", points.toString());
      formData.set("tindakan", tindakan.trim());
      formData.set("date", date);

      const res = await createViolationAction(formData);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Catatan kedisiplinan berhasil disimpan.");
        setOpen(false);
        // Reset form
        setKeterangan("");
        setTindakan("");
        setSeverity("RINGAN");
        setPoints(5);
        setStudentSearch("");
        if (!defaultStudentId) setSelectedStudentId("");
      }
    } catch {
      toast.error("Terjadi kendala saat menyimpan catatan pelanggaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Catat Kedisiplinan</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div>
              <DialogTitle className="text-base font-semibold">
                Catat Pelanggaran Kedisiplinan Siswa
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* 1. Pilih Siswa (Searchable Combobox) */}
          <div className="space-y-1.5" ref={studentDropdownRef}>
            <div className="flex items-center justify-between">
              <Label htmlFor="student_search" className="text-xs font-semibold">
                Pilih Siswa <span className="text-rose-500">*</span>
              </Label>
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentId("");
                    setIsStudentDropdownOpen(true);
                  }}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Ganti Siswa
                </button>
              )}
            </div>

            <div className="relative">
              {selectedStudent && !isStudentDropdownOpen ? (
                /* Card Terpilih */
                <div
                  onClick={() => setIsStudentDropdownOpen(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:bg-muted/40 cursor-pointer transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                      src={selectedStudent.image}
                      gender={selectedStudent.gender}
                      name={selectedStudent.name}
                      className="h-8 w-8 rounded-lg shrink-0 border border-border"
                      previewable={false}
                    />
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {selectedStudent.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {selectedStudent.nis ? `NIS: ${selectedStudent.nis}` : "Tanpa NIS"}{" "}
                        {selectedStudent.kelas ? `• ${selectedStudent.kelas}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudentId("");
                        setIsStudentDropdownOpen(true);
                      }}
                      title="Hapus pilihan"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ) : (
                /* Input Pencarian Siswa */
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
                    placeholder="Ketik nama siswa atau NIS untuk mencari..."
                    className="pl-9 pr-8 h-9 text-xs rounded-xl bg-background border-border focus-visible:ring-rose-500"
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

              {/* Dropdown Menu Hasil Pencarian */}
              {isStudentDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl p-1 text-popover-foreground divide-y divide-border/30">
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
                          onClick={() => {
                            setSelectedStudentId(s.id);
                            setIsStudentDropdownOpen(false);
                            setStudentSearch("");
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold"
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
                              <p className="truncate leading-tight">{s.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {s.nis ? `NIS: ${s.nis}` : "Tanpa NIS"}{" "}
                                {s.kelas ? `• [${s.kelas}]` : ""}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-rose-600 shrink-0 ml-2" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Kategori Pelanggaran */}
          <div className="space-y-1.5">
            <Label htmlFor="kategori" className="text-xs font-semibold">
              Kategori Pelanggaran <span className="text-rose-500">*</span>
            </Label>
            <select
              id="kategori"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-9 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
              required
            >
              {VIOLATION_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Deskripsi Kejadian */}
          <div className="space-y-1.5">
            <Label htmlFor="keterangan" className="text-xs font-semibold">
              Deskripsi Kejadian / Kronologi <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Menggunakan iPad untuk bermain game pada saat jam pelajaran Matematika..."
              rows={3}
              className="text-xs rounded-xl focus-visible:ring-rose-500"
              required
            />
          </div>

          {/* 5. Tingkat Keparahan & Poin & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="severity" className="text-xs font-semibold">
                Tingkat Keparahan
              </Label>
              <select
                id="severity"
                value={severity}
                onChange={(e) => handleSeverityChange(e.target.value as ViolationSeverity)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="RINGAN">Ringan (5 Poin)</option>
                <option value="SEDANG">Sedang (15 Poin)</option>
                <option value="BERAT">Berat (25 Poin)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="points" className="text-xs font-semibold">
                Bobot Poin Sanksi
              </Label>
              <Input
                id="points"
                type="number"
                min={1}
                max={50}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value) || 5)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-semibold">
                Tanggal Kejadian
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* 6. Rekomendasi Nasihat / Tindakan Awal (Opsional) */}
          <div className="space-y-1.5">
            <Label htmlFor="tindakan" className="text-xs font-semibold">
              Rekomendasi Nasihat / Tindakan Pembinaan (Opsional)
            </Label>
            <Input
              id="tindakan"
              value={tindakan}
              onChange={(e) => setTindakan(e.target.value)}
              placeholder="Contoh: Diberi nasihat lisan & diingatkan untuk mengunci iPad saat guru menerangkan"
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Simpan Catatan</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
