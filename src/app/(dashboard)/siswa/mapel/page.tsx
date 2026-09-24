import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SubjectCard } from "@/components/subjects/subject-card";
import { BookOpen, Calendar, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SiswaMataPelajaranPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const studentClass = session.kelas || "";
  const kelas = await prisma.kelas.findFirst({
    where: { nama_kelas: studentClass },
  });

  const jadwalList = kelas
    ? await prisma.jadwalPelajaran.findMany({
        where: { kelas_id: kelas.id },
        include: {
          mapel: true,
          guru: { select: { id: true, name: true, image: true, email: true, guru_bidang: true } },
        },
        orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
      })
    : [];

  const allMapel = await prisma.mataPelajaran.findMany({
    where: {
      OR: [
        { jenjang: kelas?.jenjang || "SD" },
        { jenjang: "SEMUA" },
      ],
    },
    orderBy: { nama_mapel: "asc" },
  });

  const activeTasks = kelas
    ? await prisma.tugas.findMany({
        where: { kelas_id: kelas.id, status: "aktif" },
        include: {
          submissions: {
            where: { siswa_id: BigInt(session.id) },
          },
        },
      })
    : [];

  // Group jadwal by day
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const jadwalByDay = days.map((day) => ({
    day,
    schedules: jadwalList.filter((j) => j.hari.toLowerCase() === day.toLowerCase()),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="h-6 w-6" />
            </span>
            <span>Mata Pelajaran & Jadwal Belajar</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Daftar mata pelajaran resmi {kelas?.jenjang || "SD"} untuk {studentClass || "Rombel Siswa"}
          </p>
        </div>
      </div>

      {/* Grid Mata Pelajaran */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Daftar Mata Pelajaran
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allMapel.map((mapel) => {
            const jadwalMapel = jadwalList.find((j) => j.mapel_id === mapel.id);
            const tasks = activeTasks.filter((t) => t.mapel_id === mapel.id);
            const unsubmitted = tasks.filter((t) => t.submissions.length === 0).length;

            return (
              <SubjectCard
                key={mapel.id.toString()}
                id={mapel.id.toString()}
                kodeMapel={mapel.kode_mapel}
                namaMapel={mapel.nama_mapel}
                jenjang={mapel.jenjang}
                icon={mapel.icon}
                warna={mapel.warna}
                guruNama={jadwalMapel?.guru.name || "Guru Pengampu"}
                jadwalHari={jadwalMapel?.hari}
                jadwalWaktu={jadwalMapel ? `${jadwalMapel.jam_mulai} - ${jadwalMapel.jam_selesai}` : undefined}
                ruang={jadwalMapel?.ruang}
                activeTasksCount={unsubmitted}
                detailUrl={`/siswa/mapel/${mapel.id}`}
              />
            );
          })}
        </div>
      </div>

      {/* Weekly Schedule Table */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Jadwal Mingguan ({studentClass})</span>
          </h2>
          <Badge variant="outline" className="text-xs">
            {jadwalList.length} Sesi Pertemuan
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {jadwalByDay.map(({ day, schedules }) => (
            <div key={day} className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b border-border/60">
                {day}
              </h3>
              {schedules.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic py-4 text-center">
                  Tidak ada jadwal
                </p>
              ) : (
                schedules.map((sch) => (
                  <div
                    key={sch.id.toString()}
                    className="p-2.5 rounded-lg bg-card border border-border shadow-2xs space-y-1 hover:border-primary/50 transition-colors"
                  >
                    <p className="text-xs font-bold text-foreground truncate">{sch.mapel.nama_mapel}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{sch.jam_mulai} - {sch.jam_selesai}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{sch.guru.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
