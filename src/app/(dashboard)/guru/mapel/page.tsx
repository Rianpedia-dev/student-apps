import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Calendar, Clock, School, ListTodo, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compareScheduleTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GuruMapelPage() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const guruId = BigInt(session.id);

  // Ambil jadwal mengajar guru ini
  const rawSchedules = await prisma.jadwalPelajaran.findMany({
    where: { guru_id: guruId },
    include: {
      kelas: true,
      mapel: true,
    },
  });

  const schedules = [...rawSchedules].sort((a, b) => {
    const comp = compareScheduleTime(
      a.hari,
      a.jam_mulai,
      a.jam_selesai,
      b.hari,
      b.jam_mulai,
      b.jam_selesai
    );
    if (comp !== 0) return comp;
    return (a.kelas?.nama_kelas || "").localeCompare(b.kelas?.nama_kelas || "");
  });

  // Ambil tugas yang pernah dibuat untuk mapel-mapel ini
  const tasks = await prisma.tugas.findMany({
    where: { guru_id: guruId },
    include: {
      kelas: true,
      mapel: true,
      submissions: true,
    },
  });

  // Ambil data pertemuan yang telah dibuat
  const meetings = (prisma as any).pertemuan?.findMany
    ? await (prisma as any).pertemuan.findMany({
        where: session.role === "admin" ? {} : { guru_id: guruId },
        select: {
          id: true,
          kelas_id: true,
          mapel_id: true,
          is_published: true,
        },
      })
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-card/60 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <span>Jadwal Mengajar & Mata Pelajaran Saya</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Lihat jadwal mengajar mingguan dan kelola modul materi pembelajaran serta tugas siswa untuk setiap rombongan belajar.
        </p>
      </div>

      {/* Schedule Table / Grid */}
      {schedules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="text-base font-bold text-foreground">Jadwal Mengajar Belum Ditetapkan</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Administrator belum mendaftarkan jadwal mengajar spesifik untuk akun Anda. Anda tetap dapat mengelola tugas dari halaman tugas.
          </p>
          <div className="mt-4">
            <Link href="/guru/tugas">
              <Button size="sm" variant="outline" className="text-xs rounded-xl">
                Buka Halaman Tugas
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((sch) => {
            const tasksInSchedule = tasks.filter(
              (t) => t.kelas_id === sch.kelas_id && t.mapel_id === sch.mapel_id
            );
            const meetingsInSchedule = meetings.filter(
              (m: any) => m.kelas_id === sch.kelas_id && m.mapel_id === sch.mapel_id
            );

            return (
              <div
                key={sch.id.toString()}
                className="rounded-2xl bg-card border border-border/80 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={(sch.mapel.warna as any) || "emerald"}
                      size="sm"
                      className="font-bold font-mono uppercase"
                    >
                      {sch.mapel.kode_mapel}
                    </Badge>
                    <Badge
                      variant={sch.kelas.jenjang === "SMP" ? "indigo" : "amber"}
                      size="sm"
                    >
                      Jenjang {sch.kelas.jenjang}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {sch.mapel.nama_mapel}
                    </h3>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2">
                      <School className="h-3.5 w-3.5 text-primary shrink-0" />
                      <strong className="text-foreground">{sch.kelas.nama_kelas}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{sch.hari}, {sch.jam_mulai} - {sch.jam_selesai} {sch.ruang ? `(${sch.ruang})` : ""}</span>
                    </div>
                  </div>

                  {/* Summary badges with active links */}
                  <div className="flex items-center gap-2 pt-0.5 text-xs">
                    <Link
                      href={`/guru/mapel/${sch.mapel_id}?kelasId=${sch.kelas_id}`}
                      className="hover:opacity-85 transition-opacity"
                      title="Klik untuk membuka dan menginput materi KBM rombel ini"
                    >
                      <Badge variant="sky" size="sm" className="cursor-pointer">
                        {meetingsInSchedule.length} Pertemuan / Materi
                      </Badge>
                    </Link>

                    <Link
                      href={`/guru/tugas?mapelId=${sch.mapel_id}&kelasId=${sch.kelas_id}`}
                      title="Klik untuk melihat tugas rombel ini"
                      className="hover:opacity-85 transition-opacity"
                    >
                      <Badge variant="pink" size="sm" className="cursor-pointer hover:underline">
                        {tasksInSchedule.length} Tugas Kelas
                      </Badge>
                    </Link>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-2.5">
                  <Link href={`/guru/mapel/${sch.mapel_id}?kelasId=${sch.kelas_id}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full h-8 text-xs font-bold gap-1.5 rounded-xl">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Input Materi</span>
                    </Button>
                  </Link>

                  <Link href={`/guru/tugas?mapelId=${sch.mapel_id}&kelasId=${sch.kelas_id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-xl hover:border-primary/40 gap-1.5">
                      <ListTodo className="h-3.5 w-3.5 text-primary" />
                      <span>Tugas</span>
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
