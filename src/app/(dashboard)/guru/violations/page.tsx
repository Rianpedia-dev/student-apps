import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { parseViolationKeterangan } from "@/lib/constants/violations";
import { AddViolationModal } from "./_components/add-violation-modal";
import { ViolationsClientView } from "./_components/violations-client-view";
import type { ViolationItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function GuruViolationsPage() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const guruClass = session.kelas || "";

  interface StudentDbRecord {
    id: bigint;
    name: string;
    nis: string | null;
    kelas: string | null;
    image: string | null;
    gender: string | null;
  }

  let students: StudentDbRecord[] = [];
  let violations: ViolationItem[] = [];

  try {
    const [dbStudents, dbPelanggaran] = await Promise.all([
      prisma.user.findMany({
        where: { status: "1" },
        select: { id: true, name: true, nis: true, kelas: true, image: true, gender: true },
        orderBy: [{ kelas: "asc" }, { name: "asc" }],
      }),
      prisma.pelanggaran.findMany({
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
      }),
    ]);

    students = dbStudents;

    // Fetch student profile avatars & gender for matched users
    const userIds = dbPelanggaran
      .map((p) => {
        try {
          const n = BigInt(p.user_id);
          return n > BigInt(0) ? n : null;
        } catch {
          return null;
        }
      })
      .filter((id): id is bigint => id !== null);

    const studentNames = dbPelanggaran.map((p) => p.nama).filter(Boolean) as string[];

    const matchedUsers = await prisma.user.findMany({
      where: {
        OR: [
          ...(userIds.length > 0 ? [{ id: { in: userIds } }] : []),
          ...(studentNames.length > 0 ? [{ name: { in: studentNames } }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        gender: true,
        image: true,
      },
    });

    const userById = new Map<string, (typeof matchedUsers)[0]>();
    const userByName = new Map<string, (typeof matchedUsers)[0]>();
    for (const u of matchedUsers) {
      userById.set(u.id.toString(), u);
      userByName.set(u.name.trim().toLowerCase(), u);
    }

    // Process & Parse Violations
    violations = dbPelanggaran.map((p) => {
      const studentUser = userById.get(p.user_id) || userByName.get((p.nama || "").trim().toLowerCase());
      const parsed = parseViolationKeterangan(p.keterangan);

      return {
        id: p.id.toString(),
        user_id: p.user_id,
        nama: p.nama || studentUser?.name || "Siswa",
        kelas: p.kelas || "",
        kategori: p.kategori || "Pelanggaran Umum",
        keterangan: p.keterangan,
        created_at: p.created_at,
        // Parsed properties
        status: parsed.status,
        severity: parsed.severity,
        points: parsed.points,
        cleanKeterangan: parsed.cleanKeterangan,
        tindakan: parsed.tindakan,
        studentImage: studentUser?.image || null,
        studentGender: studentUser?.gender || null,
      };
    });
  } catch (e) {
    console.error("Database query error in violations:", e);
  }

  const serializableStudents = students.map((s) => ({
    id: s.id.toString(),
    name: s.name,
    nis: s.nis || "",
    kelas: s.kelas,
    image: s.image,
    gender: s.gender,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kedisiplinan & Bimbingan Siswa</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Buku catatan tata tertib, muhasabah adab, dan rekam jejak pembinaan siswa Al-Azhar Cairo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="rose" size="sm" className="hidden sm:inline-flex">
            {violations.length} Catatan Terdata
          </Badge>
          <AddViolationModal students={serializableStudents} guruClass={guruClass} />
        </div>
      </div>

      {/* Main Client View */}
      <ViolationsClientView
        initialViolations={violations}
        students={serializableStudents}
        guruClass={guruClass}
      />
    </div>
  );
}
