import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CalendarClient } from "@/components/features/calendar/calendar-client";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const adminJenjang = session.jenjang || "ALL";

  // Ambil data kelas sesuai jenjang admin
  const classRecords = await prisma.kelas.findMany({
    where:
      adminJenjang !== "ALL"
        ? { jenjang: adminJenjang }
        : {},
    orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
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
        userRole="admin"
        userJenjang={adminJenjang}
        classList={classList}
        pageTitle="Kalender Kegiatan Akademik"
        pageSubtitle="Kelola agenda resmi sekolah, jadwal penilaian/ujian, kegiatan keagamaan, dan kalender libur akademik."
      />
    </div>
  );
}
