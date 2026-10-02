"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createInteractiveTugasAction,
  updateInteractiveTugasAction,
  uploadTaskImageAction,
  QuestionItemInput,
  QuestionOptionInput,
} from "@/actions/assignment";
import { toast } from "sonner";
import {
  BuilderStepInfo,
  ClassOption,
  SubjectOption,
  PertemuanOption,
} from "./builder-step-info";
import { BuilderStepQuestions } from "./builder-step-questions";
import { BuilderStepSettings } from "./builder-step-settings";

export type { ClassOption, SubjectOption, PertemuanOption };

interface InteractiveTaskBuilderProps {
  classes: ClassOption[];
  subjects: SubjectOption[];
  pertemuanList?: PertemuanOption[];
  defaultKelas?: string;
  initialKelasId?: string;
  initialMapelId?: string;
  fromOrigin?: string;
  initialData?: {
    id: string;
    judul: string;
    deskripsi: string;
    kelas_id: string;
    mapel_id: string;
    pertemuan_id?: string | null;
    deadline: string;
    durasi_menit?: number | null;
    acak_soal?: boolean;
    acak_opsi?: boolean;
    tampilkan_nilai_instan?: boolean;
    poin_maksimal?: number;
    soal: QuestionItemInput[];
  };
}

const DEFAULT_OPTIONS: QuestionOptionInput[] = [
  { label: "A", teks_opsi: "", gambar_opsi: null, is_benar: true },
  { label: "B", teks_opsi: "", gambar_opsi: null, is_benar: false },
  { label: "C", teks_opsi: "", gambar_opsi: null, is_benar: false },
  { label: "D", teks_opsi: "", gambar_opsi: null, is_benar: false },
];

