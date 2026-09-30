import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { TeacherMeetingList } from "@/components/features/teacher-subjects/teacher-meeting-list";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ mapelId: string }>;
  searchParams: Promise<{ kelasId?: string }>;
}

export default async function GuruMapelDetailPage({ params, searchParams }: PageProps) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const { mapelId } = await params;
  const { kelasId } = await searchParams;

  if (!/^\d+$/.test(mapelId)) {
    notFound();
  }

  const mapel = await prisma.mataPelajaran.findUnique({
    where: { id: BigInt(mapelId) },
  });

  if (!mapel) {
    notFound();
  }

  const guruId = BigInt(session.id);

  // Ambil semua kelas yang diampu guru ini untuk mapel ini
  const schedules = await prisma.jadwalPelajaran.findMany({
    where: {
      mapel_id: mapel.id,
      ...(session.role === "guru" ? { guru_id: guruId } : {}),
    },
    include: {
      kelas: true,
    },
  });

  // Unique assigned classes
  const assignedClassesMap = new Map();
  schedules.forEach((s) => {
    if (!assignedClassesMap.has(s.kelas.id.toString())) {
      assignedClassesMap.set(s.kelas.id.toString(), {
        id: s.kelas.id.toString(),
        namaKelas: s.kelas.nama_kelas,
        jenjang: s.kelas.jenjang,
      });
    }
  });

  // Jika admin atau tidak ada jadwal spesifik, ambil semua kelas
  let assignedClasses = Array.from(assignedClassesMap.values());
  if (assignedClasses.length === 0) {
    const allClasses = await prisma.kelas.findMany({
      orderBy: { nama_kelas: "asc" },
    });
    assignedClasses = allClasses.map((c) => ({
      id: c.id.toString(),
      namaKelas: c.nama_kelas,
      jenjang: c.jenjang,
    }));
  }

  if (assignedClasses.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-card border border-border">
        <p className="text-sm font-semibold text-foreground">Tidak Ada Rombel Kelas Terdaftar</p>
        <p className="text-xs text-muted-foreground mt-1">
          Belum ada rombel kelas yang terdaftar di sistem.
        </p>
      </div>
    );
  }

  // Tentukan kelas aktif
  const currentKelas =
    assignedClasses.find((c) => c.id === kelasId) || assignedClasses[0];

  // Ambil pertemuan untuk kelas & mapel ini
  const meetingsData = (prisma as any).pertemuan?.findMany
    ? await (prisma as any).pertemuan.findMany({
        where: {
          kelas_id: BigInt(currentKelas.id),
          mapel_id: mapel.id,
        },
        include: {
          guru: { select: { id: true, name: true, image: true } },
          tugas: { select: { id: true, judul: true, deadline: true } },
        },
        orderBy: [{ pertemuan_ke: "asc" }, { tanggal: "asc" }],
      })
    : [];

  // Ambil tugas yang tersedia untuk rombel ini
  const tasksData = await prisma.tugas.findMany({
    where: {
      kelas_id: BigInt(currentKelas.id),
      mapel_id: mapel.id,
    },
    select: {
      id: true,
      judul: true,
    },
    orderBy: { created_at: "desc" },
  });

  const formattedMeetings = meetingsData.map((m: any) => ({
    id: m.id.toString(),
    kelasId: m.kelas_id.toString(),
    mapelId: m.mapel_id.toString(),
    guruId: m.guru_id.toString(),
    guruName: m.guru?.name,
    pertemuanKe: m.pertemuan_ke,
    judul: m.judul,
    deskripsi: m.deskripsi,
    tanggal: m.tanggal ? new Date(m.tanggal).toISOString() : new Date().toISOString(),
    fileUrl: m.file_url,
    fileName: m.file_name,
    fileSize: m.file_size,
    fileType: m.file_type,
    videoUrl: m.video_url,
    linkEksternal: m.link_eksternal,
    isPublished: m.is_published,
    tugas: (m.tugas || []).map((t: any) => ({
      id: t.id.toString(),
      judul: t.judul,
      deadline: t.deadline ? new Date(t.deadline).toISOString() : new Date().toISOString(),
    })),
  }));

  const formattedTasks = tasksData.map((t) => ({
    id: t.id.toString(),
    judul: t.judul,
    pertemuan_id: (t as any).pertemuan_id ? (t as any).pertemuan_id.toString() : null,
  }));

  return (
    <div className="space-y-6">
      {/* Tombol Kembali */}
      <div>
        <Link
          href="/guru/mapel"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Jadwal & Mata Pelajaran Saya</span>
        </Link>
      </div>

      <TeacherMeetingList
        mapel={{
          id: mapel.id.toString(),
          kodeMapel: mapel.kode_mapel,
          namaMapel: mapel.nama_mapel,
          warna: mapel.warna,
        }}
        currentKelas={currentKelas}
        allAssignedClasses={assignedClasses}
        meetings={formattedMeetings}
        availableTasks={formattedTasks}
      />
    </div>
  );
}
