"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { VIOLATION_CATEGORIES, type ViolationSeverity } from "@/lib/constants/violations";
import { updateViolationAction } from "@/actions/guru";
import type { ViolationItem } from "@/types";

interface EditViolationModalProps {
  violation: ViolationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditViolationModal({
  violation,
  open,
  onOpenChange,
}: EditViolationModalProps) {
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [severity, setSeverity] = useState<ViolationSeverity>("RINGAN");
  const [points, setPoints] = useState<number>(5);
  const [tindakan, setTindakan] = useState("");

  useEffect(() => {
    if (violation) {
      setCategory(violation.kategori || VIOLATION_CATEGORIES[0]?.name || "");
      setKeterangan(violation.cleanKeterangan || violation.keterangan || "");
      setSeverity((violation.severity as ViolationSeverity) || "RINGAN");
      setPoints(violation.points ?? 5);
      setTindakan(violation.tindakan || "");
    }
  }, [violation]);

  if (!violation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keterangan.trim()) {
      toast.error("Deskripsi kejadian pelanggaran wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.set("id", violation.id);
      formData.set("kategori", category);
      formData.set("keterangan", keterangan.trim());
      formData.set("severity", severity);
      formData.set("points", points.toString());
      formData.set("tindakan", tindakan.trim());

      const res = await updateViolationAction(formData);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Catatan pelanggaran berhasil diperbarui.");
        onOpenChange(false);
      }
    } catch {
      toast.error("Gagal memperbarui catatan pelanggaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Edit Catatan Kedisiplinan
              </DialogTitle>
              <DialogDescription className="text-xs">
                Siswa: <strong className="text-foreground">{violation.nama}</strong> ({violation.kelas})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* 1. Kategori */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-kategori" className="text-xs font-semibold">
              Kategori Pelanggaran
            </Label>
            <select
              id="edit-kategori"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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

          {/* 2. Deskripsi Kejadian */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-keterangan" className="text-xs font-semibold">
              Deskripsi Kejadian / Kronologi
            </Label>
            <Textarea
              id="edit-keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={3}
              className="text-xs rounded-xl focus-visible:ring-rose-500"
              required
            />
          </div>

          {/* 3. Tingkat Keparahan & Poin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-severity" className="text-xs font-semibold">
                Tingkat Keparahan
              </Label>
              <select
                id="edit-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as ViolationSeverity)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="RINGAN">Ringan</option>
                <option value="SEDANG">Sedang</option>
                <option value="BERAT">Berat</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-points" className="text-xs font-semibold">
                Poin Pengurang
              </Label>
              <Input
                id="edit-points"
                type="number"
                min={1}
                max={50}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value) || 5)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* 4. Rekomendasi Nasihat / Tindakan */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-tindakan" className="text-xs font-semibold">
              Catatan / Tindakan Pembinaan
            </Label>
            <Input
              id="edit-tindakan"
              value={tindakan}
              onChange={(e) => setTindakan(e.target.value)}
              placeholder="Catatan konseling wali kelas..."
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Simpan Perubahan</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