export function InteractiveTaskBuilder({
  classes,
  subjects,
  pertemuanList = [],
  defaultKelas,
  initialKelasId,
  initialMapelId,
  fromOrigin,
  initialData,
}: InteractiveTaskBuilderProps) {
  const router = useRouter();

  // Active step: 1 = Header Info, 2 = Builder Soal, 3 = Pengaturan & Publish
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);

  // Form State: Step 1 (Info Tugas)
  const matchedClass = classes.find((c) => c.nama === defaultKelas);
  const [kelasId, setKelasId] = useState(
    initialData?.kelas_id || initialKelasId || matchedClass?.id || classes[0]?.id || ""
  );
  const [mapelId, setMapelId] = useState(
    initialData?.mapel_id || initialMapelId || subjects[0]?.id || ""
  );
  const [pertemuanId, setPertemuanId] = useState<string>(
    initialData?.pertemuan_id || ""
  );
  const [judul, setJudul] = useState(initialData?.judul || "");
  const [deskripsi, setDeskripsi] = useState(
    initialData?.deskripsi ||
      "Pilihlah salah satu jawaban yang paling tepat. Pastikan memeriksa kembali sebelum mengumpulkan!"
  );

  // Default deadline: 3 days ahead
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);
  defaultDate.setHours(23, 59, 0, 0);
  const [deadline, setDeadline] = useState(
    initialData?.deadline
      ? new Date(initialData.deadline).toISOString().slice(0, 16)
      : defaultDate.toISOString().slice(0, 16)
  );

  // Step 3 (Pengaturan Kuis)
  const [durasiMenit, setDurasiMenit] = useState<string>(
    initialData?.durasi_menit ? initialData.durasi_menit.toString() : "30"
  );
  const [hasDurationLimit, setHasDurationLimit] = useState(
    initialData?.durasi_menit ? true : true
  );
  const [acakSoal, setAcakSoal] = useState(initialData?.acak_soal || false);
  const [acakOpsi, setAcakOpsi] = useState(initialData?.acak_opsi || false);
  const [tampilkanNilai, setTampilkanNilai] = useState(
    initialData?.tampilkan_nilai_instan ?? true
  );

  // Form State: Step 2 (Daftar Butir Soal)
  const [questions, setQuestions] = useState<QuestionItemInput[]>(() => {
    if (initialData?.soal && initialData.soal.length > 0) {
      return initialData.soal;
    }
    return [
      {
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "",
        gambar_soal: null,
        bobot_poin: 20,
        kunci_jawaban: "A",
        pembahasan: "",
        opsi: DEFAULT_OPTIONS.map((o) => ({ ...o })),
      },
    ];
  });

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const totalBobot = questions.reduce(
    (sum, q) => sum + (Number(q.bobot_poin) || 0),
    0
  );

  const handleAddQuestion = (
    type: QuestionItemInput["tipe_soal"] = "PILIHAN_GANDA"
  ) => {
    const nextNomor = questions.length + 1;
    const newQ: QuestionItemInput = {
      nomor_urut: nextNomor,
      tipe_soal: type,
      pertanyaan: "",
      gambar_soal: null,
      bobot_poin: 10,
      kunci_jawaban: type === "ISIAN_SINGKAT" ? "" : "A",
      pembahasan: "",
      opsi:
        type === "PILIHAN_GANDA" || type === "PILIHAN_GAMBAR"
          ? DEFAULT_OPTIONS.map((o) => ({ ...o }))
          : [],
    };
    setQuestions([...questions, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error("Minimal harus ada 1 butir soal.");
      return;
    }
    const updated = questions
      .filter((_, i) => i !== index)
      .map((q, idx) => ({ ...q, nomor_urut: idx + 1 }));
    setQuestions(updated);
    if (activeQuestionIndex >= updated.length) {
      setActiveQuestionIndex(updated.length - 1);
    }
  };

  const updateQuestion = (
    index: number,
    updates: Partial<QuestionItemInput>
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const updateOption = (
    qIndex: number,
    opIndex: number,
    updates: Partial<QuestionOptionInput>
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      const ops = [...q.opsi];
      ops[opIndex] = { ...ops[opIndex], ...updates };

      if (updates.is_benar) {
        ops.forEach((o, idx) => {
          if (idx !== opIndex) o.is_benar = false;
        });
        q.kunci_jawaban = ops[opIndex].label;
      }

      q.opsi = ops;
      copy[qIndex] = q;
      return copy;
    });
  };

  const handleDistributePointsEvenly = () => {
    if (questions.length === 0) return;
    const base = Math.floor(100 / questions.length);
    const remainder = 100 - base * questions.length;
    setQuestions((prev) =>
      prev.map((q, i) => ({
        ...q,
        bobot_poin: i === 0 ? base + remainder : base,
      }))
    );
    toast.success("Bobot poin berhasil dibagi rata (Total 100 Poin)!");
  };

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
    onSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageKey(key);
    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await uploadTaskImageAction(fd);
      if (res.success && res.url) {
        onSuccess(res.url);
        toast.success("Gambar berhasil diunggah!");
      } else {
        toast.error(res.error || "Gagal mengunggah gambar.");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setUploadingImageKey(null);
    }
  };

  const handleNextFromStep1 = () => {
    if (!judul.trim()) {
      toast.error("Judul tugas wajib diisi.");
      return;
    }
    if (!deskripsi.trim()) {
      toast.error("Instruksi tugas wajib diisi.");
      return;
    }
    if (!deadline) {
      toast.error("Tenggat waktu wajib diisi.");
      return;
    }
    setActiveStep(2);
  };

  const handleNextFromStep2 = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.pertanyaan.trim()) {
        toast.error(`Soal nomor ${i + 1} belum memiliki teks pertanyaan.`);
        setActiveQuestionIndex(i);
        return;
      }
      if (q.tipe_soal === "PILIHAN_GANDA" || q.tipe_soal === "PILIHAN_GAMBAR") {
        const hasCorrect = q.opsi.some((o) => o.is_benar);
        if (!hasCorrect) {
          toast.error(
            `Pilih salah satu kunci jawaban benar untuk soal nomor ${i + 1}.`
          );
          setActiveQuestionIndex(i);
          return;
        }
      }
    }
    setActiveStep(3);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      kelas_id: kelasId,
      mapel_id: mapelId,
      pertemuan_id: pertemuanId || null,
      deadline,
      durasi_menit:
        hasDurationLimit && durasiMenit ? parseInt(durasiMenit, 10) : null,
      acak_soal: acakSoal,
      acak_opsi: acakOpsi,
      tampilkan_nilai_instan: tampilkanNilai,
      poin_maksimal: totalBobot || 100,
      soal: questions,
    };

    try {
      if (initialData?.id) {
        const res = await updateInteractiveTugasAction(initialData.id, payload);
        if (res.success) {
          toast.success(res.message);
          router.push(`/guru/tugas/${initialData.id}`);
        } else {
          toast.error(res.error || "Gagal memperbarui tugas.");
        }
      } else {
        const res = await createInteractiveTugasAction(payload);
        if (res.success && res.data) {
          toast.success(res.message);
          if (fromOrigin === "mapel" && mapelId && kelasId) {
            router.push(`/guru/tugas?mapelId=${mapelId}&kelasId=${kelasId}`);
          } else {
            router.push(`/guru/tugas/${res.data.id}`);
          }
        } else {
          toast.error(res.error || "Gagal membuat tugas.");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan tugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Stepper Header ── */}
      <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 max-w-xl mx-auto">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeStep === 1
                ? "text-primary font-bold"
                : activeStep > 1
                ? "text-foreground hover:text-primary"
                : "text-muted-foreground"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                activeStep === 1
                  ? "bg-primary text-primary-foreground"
                  : activeStep > 1
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </span>
            <span>Info Tugas</span>
          </button>

          <div className="h-px flex-1 max-w-16 bg-border" />

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => handleNextFromStep1()}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeStep === 2
                ? "text-primary font-bold"
                : activeStep > 2
                ? "text-foreground hover:text-primary"
                : "text-muted-foreground"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                activeStep === 2
                  ? "bg-primary text-primary-foreground"
                  : activeStep > 2
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </span>
            <span>Butir Soal ({questions.length})</span>
          </button>

          <div className="h-px flex-1 max-w-16 bg-border" />

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => handleNextFromStep2()}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeStep === 3
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                activeStep === 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </span>
            <span>Pengaturan</span>
          </button>
        </div>
      </div>

      {/* ── Step 1: Info Tugas ── */}
      {activeStep === 1 && (
        <BuilderStepInfo
          judul={judul}
          setJudul={setJudul}
          deskripsi={deskripsi}
          setDeskripsi={setDeskripsi}
          kelasId={kelasId}
          setKelasId={setKelasId}
          mapelId={mapelId}
          setMapelId={setMapelId}
          pertemuanId={pertemuanId}
          setPertemuanId={setPertemuanId}
          deadline={deadline}
          setDeadline={setDeadline}
          classes={classes}
          subjects={subjects}
          pertemuanList={pertemuanList}
          onNext={handleNextFromStep1}
        />
      )}

      {/* ── Step 2: Butir Soal ── */}
      {activeStep === 2 && (
        <BuilderStepQuestions
          questions={questions}
          activeQuestionIndex={activeQuestionIndex}
          setActiveQuestionIndex={setActiveQuestionIndex}
          onAddQuestion={handleAddQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onUpdateQuestion={updateQuestion}
          onUpdateOption={updateOption}
          onDistributePointsEvenly={handleDistributePointsEvenly}
          onUploadImage={handleUploadImage}
          uploadingImageKey={uploadingImageKey}
          totalBobot={totalBobot}
          onBack={() => setActiveStep(1)}
          onNext={handleNextFromStep2}
        />
      )}

      {/* ── Step 3: Pengaturan & Terbitkan ── */}
      {activeStep === 3 && (
        <BuilderStepSettings
          hasDurationLimit={hasDurationLimit}
          setHasDurationLimit={setHasDurationLimit}
          durasiMenit={durasiMenit}
          setDurasiMenit={setDurasiMenit}
          acakSoal={acakSoal}
          setAcakSoal={setAcakSoal}
          acakOpsi={acakOpsi}
          setAcakOpsi={setAcakOpsi}
          tampilkanNilai={tampilkanNilai}
          setTampilkanNilai={setTampilkanNilai}
          judul={judul}
          totalQuestions={questions.length}
          totalBobot={totalBobot}
          isSubmitting={isSubmitting}
          isEditing={!!initialData?.id}
          onBack={() => setActiveStep(2)}
          onSubmit={handleFinalSubmit}
        />
      )}
    </div>
  );
}
