import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { SchedulesManager } from "./_components/schedules-manager";
import { compareScheduleTime, getAcademicYear } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    tahun?: string;
    semester?: string;
    scope?: string;
    kelasId?: string;
  }>;
}

export default async function AdminSchedulesPage(props: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const { tahun, semester, scope, kelasId } = await props.searchParams;

  const academic = getAcademicYear();
  const currentTahun = tahun || academic.tahunPelajaran;
  const currentSemester = semester || String(academic.semesterNum);

  const activeJenjang = await getActiveJenjang(session);
  const isSuperAdmin = session?.jenjang === "ALL";
  const isRestricted = !isSuperAdmin && activeJenjang !== "ALL";

  const currentScope = scope || (isRestricted ? activeJenjang : "ALL");

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

  const scheduleWhere: any = {
    AND: [
      {
        OR: [
          { tahun_pelajaran: currentTahun, semester: currentSemester },
          // Tetap tampilkan jadwal legacy yang belum terisi tahun_pelajarannya di semester aktif
          { tahun_pelajaran: null },
        ],
      },
    ],
  };

  if (currentScope === "SD") {
    scheduleWhere.AND.push({ kelas: { jenjang: "SD" } });
  } else if (currentScope === "SMP") {
    scheduleWhere.AND.push({ kelas: { jenjang: "SMP" } });
  } else if (currentScope === "CLASS" && kelasId) {
    scheduleWhere.AND.push({ kelas_id: BigInt(kelasId) });
  } else if (isRestricted) {
    scheduleWhere.AND.push({ kelas: { jenjang: activeJenjang } });
  }

  const [classes, subjects, teachers, schedules, distinctYears] = await Promise.all([
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
      select: { id: true, name: true, email: true, guru_bidang: true, nip: true },
      orderBy: { name: "asc" },
    }),
    prisma.jadwalPelajaran.findMany({
      where: scheduleWhere,
      include: {
        kelas: true,
        mapel: true,
        guru: { select: { id: true, name: true, nip: true } },
      },
    }),
    prisma.jadwalPelajaran.findMany({
      select: { tahun_pelajaran: true },
      distinct: ["tahun_pelajaran"],
    }),
  ]);

  const yearSet = new Set<string>(["2026/2027", "2025/2026", "2024/2025", "2023/2024"]);
  yearSet.add(academic.tahunPelajaran);
  distinctYears.forEach((y) => {
    if (y.tahun_pelajaran) yearSet.add(y.tahun_pelajaran);
  });
  const availableYears = Array.from(yearSet).sort().reverse();

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
    jenjang: s.kelas.jenjang || "SD",
    mapelId: s.mapel_id.toString(),
    mapelNama: s.mapel.nama_mapel,
    mapelKode: s.mapel.kode_mapel,
    guruId: s.guru_id.toString(),
    guruNama: s.guru?.name || "-",
    guruNiy: s.guru?.nip || "-",
    hari: s.hari,
    jamMulai: s.jam_mulai,
    jamSelesai: s.jam_selesai,
    tahunPelajaran: s.tahun_pelajaran || currentTahun,
    semester: s.semester || currentSemester,
  }));

  const formattedClasses = classes.map((c) => ({
    id: c.id.toString(),
    nama: c.nama_kelas,
    jenjang: c.jenjang || "SD",
  }));

  const formattedSubjects = subjects.map((s) => ({
    id: s.id.toString(),
    nama: s.nama_mapel,
    kode: s.kode_mapel,
    jenjang: s.jenjang || "SEMUA",
  }));

  const formattedTeachers = teachers.map((t) => ({
    id: t.id.toString(),
    nama: t.name,
    bidang: t.guru_bidang || "",
    nip: t.nip || "-",
  }));

  return (
    <div className="space-y-6">
      {/* Page Header (Bersih, Rapi, Tanpa Badge Berlebihan) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Manajemen Jadwal Pelajaran
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola jadwal KBM per kelas, penugasan guru pengampu, serta import/export format Excel & PDF resmi.
          </p>
        </div>
      </div>

      <SchedulesManager
        initialSchedules={formattedSchedules}
        classes={formattedClasses}
        subjects={formattedSubjects}
        teachers={formattedTeachers}
        currentTahun={currentTahun}
        currentSemester={currentSemester}
        availableYears={availableYears}
        adminJenjang={session.jenjang || "ALL"}
        activeJenjang={activeJenjang}
        initialScope={currentScope}
        initialKelasId={kelasId || ""}
      />
    </div>
  );
}
