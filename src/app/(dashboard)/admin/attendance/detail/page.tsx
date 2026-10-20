import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateIndo } from "@/lib/utils";
import { DailySubjectAttendanceForm } from "@/app/(dashboard)/guru/attendance/[mapelId]/[kelasId]/[date]/_components/daily-subject-attendance-form";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    kelas?: string;
    date?: string;
    mapel?: string;
  }>;
}

export default async function AdminAttendanceDetailPage(props: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const { kelas: kelasNama, date, mapel: mapelNama } = await props.searchParams;

  if (!kelasNama || !date || !mapelNama) {
    redirect("/admin/attendance");
  }

  const [mapel, kelas] = await Promise.all([
    prisma.mataPelajaran.findFirst({
      where: { nama_mapel: mapelNama },
    }),
    prisma.kelas.findFirst({
      where: { nama_kelas: kelasNama },
    }),
  ]);

  if (!mapel || !kelas) {
    notFound();
  }

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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/attendance?date=${date}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Monitoring Presensi
        </Link>
        <Badge className="bg-slate-800 text-white text-xs font-semibold">
          Audit Otoritas Administrator
        </Badge>
      </div>

      <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[11px] font-mono border-orange-500/40 text-orange-600">
                {mapel.kode_mapel}
              </Badge>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Audit Presensi: {mapel.nama_mapel}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Rombel Kelas: <strong>{kelas.nama_kelas}</strong> • Tanggal: <strong>{formatDateIndo(date)}</strong>
            </p>
          </div>
          <div>
            {existingAbsen.length > 0 ? (
              <Badge className="bg-emerald-600 text-white text-xs font-semibold">
                Tercatat ({existingAbsen.length} Siswa)
              </Badge>
            ) : (
              <Badge className="bg-orange-500 text-white text-xs font-semibold">
                Belum Diisi Guru
              </Badge>
            )}
          </div>
        </div>
      </div>

      <DailySubjectAttendanceForm
        dateStr={date}
        kelasId={kelas.id.toString()}
        kelasNama={kelas.nama_kelas}
        mapelId={mapel.id.toString()}
        mapelNama={mapel.nama_mapel}
        mapelKode={mapel.kode_mapel}
        mapelWarna={mapel.warna || "emerald"}
        initialStudents={initialStudents}
        isAlreadyFilled={existingAbsen.length > 0}
      />
    </div>
  );
}
