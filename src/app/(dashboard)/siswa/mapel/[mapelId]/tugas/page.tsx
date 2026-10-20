import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, BookOpen, MessageSquare, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  StudentSubjectTasksView,
  StudentTaskItem,
} from "@/components/features/subjects/student-subject-tasks-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ mapelId: string }>;
}

export default async function SiswaMapelTugasPage({ params }: PageProps) {
  const { mapelId } = await params;
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const isNum = /^\d+$/.test(mapelId);
  if (!isNum) notFound();

  const mapel = await prisma.mataPelajaran.findUnique({
    where: { id: BigInt(mapelId) },
  });

  if (!mapel) notFound();

  const studentClass = session.kelas || "";
  const kelas = await prisma.kelas.findFirst({
    where: { nama_kelas: studentClass },
  });

  const siswaId = BigInt(session.id);

  // Jadwal & Guru Pengampu untuk kelas siswa
  const jadwal = kelas
    ? await prisma.jadwalPelajaran.findFirst({
        where: { kelas_id: kelas.id, mapel_id: mapel.id },
        include: {
          guru: {
            select: {
              id: true,
              name: true,
              image: true,
              gender: true,
              email: true,
              guru_bidang: true,
            },
          },
        },
      })
    : null;

  const fallbackGuru = !jadwal?.guru
    ? (
        await prisma.jadwalPelajaran.findFirst({
          where: { mapel_id: mapel.id },
          include: {
            guru: {
              select: {
                id: true,
                name: true,
                image: true,
                gender: true,
                email: true,
                guru_bidang: true,
              },
            },
          },
        })
      )?.guru
    : null;

  const targetGuru = jadwal?.guru || fallbackGuru;
  const targetGuruId = targetGuru?.id ? targetGuru.id.toString() : null;
  const chatHref = targetGuruId ? `/siswa/chat?guruId=${targetGuruId}` : "/siswa/chat";

  // Ambil semua tugas aktif untuk mata pelajaran ini di kelas siswa
  const allTasksData = kelas
    ? await prisma.tugas.findMany({
        where: {
          kelas_id: kelas.id,
          mapel_id: mapel.id,
          NOT: { status: "draft" },
        },
        include: {
          pertemuan: {
            select: {
              id: true,
              pertemuan_ke: true,
              judul: true,
            },
          },
          soal: {
            select: { id: true },
          },
          submissions: {
            where: { siswa_id: siswaId },
          },
        },
        orderBy: { deadline: "asc" },
      })
    : [];

  const formattedTasks: StudentTaskItem[] = allTasksData.map((t) => {
    const sub = t.submissions?.[0];
    const isLate = new Date() > new Date(t.deadline);
    return {
      id: t.id.toString(),
      judul: t.judul,
      deskripsi: t.deskripsi,
      deadline: t.deadline.toISOString(),
      poinMaksimal: t.poin_maksimal,
      tipePengerjaan: t.tipe_pengerjaan,
      pertemuanKe: t.pertemuan?.pertemuan_ke ?? null,
      totalSoal: t.soal ? t.soal.length : 0,
      durasiMenit: t.durasi_menit ?? null,
      isGraded: sub?.status === "sudah_dinilai",
      isPending: sub?.status === "menunggu_penilaian" || sub?.status === "terlambat",
      submissionStatus: sub?.status || (isLate ? "terlambat" : "belum_mengumpulkan"),
      nilai: sub?.nilai ?? null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Tombol Navigasi Kembali */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/siswa/mapel"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all group bg-muted/40 hover:bg-muted px-3 py-1.5 rounded-xl border border-border/60"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Daftar Mata Pelajaran</span>
        </Link>

        {/* Tombol shortcut ke Halaman Materi */}
        <Link href={`/siswa/mapel/${mapel.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-8.5 text-xs font-bold gap-2 rounded-xl border-border/80 hover:border-primary/50"
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Buka Modul & Materi Pembelajaran</span>
          </Button>
        </Link>
      </div>

      {/* Hero Banner Khusus Daftar Tugas */}
      <div className="rounded-2xl sm:rounded-3xl bg-card/90 backdrop-blur-xs border border-border p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          {/* Info Mapel & Tugas */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="amber" size="sm" className="font-bold gap-1">
                <ListTodo className="h-3 w-3" />
                <span>Halaman Tugas</span>
              </Badge>
              <Badge
                variant={(mapel.warna as any) || "emerald"}
                size="sm"
                className="font-mono font-bold uppercase"
              >
                {mapel.kode_mapel}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Tugas & Latihan: {mapel.nama_mapel}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Daftar penugasan, lembar kerja siswa, dan kuis interaktif untuk kelas {studentClass || "Anda"}.
            </p>
          </div>

          {/* Teacher Card & Quick Chat Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-2xl bg-muted/40 border border-border/70 shrink-0">
            <div className="flex items-center gap-3">
              <UserAvatar
                src={targetGuru?.image}
                gender={targetGuru?.gender}
                name={targetGuru?.name || "Guru Pengampu"}
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-cover ring-1 ring-border shrink-0 shadow-2xs border border-border/60"
                previewable={true}
              />
              <div className="min-w-0 pr-1">
                <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[190px]">
                  {targetGuru?.name || "Guru Pengampu"}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground truncate">
                  {targetGuru?.guru_bidang || mapel.nama_mapel || "Guru Pengampu"}
                </p>
              </div>
            </div>

            <div className="sm:border-l sm:border-border/70 sm:pl-3">
              <Link href={chatHref} className="block w-full sm:w-auto">
                <Button
                  size="sm"
                  className="w-full sm:w-auto h-9 px-4 text-xs font-semibold gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Tanya Guru</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Konten Daftar Tugas Mandiri */}
      <StudentSubjectTasksView
        mapel={{
          id: mapel.id.toString(),
          kodeMapel: mapel.kode_mapel,
          namaMapel: mapel.nama_mapel,
          warna: mapel.warna,
        }}
        studentClass={studentClass}
        tasks={formattedTasks}
      />
    </div>
  );
}
