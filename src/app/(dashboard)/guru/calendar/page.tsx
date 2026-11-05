import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CalendarClient } from "@/components/features/calendar/calendar-client";

export const dynamic = "force-dynamic";

export default async function GuruCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const guruJenjang = session.jenjang || "ALL";
  const guruClass = session.kelas || null;
  const isWaliKelas = Boolean(session.kelas);

  // Ambil kelas binaan atau daftar kelas sesuai jenjang guru
  const classRecords = await prisma.kelas.findMany({
    where:
      guruJenjang && guruJenjang !== "ALL"
        ? { jenjang: guruJenjang }
        : {},
    orderBy: { nama_kelas: "asc" },
    select: {
      id: true,
      nama_kelas: true,
      jenjang: true,
    },
  });

  const classList = classRecords.map((c) => ({
    id: c.id.toString(),
    nama_kelas: c.nama_kelas,
    jenjang: c.jenjang || undefined,
  }));

  return (
    <div className="w-full">
      <CalendarClient
        canManage={true}
        userRole="guru"
        userJenjang={guruJenjang}
        userClass={guruClass}
        classList={classList}
        pageTitle="Kalender Kegiatan Akademik & Kelas"
        pageSubtitle={
          isWaliKelas
            ? `Pantau agenda resmi sekolah dan publikasikan kegiatan khusus untuk ${guruClass}.`
            : "Pantau agenda resmi sekolah dan tambahkan kegiatan pembelajaran mapel Anda."
        }
      />
    </div>
  );
}
