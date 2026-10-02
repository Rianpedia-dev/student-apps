"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import {
  gradeInteractiveEssayAction,
  updateSubmissionAction,
} from "@/actions/assignment";
import { toast } from "sonner";
import { ReviewHeader } from "./review-header";
import { ReviewActions } from "./review-actions";
import {
  ReviewQuestionCard,
  ReviewQuestionItem,
} from "./review-question-card";

export type { ReviewQuestionItem };

interface TeacherInteractiveTaskReviewProps {
  tugasId: string;
  tugasJudul: string;
  mapelNama: string;
  kelasNama: string;
  poinMaksimal: number;
  submission: {
    id: string;
    nilai: number | null;
    status: string;
    catatanGuru?: string | null;
    durasiDetik?: number | null;
    submittedAt: string;
    siswa: {
      id: string;
      name: string;
      nis?: string | null;
      image?: string | null;
      gender?: string | null;
    };
  };
  questions: ReviewQuestionItem[];
  prevSubId?: string | null;
  nextSubId?: string | null;
  fromOrigin?: string;
}

export function TeacherInteractiveTaskReview({
  tugasId,
  mapelNama,
  kelasNama,
  poinMaksimal,
  submission,
  questions,
  prevSubId,
  nextSubId,
  fromOrigin,
}: TeacherInteractiveTaskReviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Essay grading states per question id: { [soalId]: { poin: number, catatan: string } }
  const [essayScores, setEssayScores] = useState<
    Record<string, { poin: number; catatan: string }>
  >(() => {
    const map: Record<string, { poin: number; catatan: string }> = {};
    questions.forEach((q) => {
      if (q.tipe_soal === "ESAI") {
        map[q.id] = {
          poin: q.jawabanSiswa?.poin_didapat ?? 0,
          catatan: q.jawabanSiswa?.catatan_koreksi ?? "",
        };
      }
    });
    return map;
  });

  const [savingEssayId, setSavingEssayId] = useState<string | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(submission.nilai ?? 0);
  const [currentStatus, setCurrentStatus] = useState<string>(submission.status);
  const [teacherNote, setTeacherNote] = useState<string>(
    submission.catatanGuru || ""
  );
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const handleSaveEssayScore = (soalId: string, maxPoints: number) => {
    const data = essayScores[soalId];
    if (!data) return;

    if (data.poin < 0 || data.poin > maxPoints) {
      toast.error(`Poin harus antara 0 dan ${maxPoints}.`);
      return;
    }

    setSavingEssayId(soalId);
    startTransition(async () => {
      const res = await gradeInteractiveEssayAction({
        submissionId: submission.id,
        soalId,
        poinDidapat: data.poin,
        catatanKoreksi: data.catatan,
      });

      if (res.success) {
        toast.success(res.message);
        if (res.nilaiFinal !== undefined) {
          setCurrentScore(res.nilaiFinal);
          setCurrentStatus("sudah_dinilai");
        }
      } else {
        toast.error(res.error || "Gagal menyimpan nilai esai.");
      }
      setSavingEssayId(null);
    });
  };

  const handleSaveTeacherNote = async () => {
    setIsSavingNote(true);
    try {
      const res = await updateSubmissionAction({
        submissionId: submission.id,
        catatan: teacherNote,
      });
      if (res.success) {
        toast.success(res.message);
        setCurrentStatus("sudah_dinilai");
      } else {
        toast.error(res.error || "Gagal menyimpan catatan.");
      }
    } catch {
      toast.error("Terjadi kendala jaringan.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleRequestRevision = async (note: string) => {
    if (!note.trim()) {
      toast.error("Mohon tuliskan arahan atau bagian mana yang perlu diperbaiki.");
      return;
    }

    setIsSubmittingRevision(true);
    try {
      const res = await updateSubmissionAction({
        submissionId: submission.id,
        catatan: note,
        requestRevision: true,
      });
      if (res.success) {
        toast.success(res.message);
        setCurrentStatus("perlu_revisi");
        setTeacherNote(note);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengirim permintaan revisi.");
      }
    } catch {
      toast.error("Terjadi kendala jaringan.");
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const backHref =
    fromOrigin === "mapel" ? `/guru/mapel` : `/guru/tugas/${tugasId}`;

  const totalBenar = questions.filter(
    (q) => q.jawabanSiswa?.is_benar === true
  ).length;
  const totalSalah = questions.filter(
    (q) =>
      q.tipe_soal !== "ESAI" &&
      q.jawabanSiswa &&
      q.jawabanSiswa.is_benar === false
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* ── Header: Student banner & speed grader nav ── */}
      <ReviewHeader
        tugasId={tugasId}
        mapelNama={mapelNama}
        kelasNama={kelasNama}
        poinMaksimal={poinMaksimal}
        currentScore={currentScore}
        currentStatus={currentStatus}
        totalBenar={totalBenar}
        totalSalah={totalSalah}
        backHref={backHref}
        prevSubId={prevSubId}
        nextSubId={nextSubId}
        submission={submission}
      />

      {/* ── Actions: General note & revision request ── */}
      <ReviewActions
        teacherNote={teacherNote}
        onTeacherNoteChange={setTeacherNote}
        onSaveNote={handleSaveTeacherNote}
        isSavingNote={isSavingNote}
        onRequestRevision={handleRequestRevision}
        isSubmittingRevision={isSubmittingRevision}
      />

      {/* ── Question List Review ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Lembar Pengerjaan Siswa ({questions.length} Butir Soal)</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            Hasil koreksi otomatis & manual
          </span>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <ReviewQuestionCard
              key={q.id}
              question={q}
              index={idx}
              essayScore={essayScores[q.id]}
              onEssayScoreChange={(data) =>
                setEssayScores((prev) => ({
                  ...prev,
                  [q.id]: data,
                }))
              }
              onSaveEssayScore={handleSaveEssayScore}
              isSavingEssay={savingEssayId === q.id || isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
