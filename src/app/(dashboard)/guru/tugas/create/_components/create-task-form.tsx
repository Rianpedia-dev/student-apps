"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTugasAction } from "@/actions/assignment";
import { toast } from "sonner";
import { 
  UploadCloud, 
  Loader2,
  FileText,
  X
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

  // Default deadline: 3 hari ke depan pukul 23:59
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);
  defaultDate.setHours(23, 59, 0, 0);
  const defaultDeadline = defaultDate.toISOString().slice(0, 16);
  const [deadline, setDeadline] = useState(defaultDeadline);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim() || !kelasId || !mapelId || !deadline) {
      toast.error("Harap lengkapi semua kolom yang wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("judul", judul.trim());
    formData.append("deskripsi", deskripsi.trim());
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
    } catch {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sdClasses = classes.filter((c) => c.jenjang === "SD");
  const smpClasses = classes.filter((c) => c.jenjang === "SMP");

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 sm:p-7 shadow-xs space-y-5">
      {/* Target Kelas & Mata Pelajaran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-foreground block mb-1.5">
            Target Kelas *
          </label>
          <select
            value={kelasId}
            onChange={(e) => setKelasId(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-input bg-background px-3 py-2.5 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            required
          >
            {sdClasses.length > 0 && (
              <optgroup label="── Sekolah Dasar (SD) ──">
                {sdClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </optgroup>
            )}
            {smpClasses.length > 0 && (
              <optgroup label="── Sekolah Menengah Pertama (SMP) ──">
                {smpClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-foreground block mb-1.5">
            Mata Pelajaran *
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

      {/* Judul Tugas */}
      <div>
        <label className="text-xs font-bold text-foreground block mb-1.5">
          Judul Tugas *
        </label>
        <input
          type="text"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Contoh: Latihan Operasi Bilangan Pecahan"
          className="w-full text-xs sm:text-sm font-semibold rounded-xl border border-input bg-background px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
          required
        />
      </div>

      {/* Tenggat Waktu & Poin Maksimal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-foreground block mb-1.5">
            Tenggat Waktu (Deadline) *
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
          <label className="text-xs font-bold text-foreground block mb-1.5">
            Poin Maksimal
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

      {/* Petunjuk & Soal */}
      <div>
        <label className="text-xs font-bold text-foreground block mb-1.5">
          Instruksi / Soal Tugas *
        </label>
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          rows={5}
          placeholder="Tuliskan petunjuk pengerjaan tugas, nomor soal pada buku, atau tata cara pengumpulan..."
          className="w-full text-xs sm:text-sm rounded-xl border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 leading-relaxed"
          required
        />
      </div>

      {/* Lampiran File Soal (Opsional) */}
      <div>
        <label className="text-xs font-bold text-muted-foreground block mb-1.5">
          Lampirkan Dokumen Soal (Opsional):
        </label>

        {!selectedFile ? (
          <div className="flex items-center gap-3">
            <input
              type="file"
              id="file-soal"
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
              onClick={() => document.getElementById("file-soal")?.click()}
              className="text-xs rounded-xl gap-2 h-9"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Pilih Dokumen PDF / Foto</span>
            </Button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between max-w-md">
            <div className="flex items-center gap-2 truncate">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground truncate">
                {selectedFile.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tombol Aksi */}
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
          className="h-9 sm:h-10 text-xs font-bold rounded-xl gap-2 px-5 shadow-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Menerbitkan Tugas...</span>
            </>
          ) : (
            <span>Terbitkan Tugas</span>
          )}
        </Button>
      </div>
    </form>
  );
}
