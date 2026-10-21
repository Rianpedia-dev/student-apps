import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, FileText, BookOpen } from "lucide-react";
import { RecapClient } from "./_components/recap-client";
import { getAcademicYear } from "@/lib/utils";

export const dynamic = "force-dynamic";

function parsePeriod(rawMonth?: string, rawYear?: string, now: Date = new Date()) {
  const m = parseInt(rawMonth ?? "", 10);
  const y = parseInt(rawYear ?? "", 10);
  return {
    month: Number.isFinite(m) && m >= 1 && m <= 12 ? m : now.getMonth() + 1,
    year: Number.isFinite(y) && y >= 2000 && y <= 2100 ? y : now.getFullYear(),
  };
}

export default async function GuruAttendanceRecapPage(props: {
  searchParams: Promise<{ month?: string; year?: string; mapelId?: string; kelas?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const guruId = BigInt(session.id);
  const { month: rawMonth, year: rawYear, mapelId: rawMapelId, kelas: rawKelas } = await props.searchParams;
  const { month: selectedMonth, year: selectedYear } = parsePeriod(rawMonth, rawYear);

  // Ambil daftar mapel & kelas yang diampu guru ini
  const schedules = await prisma.jadwalPelajaran.findMany({
    where: session.role === "guru" ? { guru_id: guruId } : {},
    include: {
      mapel: true,
      kelas: true,
    },
    orderBy: { jam_mulai: "asc" },
  });

  const mapelMap = new Map();
  const classSet = new Set<string>();

  schedules.forEach((s) => {
    if (!mapelMap.has(s.mapel_id.toString())) {
      mapelMap.set(s.mapel_id.toString(), {
        id: s.mapel_id.toString(),
        nama: s.mapel.nama_mapel,
        kode: s.mapel.kode_mapel,
      });
    }
    classSet.add(s.kelas.nama_kelas);
  });

  if (session.kelas) {
    classSet.add(session.kelas);
  }

  const mapelList = Array.from(mapelMap.values());
  const classList = Array.from(classSet).sort();

  // Tentukan kelas aktif
  const activeClass = rawKelas || (classList.length > 0 ? classList[0] : session.kelas || "");
  const activeMapelId = rawMapelId || (mapelList.length > 0 ? mapelList[0].id : undefined);

  const selectedMapel = activeMapelId ? mapelList.find((m) => m.id === activeMapelId) : undefined;
  const academic = getAcademicYear();

  const thisYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => thisYear - 3 + i);

  let formattedStudents: any[] = [];
  let formattedAbsens: any[] = [];

  try {
    const monthPadded = String(selectedMonth).padStart(2, "0");

    const [students, absens] = await Promise.all([
      activeClass
        ? prisma.user.findMany({
            where: { kelas: activeClass, status: "1" },
            orderBy: { name: "asc" },
          })
        : [],
      activeClass
        ? prisma.absen.findMany({
            where: {
              kelas: activeClass,
              ...(activeMapelId ? { mapel_id: BigInt(activeMapelId) } : {}),
              OR: [
                { date: { startsWith: `${selectedYear}-${monthPadded}-` } },
                { date: { startsWith: `${selectedYear}-${selectedMonth}-` } },
              ],
            },
          })
        : [],
    ]);

    formattedStudents = students.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      nis: s.nis,
      gender: s.gender,
      email: s.email,
      status: s.status,
    }));

    formattedAbsens = absens.map((a) => ({
      user_id: a.user_id.toString(),
      date: a.date || "",
      keterangan: a.keterangan || "Hadir",
    }));
  } catch (e) {
    console.error("Database query error in attendance recap:", e);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full px-2 sm:px-4 md:px-0">
      <div className="flex items-center justify-between">
        <Link
          href="/guru/attendance"
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Hub Presensi
        </Link>
        <span className="text-xs font-semibold text-muted-foreground font-mono tracking-tight">
          SD - SMP Islam Al-Azhar Cairo
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Rekapitulasi Presensi & Cetak PDF Resmi
        </h1>
        <p className="text-xs font-medium text-muted-foreground mt-1">
          Laporan kehadiran per mata pelajaran dan rekap bulanan format A4 Landscape
        </p>
      </div>

      <RecapClient
        guruClass={activeClass}
        selectedMapelId={activeMapelId}
        selectedMapelNama={selectedMapel?.nama}
        mapelList={mapelList}
        classList={classList}
        tahunPelajaran={academic.tahunPelajaran}
        semester={academic.semester}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        availableYears={availableYears}
        students={formattedStudents}
        allAbsen={formattedAbsens}
      />
    </div>
  );
}
