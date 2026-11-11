import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "guru" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get("kelasId");
    const mapelId = searchParams.get("mapelId");

    if (!kelasId || !mapelId || !/^\d+$/.test(kelasId) || !/^\d+$/.test(mapelId)) {
      return NextResponse.json([]);
    }

    const rows = await prisma.pertemuan.findMany({
      where: {
        kelas_id: BigInt(kelasId),
        mapel_id: BigInt(mapelId),
      },
      select: {
        id: true,
        kelas_id: true,
        mapel_id: true,
        pertemuan_ke: true,
        judul: true,
      },
      orderBy: [{ pertemuan_ke: "asc" }],
    });

    return NextResponse.json(
      rows.map((p) => ({
        id: p.id.toString(),
        kelasId: p.kelas_id.toString(),
        mapelId: p.mapel_id.toString(),
        pertemuanKe: p.pertemuan_ke,
        judul: p.judul,
      }))
    );
  } catch (error) {
    console.error("Error fetching pertemuan options:", error);
    return NextResponse.json([], { status: 200 });
  }
}

