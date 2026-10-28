import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseViolationKeterangan } from "@/lib/constants/violations";
import { DisciplineSummaryCard } from "./_components/discipline-summary-card";
import { StudentViolationsClient } from "./_components/student-violations-client";
import type { ViolationItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function SiswaViolationsPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  let dbViolations: any[] = [];
  let studentUser: {
    name: string;
    point: string | null;
    nis: string | null;
    kelas: string | null;
    image: string | null;
    gender: string | null;
  } | null = null;

  try {
    const isNum = /^\d+$/.test(session.id);
    const [violationsData, userData] = await Promise.all([
      prisma.pelanggaran.findMany({
        where: {
          OR: [
            { user_id: session.id },
            ...(session.name ? [{ nama: session.name }] : []),
          ],
        },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
      }),
      isNum
        ? prisma.user.findUnique({
            where: { id: BigInt(session.id) },
            select: {
              name: true,
              point: true,
              nis: true,
              kelas: true,
              image: true,
              gender: true,
            },
          })
        : null,
    ]);

    dbViolations = violationsData;
    studentUser = userData;
  } catch (e) {
    console.warn("DB error in violations, returning empty list:", e);
  }

  // Parse all violations
  let totalDeductedPoints = 0;

  const violations: ViolationItem[] = dbViolations.map((vl) => {
    const parsed = parseViolationKeterangan(vl.keterangan);
    totalDeductedPoints += parsed.points;

    return {
      id: vl.id.toString(),
      user_id: vl.user_id,
      nama: vl.nama || studentUser?.name || "Siswa",
      kelas: vl.kelas || studentUser?.kelas || "",
      kategori: vl.kategori || "Pelanggaran Umum",
      keterangan: vl.keterangan,
      created_at: vl.created_at,
      status: parsed.status,
      severity: parsed.severity,
      points: parsed.points,
      cleanKeterangan: parsed.cleanKeterangan,
      tindakan: parsed.tindakan,
    };
  });

  // Base score 100
  const score = Math.max(0, 100 - totalDeductedPoints);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto w-full px-1 sm:px-2 md:px-0">
      {/* 1. Indeks Skor Disiplin, Hero Banner & 4 Stat Cards */}
      <DisciplineSummaryCard
        score={score}
        studentName={studentUser?.name || session.name}
        studentNis={studentUser?.nis || session.nis}
        studentKelas={studentUser?.kelas || session.kelas}
        studentImage={studentUser?.image || session.image}
        studentGender={studentUser?.gender || session.gender}
        totalViolations={violations.length}
        totalDeductedPoints={totalDeductedPoints}
      />

      {/* 2. Interactive Client View: Tabs, Search/Filter, List Catatan & Panduan */}
      <StudentViolationsClient violations={violations} />
    </div>
  );
}
