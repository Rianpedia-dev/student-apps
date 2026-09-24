"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTugasAction } from "@/actions/assignment";
import { toast } from "sonner";
import { 
  FileCheck, 
  UploadCloud, 
  Calendar, 
  BookOpen, 
  School, 
  Clock, 
  Sparkles, 
  Loader2,
  FileText
} from "lucide-react";

interface CreateTaskFormProps {
  classes: Array<{ id: string; nama: string; jenjang: string; tingkat?: number | null }>;
  subjects: Array<{ id: string; kode: string; nama: string; jenjang: string }>;
  defaultKelas?: string;
}

export function CreateTaskForm({ classes, subjects, defaultKelas }: CreateTaskFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const matchedClass = classes.find((c) => c.nama === defaultKelas);
  const [kelasId, setKelasId] = useState(matchedClass ? matchedClass.id : classes[0]?.id || "");
  const [mapelId, setMapelId] = useState(subjects[0]?.id || "");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [poinMaksimal, setPoinMaksimal] = useState("100");

  // Default deadline 3 days from now at 23:59
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);
  defaultDate.setHours(23, 59, 0, 0);
  const defaultDeadline = defaultDate.toISOString().slice(0, 16);
  const [deadline, setDeadline] = useState(defaultDeadline);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim() || !kelasId || !mapelId || !deadline) {
      toast.error("Harap lengkapi semua kolom bertanda wajib.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("judul", judul);
    formData.append("deskripsi", deskripsi);
    formData.append("kelas_id", kelasId);
    formData.append("mapel_id", mapelId);
    formData.append("deadline", deadline);
    formData.append("poin_maksimal", poinMaksimal);
    if (selectedFile) {
      formData.append("file_petunjuk", selectedFile);
    }

    try {
      const res = await createTugasAction(formData);
      if (res.success) {
        toast.success(res.message);
        router.push("/guru/tugas");
      } else {
        toast.error(res.error || "Gagal membuat tugas.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sdClasses = classes.filter((c) => c.jenjang === "SD");
  const smpClasses = classes.filter((c) => c.jenjang === "SMP");

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
      {/* Target Class and Subject Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
            <School className="h-4 w-4 text-primary" />
            <span>Target Kelas (SD / SMP) *</span>
          </label>
          <select
            value={kelasId}
            onChange={(e) => setKelasId(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-input bg-background px-3 py-2.5 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            required
          >
            <optgroup label="── Sekolah Dasar (SD) ──">
              {sdClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </optgroup>
            <optgroup label="── Sekolah Menengah Pertama (SMP) ──">
              {smpClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Mata Pelajaran *</span>
          </label>
          <select
            value={mapelId}
            onChange={(e) => setMapelId(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-input bg-background px-3 py-2.5 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            required
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.kode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Title */}
      <div>
        <label className="text-xs font-bold text-foreground block mb-1.5">
          Judul Tugas / Aktivitas *
        </label>
        <input
          type="text"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Contoh: Latihan Soal Persamaan Linear & Operasi Aljabar"
          className="w-full text-xs sm:text-sm font-semibold rounded-xl border border-input bg-background px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
          required
        />
      </div>

      {/* Deadline and Max Points */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <span>Tenggat Waktu Pengumpulan (Deadline) *</span>
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-input bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Poin Maksimal</span>
          </label>
          <input
            type="number"
            min="10"
            max="100"
            value={poinMaksimal}
            onChange={(e) => setPoinMaksimal(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-input bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            required
          />
        </div>
      </div>

      {/* Description / Instructions */}
      <div>
        <label className="text-xs font-bold text-foreground block mb-1.5">
          Petunjuk & Instruksi Pengerjaan *
        </label>
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          rows={5}
          placeholder="Tuliskan nomor soal, tata cara pengerjaan di buku tulis / iPad, dan instruksi pengunggahan file tugas dalam format PDF atau foto yang jernih..."
          className="w-full text-xs sm:text-sm rounded-xl border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 leading-relaxed"
          required
        />
      </div>

      {/* Optional Attachment for Instructions */}
      <div>
        <label className="text-xs font-bold text-muted-foreground block mb-1.5">
          Lampirkan Lembar Soal / PDF Panduan (Opsional):
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="petunjuk-file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("petunjuk-file")?.click()}
            className="text-xs rounded-xl gap-2 h-9"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Pilih Dokumen Panduan</span>
          </Button>
          {selectedFile && (
            <span className="text-xs text-primary font-semibold flex items-center gap-1 truncate max-w-xs">
              <FileText className="h-4 w-4" />
              {selectedFile.name}
            </span>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-xs rounded-xl"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 text-xs font-bold rounded-xl gap-2 px-6 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menerbitkan Tugas...
            </>
          ) : (
            <>
              <FileCheck className="h-4 w-4" />
              Terbitkan Tugas ke Siswa
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
