import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { CreateTaskForm } from "./create-task-form";

export const dynamic = "force-dynamic";

export default async function GuruCreateTugasPage() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const [classes, subjects] = await Promise.all([
    prisma.kelas.findMany({
      orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
    }),
    prisma.mataPelajaran.findMany({
      orderBy: { nama_mapel: "asc" },
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <Link
          href="/guru/tugas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Tugas</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Buat Tugas Baru
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Tentukan kelas, mata pelajaran, tenggat pengumpulan, dan instruksi tugas.
        </p>
      </div>

      <CreateTaskForm
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
        defaultKelas={session.kelas || ""}
      />
    </div>
  );
}
