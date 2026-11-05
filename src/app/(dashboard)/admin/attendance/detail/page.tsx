import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserProfileImage } from "@/lib/utils";
import { AdminAttendanceDetailClient } from "./_components/admin-attendance-detail-client";

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

  // Cek otorisasi jenjang jika admin bukan Super Admin
  const isSuperAdmin = session.jenjang === "ALL";
  if (!isSuperAdmin && session.jenjang && kelas.jenjang && kelas.jenjang !== session.jenjang) {
    redirect(`/admin/attendance?date=${date}`);
  }

  // Indonesian day name for date
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const parsedDate = new Date(date + "T00:00:00");
  const dayName = !isNaN(parsedDate.getTime()) ? dayNames[parsedDate.getDay()] : "Senin";

  const [students, existingAbsen, jadwal] = await Promise.all([
    prisma.user.findMany({
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
    }),
    prisma.absen.findMany({
      where: {
        mapel_id: mapel.id,
        kelas: kelas.nama_kelas,
        date,
      },
      include: {
        guru: { select: { id: true, name: true, nip: true } },
      },
    }),
    prisma.jadwalPelajaran.findFirst({
      where: {
        kelas_id: kelas.id,
        mapel_id: mapel.id,
        hari: dayName,
      },
      include: {
        guru: { select: { id: true, name: true, nip: true } },
      },
    }),
  ]);

  const existingMap = new Map();
  existingAbsen.forEach((a) => {
    existingMap.set(a.user_id.toString(), {
      keterangan: (a.keterangan || "Hadir") as "Hadir" | "Sakit" | "Izin" | "Alpha",
      catatan: a.catatan || "",
    });
  });

  const initialStudents = students.map((s) => {
    const found = existingMap.get(s.id.toString());
    const profileImg = getUserProfileImage(s.image, s.gender, s.name);
    return {
      id: s.id.toString(),
      name: s.name,
      nis: s.nis || "-",
      gender: s.gender || "L",
      image: profileImg,
      keterangan: found?.keterangan || ("Hadir" as const),
      catatan: found?.catatan || "",
    };
  });

  // Determine teacher name: from recorder or from schedule
  const recorderTeacher = existingAbsen.find((a) => a.guru?.name)?.guru?.name;
  const scheduleTeacher = jadwal?.guru?.name;
  const teacherName = recorderTeacher || scheduleTeacher || null;

  const jamKbm =
    jadwal?.jam_mulai && jadwal?.jam_selesai
      ? `${jadwal.jam_mulai} - ${jadwal.jam_selesai}`
      : null;

  return (
    <div className="max-w-4xl mx-auto px-1 sm:px-0">
      <AdminAttendanceDetailClient
        dateStr={date}
        kelasId={kelas.id.toString()}
        kelasNama={kelas.nama_kelas}
        kelasJenjang={kelas.jenjang || "SD"}
        mapelId={mapel.id.toString()}
        mapelNama={mapel.nama_mapel}
        mapelKode={mapel.kode_mapel}
        teacherName={teacherName}
        jamKbm={jamKbm}
        jadwalId={jadwal?.id.toString() || null}
        initialStudents={initialStudents}
        isAlreadyFilled={existingAbsen.length > 0}
      />
    </div>
  );
}
