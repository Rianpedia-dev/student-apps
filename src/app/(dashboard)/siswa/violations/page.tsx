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
  let studentUser: { name: string; point: string | null } | null = null;

  try {
    const isNum = /^\d+$/.test(session.id);
    const [violationsData, userData] = await Promise.all([
      prisma.pelanggaran.findMany({
        where: { user_id: session.id },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
      }),
      isNum
        ? prisma.user.findUnique({
            where: { id: BigInt(session.id) },
            select: { name: true, point: true },
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
      kelas: vl.kelas || "",
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
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Buku Kedisiplinan
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Catatan tata tertib dan rekam jejak kedisiplinan siswa.
        </p>
      </div>

      {/* 1. Indeks Skor Disiplin & Karakter */}
      <DisciplineSummaryCard
        score={score}
        studentName={studentUser?.name}
      />

      {/* 2. Interactive Client View List Catatan */}
      <StudentViolationsClient violations={violations} />
    </div>
  );
}
