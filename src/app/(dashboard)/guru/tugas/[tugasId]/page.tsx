import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { 
  ArrowLeft, 
  FileCheck, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Award,
  Search,
  BookOpen,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tugasId: string }>;
}

export default async function GuruTugasSubmissionsPage({ params }: PageProps) {
  const { tugasId } = await params;
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const isNum = /^\d+$/.test(tugasId);
  if (!isNum) notFound();

  const tugas = await prisma.tugas.findUnique({
    where: { id: BigInt(tugasId) },
    include: {
      kelas: true,
      mapel: true,
      submissions: {
        include: {
          siswa: {
            select: { id: true, name: true, nis: true, image: true, email: true },
          },
        },
        orderBy: { submitted_at: "desc" },
      },
    },
  });

  if (!tugas) notFound();

  // Ambil seluruh siswa di kelas target untuk melihat siapa yang belum mengumpulkan
  const allStudentsInClass = await prisma.user.findMany({
    where: {
      kelas: tugas.kelas.nama_kelas,
      status: "1",
    },
    select: { id: true, name: true, nis: true, image: true },
    orderBy: { name: "asc" },
  });

  const submittedStudentIds = new Set(tugas.submissions.map((s) => s.siswa_id.toString()));
  const unsubmittedStudents = allStudentsInClass.filter(
    (s) => !submittedStudentIds.has(s.id.toString())
  );

  const gradedCount = tugas.submissions.filter((s) => s.status === "sudah_dinilai").length;
  const waitingCount = tugas.submissions.filter((s) => s.status === "menunggu_penilaian" || s.status === "terlambat").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/guru/tugas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Manajemen Tugas</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                {tugas.mapel.nama_mapel}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {tugas.kelas.nama_kelas}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {tugas.judul}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs py-1">
              Tenggat: {new Date(tugas.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Total Siswa Kelas</p>
          <p className="text-2xl font-bold text-foreground">{allStudentsInClass.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Sudah Mengumpulkan</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tugas.submissions.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Perlu Dikoreksi</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{waitingCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Selesai Dinilai</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{gradedCount}</p>
        </div>
      </div>

      {/* Submissions Table & List */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            <span>Lembar Pengumpulan Tugas Siswa ({tugas.submissions.length})</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            Klik &ldquo;Koreksi In-Browser&rdquo; untuk memeriksa file PDF/foto tanpa download
          </span>
        </div>

        {tugas.submissions.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm font-semibold text-foreground">Belum Ada Siswa yang Mengumpulkan</p>
            <p className="text-xs mt-1">Siswa akan muncul di sini segera setelah mengunggah file tugas mereka.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {tugas.submissions.map((sub) => {
              const isGraded = sub.status === "sudah_dinilai";
              const isLate = sub.status === "terlambat";

              return (
                <div
                  key={sub.id.toString()}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-border">
                      {sub.siswa.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-xs sm:max-w-sm">
                        {sub.siswa.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>NIS: {sub.siswa.nis || "-"}</span>
                        <span>•</span>
                        <span>{sub.file_name}</span>
                        <span>•</span>
                        <span>{new Date(sub.submitted_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* Status / Score */}
                    {isGraded ? (
                      <div className="text-right">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          ⭐ Nilai: {sub.nilai}/100
                        </span>
                      </div>
                    ) : (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        isLate
                          ? "bg-red-500/10 text-red-600 border-red-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse"
                      }`}>
                        {isLate ? "Terlambat" : "Menunggu Dinilai"}
                      </span>
                    )}

                    {/* In-Browser Grader Button */}
                    <Link href={`/guru/tugas/${tugas.id}/review/${sub.id}`}>
                      <Button
                        size="sm"
                        variant={isGraded ? "outline" : "default"}
                        className="h-8 text-xs font-bold rounded-xl gap-1.5 shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{isGraded ? "Ubah Nilai / Cek" : "Koreksi In-Browser ➔"}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unsubmitted Students List */}
      {unsubmittedStudents.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span>Siswa Belum Mengumpulkan ({unsubmittedStudents.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {unsubmittedStudents.map((s) => (
              <span
                key={s.id.toString()}
                className="text-xs px-3 py-1 rounded-xl bg-muted/60 border border-border text-foreground/80"
              >
                {s.name} ({s.nis || "-"})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
