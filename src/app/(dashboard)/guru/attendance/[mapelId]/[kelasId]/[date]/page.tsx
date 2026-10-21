import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
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
      keterangan: found?.keterangan || ("Hadir" as const),
      catatan: found?.catatan || "",
    };
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full px-2 sm:px-4 md:px-0">
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
      <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[11px] font-mono border-orange-500/40 text-orange-600 dark:text-orange-400">
                {mapel.kode_mapel}
              </Badge>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {mapel.nama_mapel}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Form Presensi Pertemuan KBM: <strong>{formatDateIndo(date)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {existingAbsen.length > 0 ? (
              <Badge className="bg-emerald-600 text-white text-xs font-semibold">
                Sudah Diabsen ({existingAbsen.length} Siswa)
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs font-semibold">
                Belum Diisi
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1 border-t border-border/40">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <BuildingLibraryIcon className="h-4 w-4 text-emerald-600 shrink-0" />
            {kelas.nama_kelas}
          </span>
          {jamKe && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              {jamKe} WIB
            </span>
          )}
          <span>• Total {students.length} Santri</span>
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
