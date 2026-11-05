import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GuruAttendanceTablePage(props: {
  params: Promise<{ date: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const { date } = await props.params;
  const dbUser = /^\d+$/.test(session.id)
    ? await prisma.user.findUnique({
        where: { id: BigInt(session.id) },
        select: { status: true, kelas: true },
      })
    : null;

  const currentStatus = dbUser?.status || session.status;
  const isWaliKelas = currentStatus === "4" || session.role === "admin";
  if (!isWaliKelas) {
    redirect("/guru/attendance");
  }

  const guruClass = dbUser?.kelas || session.kelas || "";

  // Parse Year and Month from the URL param date (e.g. 2026-09-10)
  const [yearStr, monthStr] = (date || "").split("-");
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;

  // Otomatis integrasikan ke halaman Rekap & Tabel Presensi terpadu dengan tampilan Matriks Bulanan
  redirect(
    `/guru/attendance/recap?mapelId=ROMBEL&month=${month}&year=${year}&kelas=${encodeURIComponent(guruClass)}&view=matrix`
  );
}
