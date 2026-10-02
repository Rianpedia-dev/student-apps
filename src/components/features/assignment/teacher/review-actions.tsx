"use client";

import React, { useState } from "react";
import { MessageSquare, RotateCcw, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ReviewActionsProps {
  teacherNote: string;
  onTeacherNoteChange: (val: string) => void;
  onSaveNote: () => void;
  isSavingNote: boolean;
  onRequestRevision: (note: string) => Promise<void>;
  isSubmittingRevision: boolean;
}

export function ReviewActions({
  teacherNote,
  onTeacherNoteChange,
  onSaveNote,
  isSavingNote,
  onRequestRevision,
  isSubmittingRevision,
}: ReviewActionsProps) {
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");

  const handleConfirmRevision = async () => {
    if (!revisionNote.trim()) return;
    await onRequestRevision(revisionNote);
    setShowRevisionModal(false);
  };

  return (
    <>
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Catatan & Umpan Balik Guru</span>
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRevisionModal(true)}
                className="text-xs h-8 gap-1.5 text-destructive hover:text-destructive"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Minta Revisi</span>
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isSavingNote}
                onClick={onSaveNote}
                className="text-xs font-semibold h-8 gap-1.5"
              >
                {isSavingNote ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan Catatan</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <Textarea
            value={teacherNote}
            onChange={(e) => onTeacherNoteChange(e.target.value)}
            rows={2}
            placeholder="Tuliskan catatan apresiasi atau evaluasi untuk siswa (contoh: Ananda sudah sangat baik dalam memahami konsep!)..."
            className="text-xs sm:text-sm leading-relaxed"
          />
        </CardContent>
      </Card>

      {/* Revision Request Dialog */}
      <Dialog open={showRevisionModal} onOpenChange={setShowRevisionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-base font-bold text-foreground">
              Minta Siswa Memperbaiki / Revisi Tugas
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Status tugas siswa akan diubah menjadi <strong>Perlu Revisi</strong> sehingga siswa dapat membuka kembali lembar pengerjaan dan memperbaiki jawabannya.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-medium text-foreground block">
              Instruksi / Catatan Bagian yang Perlu Direvisi:
            </label>
            <Textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              rows={3}
              placeholder="Contoh: Tolong periksa kembali jawaban nomor 3 dan perjelas uraian esai nomor 4 ya ananda..."
              className="text-xs sm:text-sm"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRevisionModal(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSubmittingRevision || !revisionNote.trim()}
              onClick={handleConfirmRevision}
              className="text-xs font-semibold gap-1.5 h-9 px-4"
            >
              {isSubmittingRevision ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Kirim Permintaan Revisi</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
