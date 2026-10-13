"use client";

import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import { deleteViolationAction } from "@/actions/guru";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ViolationItem } from "@/types";

interface DeleteViolationDialogProps {
  violation: ViolationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteViolationDialog({
  violation,
  open,
  onOpenChange,
  onSuccess,
}: DeleteViolationDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!violation) return;
    setIsDeleting(true);
    try {
      const res = await deleteViolationAction(violation.id, violation.user_id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(res?.message || "Catatan pelanggaran berhasil dihapus.");
        onOpenChange(false);
        onSuccess?.();
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Trash2 className="h-5 w-5" />
            <AlertDialogTitle className="text-base">Hapus Catatan Pelanggaran?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs pt-1.5 leading-relaxed text-muted-foreground">
            Apakah Anda yakin ingin menghapus catatan kedisiplinan atas nama santri{" "}
            <strong className="text-foreground">{violation?.nama || "Siswa"}</strong> (
            {violation?.kategori})?
            <br />
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
          <AlertDialogCancel disabled={isDeleting} className="text-xs">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 focus:ring-rose-500"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Hapus Catatan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
