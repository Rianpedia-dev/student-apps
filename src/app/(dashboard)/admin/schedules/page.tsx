import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Calendar, Plus, Clock, School, User, BookOpen } from "lucide-react";
import { SchedulesManager } from "./schedules-manager";

export const dynamic = "force-dynamic";

export default async function AdminSchedulesPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const [classes, subjects, teachers, schedules] = await Promise.all([
    prisma.kelas.findMany({
      orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
    }),
    prisma.mataPelajaran.findMany({
      orderBy: { nama_mapel: "asc" },
    }),
    prisma.user.findMany({
      where: { status: { in: ["2", "4"] } },
      select: { id: true, name: true, email: true, guru_bidang: true },
      orderBy: { name: "asc" },
    }),
    prisma.jadwalPelajaran.findMany({
      include: {
        kelas: true,
        mapel: true,
        guru: { select: { id: true, name: true } },
      },
      orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
    }),
  ]);

  const formattedSchedules = schedules.map((s) => ({
    id: s.id.toString(),
    kelasId: s.kelas_id.toString(),
    kelasNama: s.kelas.nama_kelas,
    jenjang: s.kelas.jenjang,
    mapelId: s.mapel_id.toString(),
    mapelNama: s.mapel.nama_mapel,
    mapelKode: s.mapel.kode_mapel,
    guruId: s.guru_id.toString(),
    guruNama: s.guru.name,
    hari: s.hari,
    jamMulai: s.jam_mulai,
    jamSelesai: s.jam_selesai,
    ruang: s.ruang || "-",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-6 w-6" />
            </span>
            <span>Jadwal Pelajaran Kelas SD & SMP</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Atur alokasi mata pelajaran, guru pengampu, hari, dan jam tatap muka untuk setiap kelas.
          </p>
        </div>
      </div>

      <SchedulesManager
        initialSchedules={formattedSchedules}
        classes={classes.map((c) => ({ id: c.id.toString(), nama: c.nama_kelas, jenjang: c.jenjang }))}
        subjects={subjects.map((s) => ({ id: s.id.toString(), nama: s.nama_mapel, kode: s.kode_mapel }))}
        teachers={teachers.map((t) => ({ id: t.id.toString(), nama: t.name, bidang: t.guru_bidang }))}
      />
    </div>
  );
}
