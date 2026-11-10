import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, Clock } from "lucide-react";
import { BuildingLibraryIcon } from "@/components/icons/building-library-icon";
import { Badge } from "@/components/ui/badge";
import { formatDateIndo } from "@/lib/utils";
import { DailySubjectAttendanceForm } from "./_components/daily-subject-attendance-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    mapelId: string;
    kelasId: string;
    date: string;
  }>;
}

export default async function DailySubjectAttendancePage(props: PageProps) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const { mapelId, kelasId, date } = await props.params;

  if (!/^\d+$/.test(mapelId)) {
    notFound();
  }

  const [mapel, kelas] = await Promise.all([
    prisma.mataPelajaran.findUnique({
      where: { id: BigInt(mapelId) },
    }),
    /^\d+$/.test(kelasId)
      ? prisma.kelas.findUnique({
          where: { id: BigInt(kelasId) },
        })
      : prisma.kelas.findFirst({
          where: { nama_kelas: decodeURIComponent(kelasId) },
        }),
  ]);

  if (!mapel || !kelas) {
    notFound();
  }

  // Ambil siswa terdaftar di rombel kelas ini
  const students = await prisma.user.findMany({
    where: {
      kelas: kelas.nama_kelas,
      status: "1",
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      nis: true,
      gender: true,
      image: true,
    },
  });

  // Ambil catatan presensi yang sudah tersimpan untuk mapel dan kelas ini pada tanggal ini
  const existingAbsen = await prisma.absen.findMany({
    where: {
      mapel_id: mapel.id,
      kelas: kelas.nama_kelas,
      date,
    },
    select: {
      user_id: true,
      keterangan: true,
      catatan: true,
    },
  });

  const existingMap = new Map();
  existingAbsen.forEach((a) => {
    existingMap.set(a.user_id.toString(), {
      keterangan: (a.keterangan || "Hadir") as "Hadir" | "Sakit" | "Izin" | "Alpha",
      catatan: a.catatan || "",
    });
  });

  // Cari jadwal KBM terkait untuk mendapatkan informasi jam
  const targetDate = new Date(date);
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hari = dayNames[targetDate.getDay()];

  const jadwal = await prisma.jadwalPelajaran.findFirst({
    where: {
      kelas_id: kelas.id,
      mapel_id: mapel.id,
      hari,
    },
    select: {
      id: true,
      jam_mulai: true,
      jam_selesai: true,
    },
  });

  const jamKe = jadwal ? `${jadwal.jam_mulai} - ${jadwal.jam_selesai}` : undefined;

  const initialStudents = students.map((s) => {
    const found = existingMap.get(s.id.toString());
    return {
      id: s.id.toString(),
      name: s.name,
      nis: s.nis || "-",
      gender: s.gender || "L",
      image: s.image || null,
      keterangan: found?.keterangan || ("Hadir" as const),
      catatan: found?.catatan || "",
    };
  });

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/guru/attendance"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Hub Presensi
        </Link>
        <span className="text-xs text-muted-foreground font-mono">
          SD - SMP Islam Al-Azhar Cairo
        </span>
      </div>

      {/* Subject Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card/95 dark:bg-card/90 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {mapel.nama_mapel}
            </h1>
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <BuildingLibraryIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                {kelas.nama_kelas}
              </span>
              <span>•</span>
              <span className="font-semibold text-foreground/90">
                {formatDateIndo(date)}
              </span>
              {jamKe && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    {jamKe} WIB
                  </span>
                </>
              )}
              <span>•</span>
              <span>Total {students.length} Siswa</span>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            {existingAbsen.length > 0 ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs">
                Sudah Diabsen ({existingAbsen.length} Siswa)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-bold text-amber-600 border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 rounded-full animate-pulse">
                Belum Diisi
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Form Component */}
      <DailySubjectAttendanceForm
        dateStr={date}
        kelasId={kelas.id.toString()}
        kelasNama={kelas.nama_kelas}
        mapelId={mapel.id.toString()}
        mapelNama={mapel.nama_mapel}
        mapelKode={mapel.kode_mapel}
        mapelWarna={mapel.warna || "emerald"}
        jadwalId={jadwal?.id.toString()}
        jamKe={jamKe}
        initialStudents={initialStudents}
        isAlreadyFilled={existingAbsen.length > 0}
      />
    </div>
  );
}
