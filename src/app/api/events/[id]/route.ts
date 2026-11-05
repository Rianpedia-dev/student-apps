import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "guru")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    const existing = await prisma.event.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return NextResponse.json({ error: "Agenda kegiatan tidak ditemukan" }, { status: 404 });
    }

    // Hak akses: Guru hanya boleh mengedit agenda yang ia buat sendiri
    if (session.role === "guru") {
      const isOwner =
        existing.from === session.name ||
        (session.kelas && existing.from === session.kelas);

      if (!isOwner) {
        return NextResponse.json(
          { error: "Akses ditolak: Anda tidak memiliki hak mengedit agenda resmi sekolah ini" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { title, description, startTime, endTime, color, category, kelas, jenjang } = body;

    const updated = await prisma.event.update({
      where: { id: BigInt(id) },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { deskripsi: description ? description.trim() : null } : {}),
        ...(startTime ? { start: new Date(startTime) } : {}),
        ...(endTime ? { end: new Date(endTime) } : {}),
        ...(color ? { backgroundColor: color } : {}),
        ...(kelas ? { kelas } : (category ? { kelas: category } : {})),
        ...(jenjang && session.role === "admin" ? { jenjang } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Agenda kegiatan berhasil diperbarui",
      event: {
        id: updated.id.toString(),
        title: updated.title,
        description: updated.deskripsi || "",
        startTime: updated.start.toISOString(),
        endTime: (updated.end || updated.start).toISOString(),
        color: updated.backgroundColor || "emerald",
        category: category || "Akademik",
        kelas: updated.kelas,
        jenjang: updated.jenjang,
        from: updated.from,
        canEdit: true,
      },
    });
  } catch (error) {
    console.error("Error updating event in API:", error);
    return NextResponse.json({ error: "Gagal memperbarui agenda kegiatan" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "guru")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    const existing = await prisma.event.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return NextResponse.json({ error: "Agenda kegiatan tidak ditemukan" }, { status: 404 });
    }

    // Hak akses: Guru hanya boleh menghapus agenda yang ia buat sendiri
    if (session.role === "guru") {
      const isOwner =
        existing.from === session.name ||
        (session.kelas && existing.from === session.kelas);

      if (!isOwner) {
        return NextResponse.json(
          { error: "Akses ditolak: Anda tidak memiliki hak menghapus agenda resmi sekolah ini" },
          { status: 403 }
        );
      }
    }

    await prisma.event.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true, message: "Agenda kegiatan berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting event in API:", error);
    return NextResponse.json({ error: "Gagal menghapus agenda kegiatan" }, { status: 500 });
  }
}
