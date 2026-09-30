import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SubjectTable } from "@/components/features/subjects/subject-table";
import { sortSubjectsBySchedule } from "@/lib/utils";

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
          guru: { select: { id: true, name: true, image: true, gender: true, email: true, guru_bidang: true } },
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

  // Transform subjects for table view
  const rawSubjectsData = allMapel.map((mapel) => {
    const jadwalMapel = jadwalList.find((j) => j.mapel_id === mapel.id);
    const tasks = activeTasks.filter((t) => t.mapel_id === mapel.id);
    const unsubmitted = tasks.filter((t) => t.submissions.length === 0).length;

    return {
      id: mapel.id.toString(),
      kodeMapel: mapel.kode_mapel,
      namaMapel: mapel.nama_mapel,
      jenjang: mapel.jenjang,
      icon: mapel.icon,
      warna: mapel.warna,
      guruNama: jadwalMapel?.guru.name || "Guru Pengampu",
      guruImage: jadwalMapel?.guru.image || null,
      guruGender: jadwalMapel?.guru.gender || null,
      jadwalHari: jadwalMapel?.hari,
      jadwalWaktu: jadwalMapel ? `${jadwalMapel.jam_mulai} - ${jadwalMapel.jam_selesai}` : undefined,
      jamMulai: jadwalMapel?.jam_mulai,
      ruang: jadwalMapel?.ruang,
      activeTasksCount: unsubmitted,
      detailUrl: `/siswa/mapel/${mapel.id}`,
    };
  });

  const subjectsData = sortSubjectsBySchedule(rawSubjectsData);

  return (
    <div className="space-y-6">
      {/* Tabel Daftar Mata Pelajaran */}
      <SubjectTable
        subjects={subjectsData}
        title="Daftar Mata Pelajaran"
        subtitle={`Daftar mata pelajaran aktif untuk kelas ${studentClass || "Semua Jenjang"}`}
      />
    </div>
  );
}
