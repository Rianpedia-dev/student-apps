import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MyClassTable } from "./_components/my-class-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BuildingLibraryIcon } from "@/components/icons/building-library-icon";
import { BookOpenCheckIcon } from "@/components/icons/book-open-check-icon";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GuruMyClassPage() {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const dbUser = /^\d+$/.test(session.id)
    ? await prisma.user.findUnique({
        where: { id: BigInt(session.id) },
        select: { status: true, kelas: true, guru_bidang: true },
      })
    : null;

  const currentStatus = dbUser?.status || session.status;
  const guruClass = dbUser?.kelas || session.kelas || "";
  const isWaliKelas = currentStatus === "4";

  if (!isWaliKelas) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border border-border/80 shadow-md overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />
          <CardContent className="p-6 sm:p-8 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BuildingLibraryIcon className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Khusus Guru & Wali Kelas
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Akun Anda terdaftar sebagai <strong className="text-foreground">Guru Mata Pelajaran</strong>{dbUser?.guru_bidang ? ` (${dbUser.guru_bidang})` : ""}. Menu <em>Kelas Saya</em> dikhususkan bagi dewan guru yang bertugas sebagai <strong>Wali Kelas</strong> untuk mengelola rombel binaan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground text-left space-y-1.5">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" /> Informasi Akses Anda:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Anda dapat mengelola materi pembelajaran, bank soal, dan tugas di menu <strong>Mapel & Tugas</strong>.</li>
                <li>Jika Anda seharusnya bertugas sebagai Wali Kelas, silakan hubungi <strong>Administrator</strong> untuk memperbarui status peran dan menetapkan kelas binaan Anda.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Link href="/guru/mapel" className="w-full sm:w-auto">
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                  <BookOpenCheckIcon className="h-4 w-4" />
                  <span>Buka Mapel & Tugas</span>
                </Button>
              </Link>
              <Link href="/guru" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full gap-2 cursor-pointer">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali ke Dashboard</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!guruClass) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border border-border/80 shadow-md overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 to-rose-500" />
          <CardContent className="p-6 sm:p-8 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BuildingLibraryIcon className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Kelas Binaan Belum Ditetapkan
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Status peran akun Anda adalah <strong className="text-foreground">Guru & Wali Kelas</strong>, namun Administrator belum menetapkan kelas binaan untuk Anda di sistem.
              </p>
            </div>

            <div className="flex items-center justify-center pt-2">
              <Link href="/guru">
                <Button variant="outline" className="gap-2 cursor-pointer">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali ke Dashboard</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  let formattedStudents: any[] = [];
  let formattedAvailable: any[] = [];

  try {
    const studentsInClass = await prisma.user.findMany({
      where: { kelas: guruClass, status: "1" },
      orderBy: { name: "asc" },
    });

    formattedStudents = studentsInClass.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      nis: s.nis,
      email: s.email,
      gender: s.gender,
      kelas: s.kelas,
      status: s.status,
      point: s.point,
      address: s.address,
      skills: s.skills,
      notes: s.notes,
      image: s.image,
    }));

    const availableStudents = await prisma.user.findMany({
      where: {
        status: "1",
        OR: [{ kelas: null }, { kelas: "" }, { kelas: { not: guruClass } }],
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    formattedAvailable = availableStudents.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      nis: s.nis,
      kelas: s.kelas,
    }));
  } catch (e) {
    console.error("Database query error in guru my-class:", e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelas Saya: {guruClass}</h1>
      </div>

      <MyClassTable
        students={formattedStudents}
        availableStudents={formattedAvailable}
        guruClass={guruClass}
      />
    </div>
  );
}
