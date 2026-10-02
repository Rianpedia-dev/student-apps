"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import confetti from "canvas-confetti";

export interface ResultOption {
  id: string;
  label: string;
  teks_opsi?: string | null;
  gambar_opsi?: string | null;
  is_benar: boolean;
}

export interface ResultQuestionItem {
  id: string;
  nomor_urut: number;
  tipe_soal: string;
  pertanyaan: string;
  gambar_soal?: string | null;
  bobot_poin: number;
  kunci_jawaban?: string | null;
  pembahasan?: string | null;
  opsi: ResultOption[];
  jawabanSiswa?: {
    jawaban_siswa: string | null;
    is_benar: boolean | null;
    poin_didapat: number | null;
    catatan_koreksi?: string | null;
  } | null;
}

interface TaskResultViewProps {
  tugasId: string;
  tugasJudul: string;
  mapelNama: string;
  kelasNama: string;
  poinMaksimal: number;
  tampilkanNilaiInstan: boolean;
  submission: {
    id: string;
    nilai: number | null;
    totalBenar: number;
    totalSalah: number;
    durasiDetik?: number | null;
    status: string;
    catatanGuru?: string | null;
    submittedAt: string;
  };
  questions: ResultQuestionItem[];
}

export function TaskResultView({
  tugasId,
  tugasJudul,
  mapelNama,
  kelasNama,
  poinMaksimal,
  tampilkanNilaiInstan,
  submission,
  questions,
}: TaskResultViewProps) {
  const finalScore = submission.nilai ?? 0;
  const isPassing = finalScore >= 75;

  useEffect(() => {
    if (finalScore >= 75) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }, [finalScore]);

  const formatDuration = (secs?: number | null) => {
    if (!secs) return "-";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m === 0 ? `${s} detik` : `${m} menit ${s} detik`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Back */}
      <div>
        <Link
          href="/siswa/tugas"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-transparent hover:border-border transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Tugas
        </Link>
      </div>

      {/* Score Card */}
      <Card>
        <CardContent className="p-6 sm:p-8 text-center space-y-5">
          <Trophy className="h-10 w-10 text-primary mx-auto" />

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {mapelNama} • {kelasNama}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{tugasJudul}</h1>
          </div>

          {/* Score Display */}
          {submission.status === "menunggu_penilaian" ? (
            <div className="p-4 rounded-lg bg-muted/50 border border-border inline-block">
              <p className="text-sm font-semibold text-foreground">Menunggu Koreksi Soal Esai</p>
              <p className="text-xs text-muted-foreground mt-1">
                Skor akhir diperbarui setelah guru mengoreksi esai.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline justify-center gap-1 text-primary">
                <span className="text-5xl sm:text-6xl font-bold tracking-tight">{finalScore}</span>
                <span className="text-xl font-medium text-muted-foreground">/{poinMaksimal}</span>
              </div>
              <Badge variant={isPassing ? "default" : "secondary"} className="mt-2">
                {finalScore >= 90 ? "Sempurna!" : finalScore >= 75 ? "Tuntas" : "Tetap Semangat"}
              </Badge>
            </div>
          )}

          {/* Stats Row */}
          <Separator />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            <StatPill label="Total Soal" value={`${questions.length}`} />
            <StatPill label="Benar" value={`${submission.totalBenar}`} highlight="primary" />
            <StatPill label="Salah" value={`${submission.totalSalah}`} highlight="destructive" />
            <StatPill label="Durasi" value={formatDuration(submission.durasiDetik)} />
          </div>

          {/* Teacher Note */}
          {submission.catatanGuru && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-left max-w-lg mx-auto">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                Catatan Guru:
              </span>
              <p className="text-xs text-foreground leading-relaxed">
                &quot;{submission.catatanGuru}&quot;
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Review */}
      {tampilkanNilaiInstan && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Pembahasan Soal</h2>
          </div>

          {questions.map((q, idx) => {
            const ans = q.jawabanSiswa;
            const chosen = ans?.jawaban_siswa?.toUpperCase() || "";
            const isCorrect = ans?.is_benar === true;
            const isEssay = q.tipe_soal === "ESAI";

            return (
              <Card key={q.id}>
                <CardContent className="p-4 sm:p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" size="sm">Soal {idx + 1}</Badge>
                      <span className="text-xs text-muted-foreground">{ans?.poin_didapat ?? 0}/{q.bobot_poin} poin</span>
                    </div>
                    {!isEssay && (
                      <span className={`text-xs font-semibold flex items-center gap-1 ${isCorrect ? "text-primary" : "text-destructive"}`}>
                        {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {isCorrect ? "Benar" : "Salah"}
                      </span>
                    )}
                  </div>

                  {/* Stimulus image */}
                  {q.gambar_soal && (
                    <div className="rounded-lg border border-border overflow-hidden bg-muted/20 p-1 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={q.gambar_soal} alt="Stimulus" className="max-h-48 object-contain rounded" />
                    </div>
                  )}

                  {/* Question text */}
                  <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-line">
                    {q.pertanyaan}
                  </p>

                  {/* MC Options */}
                  {(q.tipe_soal === "PILIHAN_GANDA" || q.tipe_soal === "PILIHAN_GAMBAR") && (
                    <div className="space-y-1.5">
                      {q.opsi.map((op) => {
                        const isStudentPick = chosen === op.label.toUpperCase();
                        const isKey = op.is_benar;
                        return (
                          <div
                            key={op.id || op.label}
                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                              isKey
                                ? "bg-primary/5 border-primary/30 font-medium"
                                : isStudentPick && !isKey
                                ? "bg-destructive/5 border-destructive/30"
                                : "bg-background border-border"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                isKey ? "bg-primary text-primary-foreground" : isStudentPick ? "bg-destructive text-white" : "bg-muted text-muted-foreground"
                              }`}>
                                {op.label}
                              </span>
                              <span>{op.teks_opsi || "Pilihan Gambar"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isStudentPick && <Badge variant="secondary" size="sm">Pilihanmu</Badge>}
                              {isKey && <Badge variant="outline" size="sm">Kunci</Badge>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short answer */}
                  {q.tipe_soal === "ISIAN_SINGKAT" && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                      <div>
                        <span className="text-muted-foreground">Jawabanmu: </span>
                        <strong className={isCorrect ? "text-primary" : "text-destructive"}>
                          {ans?.jawaban_siswa || "(Tidak dijawab)"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kunci: </span>
                        <strong className="text-primary">{q.kunci_jawaban}</strong>
                      </div>
                    </div>
                  )}

                  {/* Essay */}
                  {q.tipe_soal === "ESAI" && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-2">
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-1">Jawaban uraianmu:</span>
                        <p className="p-2 bg-background rounded border border-border text-foreground whitespace-pre-wrap">
                          {ans?.jawaban_siswa || "(Tidak dijawab)"}
                        </p>
                      </div>
                      {ans?.catatan_koreksi && (
                        <p className="text-xs text-muted-foreground">
                          Catatan guru: {ans.catatan_koreksi}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pembahasan */}
                  {q.pembahasan && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs space-y-1">
                      <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Pembahasan:
                      </span>
                      <p className="text-muted-foreground leading-relaxed pl-5">{q.pembahasan}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bottom return */}
      <div className="pt-4 flex justify-center">
        <Link href="/siswa/tugas">
          <Button variant="outline" className="font-semibold">Kembali ke Daftar Tugas</Button>
        </Link>
      </div>
    </div>
  );
}

function StatPill({ label, value, highlight }: { label: string; value: string; highlight?: "primary" | "destructive" }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-center">
      <span className="text-[11px] font-medium text-muted-foreground block">{label}</span>
      <strong className={`text-sm font-bold ${highlight === "primary" ? "text-primary" : highlight === "destructive" ? "text-destructive" : "text-foreground"}`}>
        {value}
      </strong>
    </div>
  );
}
