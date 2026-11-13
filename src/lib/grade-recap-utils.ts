export const GRADE_RECAP_KKM = 75;

export interface RawRecapStudentInput {
  id: string;
  name: string;
  nis: string | null;
  gender: string | null;
}

export interface RawRecapSubmissionInput {
  siswaId: string;
  status: string;
  nilai: number | null;
  submittedAt: string | null;
}

export interface RawRecapTaskInput {
  id: string;
  judul: string;
  tipePengerjaan: string;
  pertemuanKe: number | null;
  pertemuanJudul: string | null;
  deadline: string;
  createdAt: string | null;
  poinMaksimal: number;
  submissions: RawRecapSubmissionInput[];
}

export interface MapelGradeRecapMeta {
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  kelasId: string;
  kelasNama: string;
  jenjang: string;
  guruNama: string;
  generatedAt: string;
}

export interface MapelGradeRecapTask {
  id: string;
  code: string;
  judul: string;
  tipePengerjaan: string;
  pertemuanKe: number | null;
  pertemuanJudul: string | null;
  deadline: string;
  poinMaksimal: number;
  totalSubmitted: number;
  totalGraded: number;
  avgScore: number | null;
}

export interface StudentTaskCell {
  rawScore: number | null;
  normalizedScore: number | null;
  status: string;
}

export type StudentKkmStatus = "tuntas" | "belum_tuntas" | "belum_ada_nilai";

export interface MapelGradeRecapStudentRow {
  siswaId: string;
  nis: string | null;
  name: string;
  gender: string | null;
  scoresByTaskId: Record<string, StudentTaskCell>;
  gradedCount: number;
  totalTasks: number;
  averageScore: number | null;
  kkmStatus: StudentKkmStatus;
}

export interface MapelGradeRecapSummary {
  totalStudents: number;
  totalTasks: number;
  studentsWithGrades: number;
  classAverage: number | null;
  highestAverage: number | null;
  lowestAverage: number | null;
  passedCount: number;
  passRatePercent: number | null;
}

