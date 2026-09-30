import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BookOpen, Calendar, Clock, School, Users, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function GuruMapelPage() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const guruId = BigInt(session.id);

  // Ambil jadwal mengajar guru ini
  const schedules = await prisma.jadwalPelajaran.findMany({
    where: { guru_id: guruId },
    include: {
      kelas: true,
      mapel: true,
    },
    orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Jadwal Mengajar & Mata Pelajaran Saya</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Daftar rombongan belajar SD dan SMP yang diampu oleh {session.name}
          </p>
        </div>

        <Link href="/guru/tugas/create">
          <Button size="sm" className="h-9 text-xs font-bold gap-1.5 rounded-xl">
            <FileCheck className="h-4 w-4" />
            <span>Buat Tugas Baru</span>
          </Button>
        </Link>
      </div>

      {/* Schedule Table / Grid */}
      {schedules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="text-base font-bold text-foreground">Jadwal Mengajar Belum Ditetapkan</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Administrator belum mendaftarkan jadwal mengajar spesifik untuk akun Anda. Anda tetap dapat membuat tugas untuk kelas Anda.
          </p>
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
                className="rounded-2xl bg-card border border-border p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
              >
                <div className="space-y-2.5">
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

                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {sch.mapel.nama_mapel}
                  </h3>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <School className="h-3.5 w-3.5 text-primary" />
                      <strong className="text-foreground">{sch.kelas.nama_kelas}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{sch.hari}, {sch.jam_mulai} - {sch.jam_selesai} {sch.ruang ? `(${sch.ruang})` : ""}</span>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <Badge variant="sky" size="sm">
                      {meetingsInSchedule.length} Pertemuan
                    </Badge>
                    <Badge variant="pink" size="sm">
                      {tasksInSchedule.length} Tugas
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Link href={`/guru/mapel/${sch.mapel_id}?kelasId=${sch.kelas_id}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full h-8 text-xs font-bold gap-1 rounded-xl">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Kelola Materi</span>
                    </Button>
                  </Link>

                  <Link href={`/guru/tugas/create`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-xl">
                      + Tugas
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
