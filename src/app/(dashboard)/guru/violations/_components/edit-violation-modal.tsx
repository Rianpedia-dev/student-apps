"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    if (violation) {
      setCategory(violation.kategori || VIOLATION_CATEGORIES[0]?.name || "");
      setKeterangan(violation.cleanKeterangan || violation.keterangan || "");
      const currentSev = (violation.tingkatan || violation.severity || "RINGAN").toUpperCase();
      setSeverity(currentSev === "SEDANG" ? "SEDANG" : "RINGAN");
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

      const res = await updateViolationAction(formData);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Catatan pelanggaran berhasil diperbarui.");
        onOpenChange(false);
      }
    } catch {
      toast.error("Terjadi kendala saat memperbarui catatan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Edit Catatan Kedisiplinan
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Siswa Terpilih (Read-only) */}
          <div className="rounded-xl p-3 bg-muted/40 border border-border/60">
            <p className="text-xs font-semibold text-foreground">{violation.nama}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Kelas: {violation.kelas || "-"}
              {violation.semester ? ` • ${violation.semester}` : ""}
              {violation.guru_nama ? ` • Dicatat oleh: ${violation.guru_nama}` : ""}
            </p>
          </div>

          {/* 1. Kategori Pelanggaran */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-kategori" className="text-xs font-semibold">
              Kategori Pelanggaran <span className="text-rose-500">*</span>
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
              Deskripsi Pelanggaran <span className="text-rose-500">*</span>
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

          {/* 3. Tingkatan Pelanggaran */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-severity" className="text-xs font-semibold">
              Tingkatan Pelanggaran <span className="text-rose-500">*</span>
            </Label>
            <select
              id="edit-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as ViolationSeverity)}
              className="w-full h-9 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="RINGAN">Ringan</option>
              <option value="SEDANG">Sedang</option>
            </select>
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
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
