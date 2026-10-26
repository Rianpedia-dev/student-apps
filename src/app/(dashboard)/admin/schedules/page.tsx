import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { SchedulesManager } from "./_components/schedules-manager";
import { compareScheduleTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSchedulesPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const activeJenjang = await getActiveJenjang(session);
  const isSuperAdmin = session?.jenjang === "ALL";
  const isRestricted = !isSuperAdmin && activeJenjang !== "ALL";

  const classWhere: any = {};
  if (isRestricted) {
    classWhere.jenjang = activeJenjang;
  }

  const subjectWhere: any = {};
  if (isRestricted) {
    subjectWhere.jenjang = { in: [activeJenjang, "SEMUA"] };
  }

  const teacherWhere: any = { status: { in: ["2", "4"] } };
  if (isRestricted) {
    teacherWhere.OR = [
      { jenjang: activeJenjang },
      { jenjang: "ALL" },
    ];
  }

  const scheduleWhere: any = {};
  if (isRestricted) {
    scheduleWhere.kelas = { jenjang: activeJenjang };
  }

  const [classes, subjects, teachers, schedules] = await Promise.all([
    prisma.kelas.findMany({
      where: classWhere,
      orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
    }),
    prisma.mataPelajaran.findMany({
      where: subjectWhere,
      orderBy: { nama_mapel: "asc" },
    }),
    prisma.user.findMany({
      where: teacherWhere,
      select: { id: true, name: true, email: true, guru_bidang: true },
      orderBy: { name: "asc" },
    }),
    prisma.jadwalPelajaran.findMany({
      where: scheduleWhere,
      include: {
        kelas: true,
        mapel: true,
        guru: { select: { id: true, name: true } },
      },
    }),
  ]);

  const sortedSchedules = [...schedules].sort((a, b) => {
    const comp = compareScheduleTime(
      a.hari,
      a.jam_mulai,
      a.jam_selesai,
      b.hari,
      b.jam_mulai,
      b.jam_selesai
    );
    if (comp !== 0) return comp;
    const kelasComp = (a.kelas?.nama_kelas || "").localeCompare(b.kelas?.nama_kelas || "");
    if (kelasComp !== 0) return kelasComp;
    return (a.mapel?.nama_mapel || "").localeCompare(b.mapel?.nama_mapel || "");
  });

  const formattedSchedules = sortedSchedules.map((s) => ({
    id: s.id.toString(),
    kelasId: s.kelas_id.toString(),
    kelasNama: s.kelas.nama_kelas,
    jenjang: s.kelas.jenjang,
    mapelId: s.mapel_id.toString(),
    mapelNama: s.mapel.nama_mapel,
    mapelKode: s.mapel.kode_mapel,
    guruId: s.guru_id.toString(),
    guruNama: s.guru?.name || "-",
    hari: s.hari,
    jamMulai: s.jam_mulai,
    jamSelesai: s.jam_selesai,
  }));

  const formattedClasses = classes.map((c) => ({
    id: c.id.toString(),
    nama: c.nama_kelas,
    jenjang: c.jenjang,
  }));

  const formattedSubjects = subjects.map((s) => ({
    id: s.id.toString(),
    nama: s.nama_mapel,
    kode: s.kode_mapel,
    jenjang: s.jenjang,
  }));

  const formattedTeachers = teachers.map((t) => ({
    id: t.id.toString(),
    nama: t.name,
    bidang: t.guru_bidang || "",
  }));

  const scopeLabel =
    isSuperAdmin && activeJenjang === "ALL"
      ? "Semua Jenjang"
      : activeJenjang === "SD"
        ? "Jenjang SD"
        : activeJenjang === "SMP"
          ? "Jenjang SMP"
          : "Semua Jenjang";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Jadwal Pelajaran</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            {scopeLabel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola alokasi jadwal mata pelajaran per kelas {scopeLabel}, penugasan guru pengampu, dan waktu KBM.
        </p>
      </div>

      <SchedulesManager
        initialSchedules={formattedSchedules}
        classes={formattedClasses}
        subjects={formattedSubjects}
        teachers={formattedTeachers}
      />
    </div>
  );
}
