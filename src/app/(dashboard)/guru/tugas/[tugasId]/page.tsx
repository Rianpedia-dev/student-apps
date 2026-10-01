import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Clock, FileCheck, FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeacherSubmissionsView, StudentSubmissionItem } from "@/components/features/assignment/teacher-submissions-view";
import { DashboardBreadcrumb } from "@/components/shared/dashboard-breadcrumb";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tugasId: string }>;
  searchParams: Promise<{
    from?: string;
    mapelId?: string;
    kelasId?: string;
  }>;
}

export default async function GuruTugasSubmissionsPage({ params, searchParams }: PageProps) {
  const { tugasId } = await params;
  const { from } = await searchParams;
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
      pertemuan: {
        select: {
          id: true,
          pertemuan_ke: true,
          judul: true,
        },
      },
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

  // Ambil semua siswa di kelas tugas
  const allStudentsInClass = await prisma.user.findMany({
    where: {
      kelas: tugas.kelas.nama_kelas,
      status: "1",
    },
    select: { id: true, name: true, nis: true, image: true, gender: true },
    orderBy: { name: "asc" },
  });

  const submissionMap = new Map(
    tugas.submissions.map((s) => [s.siswa_id.toString(), s])
  );

  const studentsData: StudentSubmissionItem[] = allStudentsInClass.map((student) => {
    const sId = student.id.toString();
    const sub = submissionMap.get(sId);

    if (sub) {
      return {
        siswaId: sId,
        siswaName: student.name,
        siswaNis: student.nis,
        siswaImage: student.image,
        siswaGender: student.gender,
        submissionId: sub.id.toString(),
        submittedAt: sub.submitted_at.toISOString(),
        fileUrl: sub.file_url,
        fileName: sub.file_name,
        fileType: sub.file_type,
        catatanSiswa: sub.catatan_siswa,
        status: sub.status,
        nilai: sub.nilai,
        catatanGuru: sub.catatan_guru,
        annotatedFileUrl: sub.annotated_file_url,
      };
    }

    return {
      siswaId: sId,
      siswaName: student.name,
      siswaNis: student.nis,
      siswaImage: student.image,
      siswaGender: student.gender,
      submissionId: null,
      submittedAt: null,
      fileUrl: null,
      fileName: null,
      fileType: null,
      catatanSiswa: null,
      status: "belum_mengumpulkan",
      nilai: null,
      catatanGuru: null,
      annotatedFileUrl: null,
    };
  });

  const isFromMapel = from === "mapel";
  const backHref = isFromMapel
    ? "/guru/mapel"
    : `/guru/tugas?mapelId=${tugas.mapel_id}&kelasId=${tugas.kelas_id}`;
  const backLabel = isFromMapel ? "Kembali ke Jadwal & Mapel" : "Kembali ke Daftar Tugas";

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Back Navigation */}
      <DashboardBreadcrumb
        backHref={backHref}
        backLabel={backLabel}
      />

      {/* Header Info Banner */}
      <div className="bg-card/70 backdrop-blur-xs border border-border rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                {tugas.mapel.nama_mapel}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-muted text-foreground border border-border">
                {tugas.kelas.nama_kelas}
              </span>
              {tugas.pertemuan && (
                <Badge variant="sky" size="xs">
                  Pertemuan {tugas.pertemuan.pertemuan_ke}: {tugas.pertemuan.judul}
                </Badge>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {tugas.judul}
            </h1>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50 shrink-0">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              Tenggat:{" "}
              <strong className="text-foreground">
                {new Date(tugas.deadline).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </span>
          </div>
        </div>

        {/* Deskripsi / Instruksi Tugas */}
        {tugas.deskripsi && (
          <div className="text-xs sm:text-sm text-muted-foreground bg-muted/20 p-3.5 rounded-xl border border-border/40 whitespace-pre-line leading-relaxed">
            {tugas.deskripsi}
          </div>
        )}

        {/* Lampiran File Petunjuk Guru (jika ada) */}
        {tugas.file_petunjuk && (
          <div className="flex items-center gap-2 pt-1">
            <a
              href={tugas.file_petunjuk}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Unduh File Petunjuk / Lembar Kerja</span>
              <Download className="h-3 w-3 ml-0.5" />
            </a>
          </div>
        )}
      </div>

      {/* Daftar Pengumpulan Siswa & Modal Koreksi Langsung */}
      <TeacherSubmissionsView
        tugasId={tugas.id.toString()}
        tugasJudul={tugas.judul}
        poinMaksimal={tugas.poin_maksimal}
        students={studentsData}
        fromOrigin={from}
      />
    </div>
  );
}
