import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, User, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentMeetingView } from "@/components/features/subjects/student-meeting-view";
import { UserAvatar } from "@/components/shared/user-avatar";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ mapelId: string }>;
}

export default async function SiswaMapelDetailPage({ params }: PageProps) {
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
          guru: { select: { id: true, name: true, image: true, gender: true, email: true, guru_bidang: true } },
        },
      })
    : null;

  // Pertemuan yang sudah diterbitkan untuk kelas ini
  const meetingsData =
    kelas && (prisma as any).pertemuan?.findMany
      ? await (prisma as any).pertemuan.findMany({
          where: {
            kelas_id: kelas.id,
            mapel_id: mapel.id,
            is_published: true,
          },
          include: {
            tugas: {
              include: {
                submissions: {
                  where: { siswa_id: siswaId },
                },
              },
            },
            progressSiswa: {
              where: { siswa_id: siswaId },
            },
          },
          orderBy: [{ pertemuan_ke: "asc" }, { tanggal: "asc" }],
        })
      : [];

  // Semua tugas untuk mapel dan kelas ini
  const allTasksData = kelas
    ? await prisma.tugas.findMany({
        where: { kelas_id: kelas.id, mapel_id: mapel.id },
        include: {
          submissions: {
            where: { siswa_id: siswaId },
          },
        },
        orderBy: { deadline: "asc" },
      })
    : [];

  // Format data pertemuan
  const formattedMeetings = meetingsData.map((m: any) => ({
    id: m.id.toString(),
    pertemuanKe: m.pertemuan_ke,
    judul: m.judul,
    deskripsi: m.deskripsi,
    tanggal: m.tanggal ? new Date(m.tanggal).toISOString() : new Date().toISOString(),
    fileUrl: m.file_url,
    fileName: m.file_name,
    fileSize: m.file_size,
    fileType: m.file_type,
    videoUrl: m.video_url,
    linkEksternal: m.link_eksternal,
    isCompleted: m.progressSiswa?.[0]?.is_completed || false,
    tugas: (m.tugas || []).map((t: any) => {
      const sub = t.submissions?.[0];
      return {
        id: t.id.toString(),
        judul: t.judul,
        deskripsi: t.deskripsi,
        deadline: t.deadline ? new Date(t.deadline).toISOString() : new Date().toISOString(),
        poinMaksimal: t.poin_maksimal,
        isGraded: sub?.status === "sudah_dinilai",
        isPending: sub?.status === "menunggu_penilaian" || sub?.status === "terlambat",
        nilai: sub?.nilai ?? null,
      };
    }),
  }));

  // Format semua tugas
  const formattedTasks = allTasksData.map((t) => {
    const sub = t.submissions?.[0];
    return {
      id: t.id.toString(),
      judul: t.judul,
      deskripsi: t.deskripsi,
      deadline: t.deadline.toISOString(),
      poinMaksimal: t.poin_maksimal,
      isGraded: sub?.status === "sudah_dinilai",
      isPending: sub?.status === "menunggu_penilaian" || sub?.status === "terlambat",
      nilai: sub?.nilai ?? null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Tombol Kembali */}
      <div>
        <Link
          href="/siswa/mapel"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all group bg-muted/40 hover:bg-muted px-3 py-1.5 rounded-xl border border-border/60"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Daftar Mata Pelajaran</span>
        </Link>
      </div>

      {/* Hero Banner Mata Pelajaran */}
      <div className="rounded-3xl bg-gradient-to-br from-card via-card/95 to-primary/5 border border-border/80 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black px-3 py-1 rounded-xl bg-primary/15 text-primary border border-primary/25 uppercase tracking-wider">
                {mapel.kode_mapel}
              </span>
              <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-xl border border-border/60">
                {studentClass ? (studentClass.startsWith("Kelas") ? studentClass : `Kelas ${studentClass}`) : "Semua Rombel"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
              {mapel.nama_mapel}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed font-normal">
              {mapel.deskripsi ||
                "Silabus pembelajaran kurikulum Al-Azhar Cairo terpadu dengan integrasi adab dan nilai keislaman."}
            </p>
          </div>

          {/* Teacher Card & Direct Chat Button */}
          <div className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/80 shrink-0 sm:min-w-[280px] space-y-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <UserAvatar
                src={jadwal?.guru?.image}
                gender={jadwal?.guru?.gender}
                name={jadwal?.guru?.name || "Guru Pengampu"}
                className="h-12 w-12 rounded-2xl object-cover ring-2 ring-primary/20 shrink-0 shadow-xs border border-border/60"
                previewable={true}
              />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-foreground truncate">
                  {jadwal?.guru?.name || "Ustadzah Pengampu"}
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground">Guru Pengampu</p>
              </div>
            </div>

            {jadwal && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/60 font-medium">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                  {jadwal.hari}, {jadwal.jam_mulai} - {jadwal.jam_selesai}{" "}
                  {jadwal.ruang ? `(${jadwal.ruang})` : ""}
                </span>
              </div>
            )}

            <Link href="/siswa/chat" className="block w-full">
              <Button size="sm" className="w-full h-9 text-xs font-bold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Tanya Ustadz / Chat Guru</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Komponen Tampilan Materi per Pertemuan & Tugas Siswa */}
      <StudentMeetingView
        mapel={{
          id: mapel.id.toString(),
          kodeMapel: mapel.kode_mapel,
          namaMapel: mapel.nama_mapel,
          deskripsi: mapel.deskripsi,
          warna: mapel.warna,
        }}
        studentClass={studentClass}
        guru={jadwal?.guru ? { name: jadwal.guru.name, image: jadwal.guru.image, gender: jadwal.guru.gender } : null}
        jadwalInfo={jadwal ? `${jadwal.hari}, ${jadwal.jam_mulai} - ${jadwal.jam_selesai}` : null}
        meetings={formattedMeetings}
        allTasks={formattedTasks}
      />
    </div>
  );
}
