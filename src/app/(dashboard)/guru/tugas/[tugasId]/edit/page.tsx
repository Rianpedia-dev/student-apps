import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { InteractiveTaskBuilder } from "@/components/features/assignment/builder/interactive-task-builder";
import { DashboardBreadcrumb } from "@/components/shared/dashboard-breadcrumb";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tugasId: string }>;
}

export default async function GuruEditTugasPage({ params }: PageProps) {
  const { tugasId } = await params;
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const isNum = /^\d+$/.test(tugasId);
  if (!isNum) notFound();

  const tugas = await prisma.tugas.findUnique({
    where: { id: BigInt(tugasId) },
    include: {
      soal: {
        include: { opsi: { orderBy: { nomor_urut: "asc" } } },
        orderBy: { nomor_urut: "asc" },
      },
    },
  });

  if (!tugas) notFound();

  const [classes, subjects, pertemuanList] = await Promise.all([
    prisma.kelas.findMany({
      orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
    }),
    prisma.mataPelajaran.findMany({
      orderBy: { nama_mapel: "asc" },
    }),
    prisma.pertemuan.findMany({
      where: {
        guru_id: BigInt(session.id),
        mapel_id: tugas.mapel_id,
        kelas_id: tugas.kelas_id,
      },
      select: {
        id: true,
        pertemuan_ke: true,
        judul: true,
      },
      orderBy: { pertemuan_ke: "asc" },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <DashboardBreadcrumb
        backHref={`/guru/tugas/${tugasId}`}
        backLabel="Kembali ke Detail Tugas"
      />

      <div className="bg-card/70 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-border shadow-2xs">
        <h1 className="text-xl sm:text-2xl font-black text-foreground">
          Edit Tugas Interaktif
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Perbarui informasi, bobot nilai, atau butir-butir soal interaktif.
        </p>
      </div>

      <InteractiveTaskBuilder
        classes={classes.map((c) => ({
          id: c.id.toString(),
          nama: c.nama_kelas,
          jenjang: c.jenjang,
          tingkat: c.tingkat,
        }))}
        subjects={subjects.map((s) => ({
          id: s.id.toString(),
          kode: s.kode_mapel,
          nama: s.nama_mapel,
          jenjang: s.jenjang,
        }))}
        pertemuanList={pertemuanList.map((p) => ({
          id: p.id.toString(),
          pertemuan_ke: p.pertemuan_ke,
          judul: p.judul,
        }))}
        initialData={{
          id: tugas.id.toString(),
          judul: tugas.judul,
          deskripsi: tugas.deskripsi,
          kelas_id: tugas.kelas_id.toString(),
          mapel_id: tugas.mapel_id.toString(),
          pertemuan_id: tugas.pertemuan_id?.toString() || null,
          deadline: tugas.deadline.toISOString(),
          durasi_menit: tugas.durasi_menit,
          acak_soal: tugas.acak_soal,
          acak_opsi: tugas.acak_opsi,
          tampilkan_nilai_instan: tugas.tampilkan_nilai_instan,
          poin_maksimal: tugas.poin_maksimal,
          soal: tugas.soal.map((s) => ({
            id: s.id.toString(),
            nomor_urut: s.nomor_urut,
            tipe_soal: s.tipe_soal as any,
            pertanyaan: s.pertanyaan,
            gambar_soal: s.gambar_soal,
            bobot_poin: s.bobot_poin,
            kunci_jawaban: s.kunci_jawaban,
            pembahasan: s.pembahasan,
            opsi: s.opsi.map((o) => ({
              label: o.label,
              teks_opsi: o.teks_opsi,
              gambar_opsi: o.gambar_opsi,
              is_benar: o.is_benar,
            })),
          })),
        }}
      />
    </div>
  );
}
