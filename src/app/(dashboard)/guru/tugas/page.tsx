import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { 
  FileCheck, 
  Plus, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  BookOpen,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function GuruTugasListPage() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const guruId = BigInt(session.id);

  const tasks = await prisma.tugas.findMany({
    where: {
      OR: [
        { guru_id: guruId },
        ...(session.kelas ? [{ kelas: { nama_kelas: session.kelas } }] : []),
      ],
    },
    include: {
      kelas: true,
      mapel: true,
      submissions: {
        include: {
          siswa: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header with Create Task Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileCheck className="h-6 w-6" />
            </span>
            <span>Manajemen Tugas & Koreksi In-Browser</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Buat penugasan untuk kelas SD maupun SMP, dan periksa lembar tugas siswa (PDF/Foto) langsung tanpa download.
          </p>
        </div>

        <Link href="/guru/tugas/create">
          <Button className="h-10 text-xs font-bold gap-2 rounded-xl shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Buat Tugas Baru</span>
          </Button>
        </Link>
      </div>

      {/* Task Cards Grid */}
      {tasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
          <FileCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="text-base font-bold text-foreground">Belum Ada Tugas yang Dibuat</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
            Mulai buat penugasan pertama untuk siswa kelas Anda. Siswa dapat mengunggah file PDF atau foto yang dapat dikoreksi langsung di browser.
          </p>
          <Link href="/guru/tugas/create">
            <Button size="sm" className="text-xs font-bold gap-1.5 rounded-xl">
              <Plus className="h-4 w-4" />
              <span>Buat Tugas Pertama</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const totalSubmissions = task.submissions.length;
            const waitingCount = task.submissions.filter((s) => s.status === "menunggu_penilaian" || s.status === "terlambat").length;
            const gradedCount = task.submissions.filter((s) => s.status === "sudah_dinilai").length;

            return (
              <div
                key={task.id.toString()}
                className="rounded-2xl bg-card border border-border p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[11px] font-bold uppercase text-primary border-primary/30">
                        {task.mapel.nama_mapel}
                      </Badge>
                      <Badge variant="secondary" className="text-[11px]">
                        {task.kelas.nama_kelas}
                      </Badge>
                    </div>

                    {waitingCount > 0 ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                        {waitingCount} Perlu Dinilai
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Semua Dinilai ✓
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {task.judul}
                  </h3>

                  <div
                    className="text-xs text-muted-foreground line-clamp-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: task.deskripsi }}
                  />
                </div>

                {/* Submissions KPI & Action */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <strong>{totalSubmissions}</strong> Dikumpul
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      Tenggat: {new Date(task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  <Link href={`/guru/tugas/${task.id}`}>
                    <Button size="sm" className="h-8 text-xs font-bold rounded-xl gap-1">
                      <span>Periksa Tugas</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
