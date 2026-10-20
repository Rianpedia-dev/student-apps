import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let attendanceList: any[] = [];
  try {
    const isNum = /^\d+$/.test(session.id);
    if (isNum) {
      attendanceList = await prisma.absen.findMany({
        where: { user_id: BigInt(session.id) },
        include: {
          mapel: {
            select: { id: true, nama_mapel: true, kode_mapel: true },
          },
        },
        orderBy: { date: "desc" },
      });
    }
  } catch (e) {
    console.error("Database query error in attendance history API:", e);
  }

  const colorMap: Record<string, string> = {
    Hadir: "#10b981", // emerald-500
    Sakit: "#0284c7", // sky-600
    Izin: "#d97706",  // amber-600
    Alpha: "#e11d48", // rose-600
  };

  const events = attendanceList.map((a) => {
    const parts = (a.date || "").split("-");
    const formattedDate =
      parts.length === 3
        ? `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`
        : a.date;

    const ket = a.keterangan || "Hadir";
    const bg = colorMap[ket] || "#10b981";
    const mapelTitle = a.mapel?.nama_mapel ? `${a.mapel.nama_mapel}: ${ket}` : ket;

    return {
      id: a.id.toString(),
      title: mapelTitle,
      start: formattedDate,
      allDay: true,
      backgroundColor: bg,
      borderColor: bg,
      extendedProps: {
        keterangan: ket,
        kelas: a.kelas,
        mapelNama: a.mapel?.nama_mapel || "Presensi Umum",
        mapelKode: a.mapel?.kode_mapel || "-",
        catatan: a.catatan || "",
        jamKe: a.jam_ke || "",
      },
    };
  });

  return NextResponse.json(events);
}