export interface MapelGradeRecapPayload {
  meta: MapelGradeRecapMeta;
  tasks: MapelGradeRecapTask[];
  students: MapelGradeRecapStudentRow[];
  summary: MapelGradeRecapSummary;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Mengonversi nilai mentah menjadi skala 0-100 berdasarkan poin maksimal tugas.
 */
export function normalizeScoreTo100(score: number, poinMaksimal: number): number {
  if (!Number.isFinite(poinMaksimal) || poinMaksimal <= 0) {
    return roundOneDecimal(score);
  }
  if (poinMaksimal === 100) {
    return roundOneDecimal(score);
  }
  return roundOneDecimal((score / poinMaksimal) * 100);
}

/**
 * Mengurutkan tugas secara kronologis: Pertemuan (ASC, null di akhir) lalu tanggal dibuat (ASC).
 */
export function sortTasksChronologically<T extends Pick<RawRecapTaskInput, "id" | "pertemuanKe" | "createdAt">>(
  tasks: T[]
): T[] {
  return [...tasks].sort((a, b) => {
    const pA = a.pertemuanKe ?? Number.MAX_SAFE_INTEGER;
    const pB = b.pertemuanKe ?? Number.MAX_SAFE_INTEGER;
    if (pA !== pB) return pA - pB;

    const cA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const cB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (cA !== cB) return cA - cB;

    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

export function formatGradeStatusLabel(status: string): string {
  switch (status) {
    case "sudah_dinilai":
      return "Sudah Dinilai";
    case "menunggu_penilaian":
      return "Menunggu Koreksi";
    case "perlu_revisi":
      return "Perlu Revisi";
    case "terlambat":
      return "Terlambat";
    case "sedang_mengerjakan":
      return "Sedang Mengerjakan";
    case "belum_mengumpulkan":
    default:
      return "Belum Mengumpulkan";
  }
}

export function formatKkmStatusLabel(status: StudentKkmStatus): string {
  switch (status) {
    case "tuntas":
      return "Tuntas";
    case "belum_tuntas":
      return "Belum Tuntas";
    case "belum_ada_nilai":
    default:
      return "-";
  }
}

/**
 * Menyusun matriks rekap nilai siswa x semua tugas beserta statistik kelas.
 */
export function buildMapelGradeRecapMatrix(params: {
  meta: MapelGradeRecapMeta;
  students: RawRecapStudentInput[];
  tasks: RawRecapTaskInput[];
}): MapelGradeRecapPayload {
  const sortedStudents = [...params.students].sort((a, b) =>
    a.name.localeCompare(b.name, "id")
  );
  const sortedTasks = sortTasksChronologically(params.tasks);

  const taskSubMaps = new Map<string, Map<string, RawRecapSubmissionInput>>();
  for (const task of sortedTasks) {
    const map = new Map<string, RawRecapSubmissionInput>();
    for (const sub of task.submissions) {
      map.set(sub.siswaId, sub);
    }
    taskSubMaps.set(task.id, map);
  }

  const formattedTasks: MapelGradeRecapTask[] = sortedTasks.map((task, idx) => {
    const subMap = taskSubMaps.get(task.id)!;
    const studentIds = new Set(sortedStudents.map((s) => s.id));

    let totalSubmitted = 0;
    const gradedRawScores: number[] = [];

    for (const [siswaId, sub] of subMap.entries()) {
      if (!studentIds.has(siswaId)) continue;
      if (sub.status !== "sedang_mengerjakan" && sub.status !== "belum_mengumpulkan") {
        totalSubmitted++;
      }
      if (sub.status === "sudah_dinilai" && typeof sub.nilai === "number" && Number.isFinite(sub.nilai)) {
        gradedRawScores.push(sub.nilai);
      }
    }

    const avgScore =
      gradedRawScores.length > 0
        ? roundOneDecimal(gradedRawScores.reduce((acc, v) => acc + v, 0) / gradedRawScores.length)
        : null;

    return {
      id: task.id,
      code: `T${idx + 1}`,
      judul: task.judul,
      tipePengerjaan: task.tipePengerjaan,
      pertemuanKe: task.pertemuanKe,
      pertemuanJudul: task.pertemuanJudul,
      deadline: task.deadline,
      poinMaksimal: task.poinMaksimal,
      totalSubmitted,
      totalGraded: gradedRawScores.length,
      avgScore,
    };
  });

  const studentRows: MapelGradeRecapStudentRow[] = sortedStudents.map((student) => {
    const scoresByTaskId: Record<string, StudentTaskCell> = {};
    const normalizedScores: number[] = [];

    for (const task of sortedTasks) {
      const sub = taskSubMaps.get(task.id)?.get(student.id);
      if (!sub) {
        scoresByTaskId[task.id] = {
          rawScore: null,
          normalizedScore: null,
          status: "belum_mengumpulkan",
        };
        continue;
      }

      const isGraded =
        sub.status === "sudah_dinilai" &&
        typeof sub.nilai === "number" &&
        Number.isFinite(sub.nilai);

      const rawScore = isGraded ? sub.nilai : null;
      const normalizedScore =
        rawScore !== null ? normalizeScoreTo100(rawScore, task.poinMaksimal) : null;

      if (normalizedScore !== null) {
        normalizedScores.push(normalizedScore);
      }

      scoresByTaskId[task.id] = {
        rawScore,
        normalizedScore,
        status: sub.status,
      };
    }

    const gradedCount = normalizedScores.length;
    const averageScore =
      gradedCount > 0
        ? roundOneDecimal(normalizedScores.reduce((acc, v) => acc + v, 0) / gradedCount)
        : null;

    const kkmStatus: StudentKkmStatus =
      averageScore === null
        ? "belum_ada_nilai"
        : averageScore >= GRADE_RECAP_KKM
        ? "tuntas"
        : "belum_tuntas";

    return {
      siswaId: student.id,
      nis: student.nis,
      name: student.name,
      gender: student.gender,
      scoresByTaskId,
      gradedCount,
      totalTasks: sortedTasks.length,
      averageScore,
      kkmStatus,
    };
  });

  const validAverages = studentRows
    .map((r) => r.averageScore)
    .filter((v): v is number => v !== null);

  const passedCount = studentRows.filter((r) => r.kkmStatus === "tuntas").length;
  const studentsWithGrades = validAverages.length;

  const summary: MapelGradeRecapSummary = {
    totalStudents: studentRows.length,
    totalTasks: formattedTasks.length,
    studentsWithGrades,
    classAverage:
      studentsWithGrades > 0
        ? roundOneDecimal(validAverages.reduce((acc, v) => acc + v, 0) / studentsWithGrades)
        : null,
    highestAverage: studentsWithGrades > 0 ? Math.max(...validAverages) : null,
    lowestAverage: studentsWithGrades > 0 ? Math.min(...validAverages) : null,
    passedCount,
    passRatePercent:
      studentsWithGrades > 0 ? Math.round((passedCount / studentsWithGrades) * 100) : null,
  };

  return {
    meta: params.meta,
    tasks: formattedTasks,
    students: studentRows,
    summary,
  };
}

