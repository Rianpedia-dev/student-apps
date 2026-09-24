import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { 
  FileCheck, 
  Clock, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SiswaTugasListPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const studentClass = session.kelas || "";
  const kelas = await prisma.kelas.findFirst({
    where: { nama_kelas: studentClass },
  });

  const tasks = kelas
    ? await prisma.tugas.findMany({
        where: { kelas_id: kelas.id },
        include: {
          mapel: true,
          guru: { select: { name: true } },
          submissions: {
            where: { siswa_id: BigInt(session.id) },
          },
        },
        orderBy: { deadline: "asc" },
      })
    : [];

  const pendingTasks = tasks.filter((t) => t.submissions.length === 0);
  const waitingGrade = tasks.filter((t) => t.submissions.length > 0 && t.submissions[0].status === "menunggu_penilaian");
  const gradedTasks = tasks.filter((t) => t.submissions.length > 0 && t.submissions[0].status === "sudah_dinilai");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileCheck className="h-6 w-6" />
            </span>
            <span>Tugas & Aktivitas Belajar Siswa</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kumpulkan tugas dalam format PDF atau foto PNG/JPG. Guru akan mengoreksi langsung di sistem.
          </p>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-lg">
            {pendingTasks.length}
          </div>
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Perlu Dikerjakan</p>
            <p className="text-[11px] text-muted-foreground">Tugas belum dikumpulkan</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-500 text-white font-bold flex items-center justify-center text-lg">
            {waitingGrade.length}
          </div>
          <div>
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Menunggu Dinilai</p>
            <p className="text-[11px] text-muted-foreground">Sedang diperiksa guru</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-lg">
            {gradedTasks.length}
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Selesai & Dinilai</p>
            <p className="text-[11px] text-muted-foreground">Nilai & catatan sudah rilis</p>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">Semua Tugas Sudah Selesai!</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Tidak ada tugas yang menunggu untuk dikumpulkan saat ini. Istirahat yang cukup atau baca materi selanjutnya ya!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const sub = task.submissions[0];
              const isSubmitted = !!sub;
              const isGraded = sub?.status === "sudah_dinilai";
              const isPending = sub?.status === "menunggu_penilaian";
              const isLate = !isSubmitted && new Date() > new Date(task.deadline);

              return (
                <div
                  key={task.id.toString()}
                  className="rounded-2xl bg-card border border-border p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Mapel Badge + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary uppercase">
                        {task.mapel.nama_mapel}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isGraded
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : isPending
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : isLate
                          ? "bg-red-500/10 text-red-600 border-red-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}>
                        {isGraded
                          ? `⭐ Nilai: ${sub.nilai}/100`
                          : isPending
                          ? "Menunggu Dinilai ⏳"
                          : isLate
                          ? "Tenggat Terlewat ⚠️"
                          : "Belum Dikerjakan 📝"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {task.judul}
                    </h3>

                    <div
                      className="text-xs text-muted-foreground line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: task.deskripsi }}
                    />
                  </div>

                  {/* Footer Meta & Button */}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3 text-primary" />
                        <span>Tenggat: {new Date(task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Oleh: {task.guru.name}
                      </p>
                    </div>

                    <Link href={`/siswa/tugas/${task.id}`}>
                      <Button
                        size="sm"
                        variant={isGraded ? "outline" : "default"}
                        className="h-8 text-xs font-bold rounded-xl gap-1"
                      >
                        {isGraded ? "Buka Hasil Nilai" : isPending ? "Status Tugas" : "Kumpulkan ➔"}
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
