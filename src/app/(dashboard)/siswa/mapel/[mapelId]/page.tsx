import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { 
  ArrowLeft, 
  BookOpen, 
  User, 
  Clock, 
  Calendar, 
  MessageSquare, 
  FileCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  // Find schedule and teacher for this class
  const jadwal = kelas
    ? await prisma.jadwalPelajaran.findFirst({
        where: { kelas_id: kelas.id, mapel_id: mapel.id },
        include: {
          guru: { select: { id: true, name: true, image: true, email: true, guru_bidang: true } },
        },
      })
    : null;

  // Find tasks for this class and subject
  const tasks = kelas
    ? await prisma.tugas.findMany({
        where: { kelas_id: kelas.id, mapel_id: mapel.id },
        include: {
          submissions: {
            where: { siswa_id: BigInt(session.id) },
          },
        },
        orderBy: { deadline: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/siswa/mapel"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Mata Pelajaran</span>
        </Link>
      </div>

      {/* Hero Banner Mata Pelajaran */}
      <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                {mapel.kode_mapel}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {studentClass || "Semua Rombel"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {mapel.nama_mapel}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {mapel.deskripsi || "Silabus pembelajaran kurikulum Al-Azhar Cairo terpadu dengan integrasi adab dan nilai keislaman."}
            </p>
          </div>

          {/* Teacher Card & Direct Chat Button */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border shrink-0 sm:min-w-[280px] space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm ring-1 ring-border">
                {jadwal?.guru.name ? jadwal.guru.name.substring(0, 2).toUpperCase() : <User className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground truncate">{jadwal?.guru.name || "Ustadzah Fatimah, S.Pd"}</p>
                <p className="text-[11px] text-muted-foreground">Guru Pengampu</p>
              </div>
            </div>

            {jadwal && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/60">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{jadwal.hari}, {jadwal.jam_mulai} - {jadwal.jam_selesai} {jadwal.ruang ? `(${jadwal.ruang})` : ""}</span>
              </div>
            )}

            <Link href="/siswa/chat" className="block w-full">
              <Button size="sm" className="w-full h-9 text-xs font-bold gap-2 rounded-xl">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Tanya Ustadz / Chat Guru</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tasks Section for this Subject */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            <span>Tugas & Aktivitas Belajar ({tasks.length})</span>
          </h2>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-card border border-border text-muted-foreground">
            <FileCheck className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm font-semibold text-foreground">Alhamdulillah, Belum Ada Tugas</p>
            <p className="text-xs mt-1">Belum ada tugas aktif untuk mata pelajaran ini saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const sub = task.submissions[0];
              const isSubmitted = !!sub;
              const isGraded = sub?.status === "sudah_dinilai";
              const isPending = sub?.status === "menunggu_penilaian" || sub?.status === "terlambat";

              return (
                <div
                  key={task.id.toString()}
                  className="rounded-xl bg-card border border-border p-5 flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        isGraded
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : isPending
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}>
                        {isGraded
                          ? `Nilai: ${sub.nilai} / ${task.poin_maksimal || 100}`
                          : isPending
                          ? "Menunggu Nilai"
                          : "Belum Dikerjakan"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3" />
                        <span>Tenggat: {new Date(task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                      {task.judul}
                    </h3>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Maks. {task.poin_maksimal} Poin
                    </span>

                    <Link href={`/siswa/tugas/${task.id}`}>
                      <Button size="sm" variant={isGraded ? "outline" : "default"} className="h-8 text-xs font-semibold rounded-lg">
                        {isGraded ? "Lihat Nilai" : isPending ? "Lihat Tugas" : "Kerjakan"}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
