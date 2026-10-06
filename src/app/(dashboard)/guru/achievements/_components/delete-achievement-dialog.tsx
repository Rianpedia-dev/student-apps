"use client";

import React, { useState } from "react";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
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
import { deleteAchievementAction } from "@/actions/guru";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteAchievementDialogProps {
  id: string | null;
  studentName?: string;
  achievementTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteAchievementDialog({
  id,
  studentName,
  achievementTitle,
  open,
  onOpenChange,
  onSuccess,
}: DeleteAchievementDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const res = await deleteAchievementAction(id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(res?.message || "Prestasi berhasil dihapus.");
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
      <AlertDialogContent className="sm:max-w-md rounded-2xl">
        <AlertDialogHeader>
          <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <AlertDialogTitle className="text-lg font-bold">Hapus Prestasi Siswa?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Catatan prestasi <strong className="text-foreground">{studentName || "siswa"}</strong> dengan raihan &quot;
            <span className="italic">{achievementTitle || "prestasi"}</span>&quot; akan dihapus secara permanen dari sistem.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Ya, Hapus
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
