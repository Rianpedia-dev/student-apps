import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Clock, Edit3, HelpCircle, Award, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
      soal: {
        select: {
          id: true,
          nomor_urut: true,
          tipe_soal: true,
          bobot_poin: true,
        },
        orderBy: { nomor_urut: "asc" },
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
  const backLabel = isFromMapel ? "Kembali ke Mapel & Tugas" : "Kembali ke Daftar Tugas";

  const deadlineFormatted = new Date(tugas.deadline).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <DashboardBreadcrumb backHref={backHref} backLabel={backLabel} />

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" size="sm">{tugas.mapel.nama_mapel}</Badge>
                <Badge variant="outline" size="sm">{tugas.kelas.nama_kelas}</Badge>
              </div>
              <CardTitle className="text-xl sm:text-2xl">{tugas.judul}</CardTitle>
            </div>
            <Link href={`/guru/tugas/${tugasId}/edit`}>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Edit3 className="h-3.5 w-3.5" />
                Edit Soal
              </Button>
            </Link>
          </div>
          {tugas.deskripsi && (
            <CardDescription className="whitespace-pre-line mt-2">
              {tugas.deskripsi}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <HelpCircle className="h-3 w-3" /> Soal
              </span>
              <strong className="text-foreground block">{tugas.soal.length} Butir</strong>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Durasi
              </span>
              <strong className="text-foreground block">
                {tugas.durasi_menit ? `${tugas.durasi_menit} Menit` : "Tanpa Batas"}
              </strong>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" /> Skor Maks
              </span>
              <strong className="text-foreground block">{tugas.poin_maksimal} Poin</strong>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" /> Deadline
              </span>
              <strong className="text-foreground block truncate">{deadlineFormatted}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions */}
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
