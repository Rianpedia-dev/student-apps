import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let events: Array<{
    id: bigint;
    title: string;
    kelas: string;
    jenjang: string | null;
    from: string | null;
    start: Date;
    end: Date | null;
    deskripsi: string | null;
    backgroundColor: string | null;
    created_at: Date | null;
    updated_at: Date | null;
  }> = [];
  try {
    const userJenjang = session.jenjang || "ALL";
    const isSuperAdmin = session.role === "admin" && userJenjang === "ALL";

    // Filter jenjang: jika bukan superadmin, tampilkan yang sesuai jenjangnya atau 'ALL' atau null
    const jenjangCondition: Prisma.EventWhereInput = !isSuperAdmin && userJenjang !== "ALL"
      ? {
          OR: [
            { jenjang: userJenjang },
            { jenjang: "ALL" },
            { jenjang: null },
          ],
        }
      : {};

    if (session.role === "admin") {
      events = await prisma.event.findMany({
        where: jenjangCondition,
        orderBy: { start: "asc" },
      });
    } else if (session.role === "guru") {
      // Guru dapat melihat agenda umum sekolah, agenda kelas binaannya, atau agenda yang ia buat
      const guruConditions: Prisma.EventWhereInput[] = [
        { kelas: "Semua Kelas" },
        { from: "admin" },
        { from: session.name },
      ];

      if (session.kelas) {
        guruConditions.push({ kelas: session.kelas });
      }

      events = await prisma.event.findMany({
        where: {
          AND: [
            jenjangCondition,
            { OR: guruConditions },
          ],
        },
        orderBy: { start: "asc" },
      });
    } else {
      // Siswa hanya melihat agenda 'Semua Kelas', kelasnya sendiri, atau agenda resmi admin
      const siswaConditions: Prisma.EventWhereInput[] = [
        { kelas: "Semua Kelas" },
        { from: "admin" },
      ];

      if (session.kelas) {
        siswaConditions.push({ kelas: session.kelas });
      }

      events = await prisma.event.findMany({
        where: {
          AND: [
            jenjangCondition,
            { OR: siswaConditions },
          ],
        },
        orderBy: { start: "asc" },
      });
    }
  } catch (e) {
    console.error("Database query error in events API:", e);
  }

  const formatted = events.map((e) => {
    const startDate = e.start instanceof Date ? e.start : new Date(e.start);
    const endDate = e.end ? (e.end instanceof Date ? e.end : new Date(e.end)) : new Date(startDate.getTime() + 3600000);

    const canEdit =
      session.role === "admin" ||
      (session.role === "guru" && (e.from === session.name || (session.kelas && e.from === session.kelas)));

    // Tentukan kategori dari kelas atau fallback
    const rawCategory = e.kelas || "Akademik";
    const knownCategories = ["Keagamaan", "Akademik", "Ujian", "Libur", "Ekstrakurikuler"];
    const category = knownCategories.includes(rawCategory) ? rawCategory : "Akademik";

    return {
      id: e.id.toString(),
      title: e.title,
      description: e.deskripsi || "",
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      start: startDate.toISOString().split("T")[0],
      end: e.end ? (e.end instanceof Date ? e.end.toISOString().split("T")[0] : String(e.end).split("T")[0]) : undefined,
      color: e.backgroundColor || "emerald",
      backgroundColor: e.backgroundColor || "#10b981",
      category: category,
      kelas: e.kelas || "Semua Kelas",
      jenjang: e.jenjang || "ALL",
      from: e.from || "Sekolah",
      canEdit: Boolean(canEdit),
      extendedProps: {
        kelas: e.kelas,
        from: e.from,
        deskripsi: e.deskripsi,
      },
    };
  });

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "guru")) {
    return NextResponse.json(
      { error: "Akses ditolak: Hanya Admin dan Guru yang berhak membuat kegiatan kalender" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, startTime, endTime, color, category, kelas, jenjang } = body;

    if (!title || !startTime) {
      return NextResponse.json({ error: "Judul dan waktu mulai kegiatan wajib diisi" }, { status: 400 });
    }

    const startDate = new Date(startTime);
    const endDate = endTime ? new Date(endTime) : null;

    // Tentukan jenjang: admin bisa pilih, guru mengikuti jenjang sessionnya
    const targetJenjang =
      session.role === "admin"
        ? jenjang || session.jenjang || "ALL"
        : session.jenjang || "ALL";

    // Tentukan target kelas
    const targetKelas =
      session.role === "admin"
        ? (kelas || "Semua Kelas")
        : (session.kelas || kelas || "Semua Kelas");

    const newEvent = await prisma.event.create({
      data: {
        title: title.trim(),
        kelas: targetKelas,
        jenjang: targetJenjang,
        from: session.role === "admin" ? "admin" : session.name,
        start: startDate,
        end: endDate,
        deskripsi: description ? description.trim() : null,
        backgroundColor: color || "emerald",
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: newEvent.id.toString(),
        title: newEvent.title,
        description: newEvent.deskripsi || "",
        startTime: newEvent.start.toISOString(),
        endTime: (newEvent.end || newEvent.start).toISOString(),
        color: newEvent.backgroundColor || "emerald",
        category: category || "Akademik",
        kelas: newEvent.kelas,
        jenjang: newEvent.jenjang,
        from: newEvent.from,
        canEdit: true,
      },
    });
  } catch (error) {
    console.error("Error creating event in API:", error);
    return NextResponse.json({ error: "Gagal menyimpan kegiatan kalender" }, { status: 500 });
  }
}
