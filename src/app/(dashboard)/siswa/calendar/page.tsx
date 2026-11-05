import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CalendarClient } from "@/components/features/calendar/calendar-client";

export const dynamic = "force-dynamic";

export default async function SiswaCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const siswaJenjang = session.jenjang || "ALL";
  const siswaClass = session.kelas || null;

  return (
    <div className="w-full">
      <CalendarClient
        canManage={false}
        userRole="siswa"
        userJenjang={siswaJenjang}
        userClass={siswaClass}
        pageTitle="Kalender Kegiatan Sekolah"
        pageSubtitle={
          siswaClass
            ? `Jadwal kegiatan belajar, ujian, ibadah bersama, dan libur untuk ${siswaClass}.`
            : "Jadwal kegiatan belajar, ujian, ibadah bersama, dan hari libur sekolah."
        }
      />
    </div>
  );
}
