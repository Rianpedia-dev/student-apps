import prisma from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import {
  calculateAchievementPoints,
  isSameRombel,
  isAchievementFromPreviousClass,
} from "@/lib/achievement-points";

export interface AchievementItemDTO {
  id: string;
  id_user: string;
  nama: string;
  kelas: string;
  kelas_saat_prestasi: string;
  tahun_ajaran: string;
  tingkat: string;
  peringkat: string;
  poin: number;
  fotoanak: string;
  prestasi: string;
  jenjang: string;
  tanggal_prestasi: string | null;
  created_at: string | null;
  studentImage: string | null;
  studentGender: string | null;
  studentNis: string | null;
}

export interface StudentLeaderboardEntry {
  userId: string;
  rank: number;
  userName: string;
  kelas: string;
  avatarUrl: string | null;
  gender: string | null;
  totalPoints: number;
  totalAchievements: number;
  medals: {
    internasional: number;
    nasional: number;
    daerah: number;
    sekolah: number;
    juara1: number;
    juara2: number;
    juara3: number;
    harapan: number;
  };
  highlightPrestasi: string;
}

export interface BestStudentSliderItem {
  userId: string;
  userName: string;
  kelas: string;
  jenjang: string;
  avatarUrl: string | null;
  gender: string | null;
  totalPoints: number;
  totalAchievements: number;
  topAchievement: string;
  topTingkat: string;
  topPeringkat: string;
  rank?: number;
}

export interface TargetAchievementContext {
  id?: string;
  kelas?: string | null;
  jenjang?: string | null;
  kelas_saat_prestasi?: string | null;
}

export class AchievementService {
  /**
   * Otorisasi ketat untuk input, update, dan delete prestasi:
   * 1. Super Admin: Boleh semua siswa (SD & SMP) dan seluruh catatan historis.
   * 2. Admin Jenjang: Hanya boleh siswa pada jenjang yang sama (termasuk catatan historis jenjangnya).
   * 3. Wali Kelas (status === "4"):
   *    - CREATE: HANYA untuk siswa di kelas binaan aktifnya.
   *    - UPDATE / DELETE: HANYA untuk prestasi yang diraih di kelas binaannya saat ini.
   *      DILARANG MENGUBAH/MENGHAPUS PRESTASI KELAS SEBELUMNYA ATAU KELAS LAIN.
   * 4. Guru Biasa (status === "2") & Siswa: DILAYANGI / DITOLAK.
   */
  static verifyManagePermission(
    user: SessionUser,
    targetContext?: TargetAchievementContext,
    action: "CREATE" | "UPDATE" | "DELETE" = "CREATE"
  ) {
    if (!user) {
      throw new Error("Unauthorized: Silakan masuk ke akun Anda terlebih dahulu.");
    }

    // 1. Super Admin (Akses Penuh)
    if (user.role === "admin" && (user.jenjang === "ALL" || !user.jenjang)) {
      return { authorized: true, roleType: "SUPER_ADMIN" as const };
    }

    // 2. Admin Jenjang (SD atau SMP)
    if (user.role === "admin") {
      if (targetContext?.jenjang && targetContext.jenjang !== user.jenjang) {
        throw new Error(
          `Akses ditolak: Admin jenjang ${user.jenjang} hanya dapat mengelola prestasi siswa ${user.jenjang}.`
        );
      }
      return { authorized: true, roleType: "ADMIN_JENJANG" as const };
    }

    // 3. Wali Kelas (status === "4")
    if (user.role === "guru" && user.status === "4") {
      const userClass = user.kelas || "";

      // Aturan A: Siswa harus terdaftar di rombel binaan aktif wali kelas
      if (
        targetContext?.kelas &&
        userClass &&
        !isSameRombel(userClass, targetContext.kelas)
      ) {
        throw new Error(
          `Akses ditolak: Anda hanya berwenang mengelola prestasi untuk siswa kelas binaan Anda (${user.kelas}).`
        );
      }

      // Aturan B: Khusus UPDATE & DELETE, prestasi tidak boleh berasal dari kelas sebelumnya
      if (action === "UPDATE" || action === "DELETE") {
        const isPrevious = isAchievementFromPreviousClass(
          userClass,
          targetContext?.kelas_saat_prestasi,
          targetContext?.kelas
        );

        if (isPrevious) {
          throw new Error(
            `Akses ditolak: Prestasi ini diraih saat siswa duduk di ${
              targetContext?.kelas_saat_prestasi || "kelas sebelumnya"
            }. Wali kelas saat ini tidak dapat mengubah atau menghapus catatan historis kelas sebelumnya.`
          );
        }
      }

      return { authorized: true, roleType: "WALI_KELAS" as const };
    }

    // Guru Mapel biasa (status === "2") atau Siswa (role === "siswa")
    throw new Error(
      "Akses ditolak: Hak input dan kelola prestasi hanya diberikan kepada Super Admin, Admin Jenjang, dan Wali Kelas."
    );
  }

  /**
   * Mengambil daftar seluruh prestasi dengan data profil siswa
   */
  static async getAchievements(params?: {
    jenjang?: string;
    kelas?: string;
    search?: string;
  }): Promise<AchievementItemDTO[]> {
    const whereClause: any = {};

    if (params?.jenjang && params.jenjang !== "ALL") {
      whereClause.jenjang = params.jenjang;
    }

    if (params?.kelas && params.kelas !== "ALL") {
      whereClause.kelas = params.kelas;
    }

    if (params?.search && params.search.trim() !== "") {
      const q = params.search.trim();
      whereClause.OR = [
        { nama: { contains: q } },
        { prestasi: { contains: q } },
        { kelas: { contains: q } },
      ];
    }

    const records = await prisma.prestasi.findMany({
      where: whereClause,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
    });

    // Lookup user detail untuk foto profil & gender
    const userIds = records
      .map((r) => {
        try {
          const n = BigInt(r.id_user);
          return n > BigInt(0) ? n : null;
        } catch {
          return null;
        }
      })
      .filter((id): id is bigint => id !== null);

    const names = records.map((r) => r.nama).filter(Boolean);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          ...(userIds.length > 0 ? [{ id: { in: userIds } }] : []),
          ...(names.length > 0 ? [{ name: { in: names } }] : []),
        ],
      },
      select: { id: true, name: true, image: true, gender: true, nis: true },
    });

    const userById = new Map<string, (typeof users)[0]>();
    const userByName = new Map<string, (typeof users)[0]>();
    for (const u of users) {
      userById.set(u.id.toString(), u);
      userByName.set(u.name.trim().toLowerCase(), u);
    }

    return records.map((r) => {
      const student = userById.get(r.id_user) || userByName.get(r.nama.trim().toLowerCase());
      return {
        id: r.id.toString(),
        id_user: r.id_user,
        nama: r.nama,
        kelas: r.kelas,
        kelas_saat_prestasi: r.kelas_saat_prestasi || r.kelas,
        tahun_ajaran: r.tahun_ajaran || "2025/2026",
        tingkat: r.tingkat || "Dalam Sekolah",
        peringkat: r.peringkat || "Juara 1",
        poin: r.poin ?? calculateAchievementPoints(r.tingkat || "", r.peringkat || ""),
        fotoanak: r.fotoanak,
        prestasi: r.prestasi,
        jenjang: r.jenjang || "SD",
        tanggal_prestasi: r.tanggal_prestasi ? r.tanggal_prestasi.toISOString() : null,
        created_at: r.created_at ? r.created_at.toISOString() : null,
        studentImage: student?.image || null,
        studentGender: student?.gender || null,
        studentNis: student?.nis || null,
      };
    });
  }

  /**
   * Menghasilkan Agregat Papan Peringkat (Leaderboard) berdasarkan total poin
   */
  static async getLeaderboard(params?: {
    jenjang?: string;
    kelas?: string;
  }): Promise<{
    entries: StudentLeaderboardEntry[];
    podiumRankings: {
      userId: string;
      userName: string;
      rank: number;
      value: number;
      avatarUrl?: string | null;
      gender?: string | null;
      byline?: string;
    }[];
    rankings: {
      userId: string;
      rank: number;
      userName: string;
      byline?: string;
      value: number | string;
      avatarUrl?: string | null;
      gender?: string | null;
      displayed: boolean;
    }[];
  }> {
    const whereClause: any = {};
    if (params?.jenjang && params.jenjang !== "ALL") {
      whereClause.jenjang = params.jenjang;
    }
    if (params?.kelas && params.kelas !== "ALL" && params.kelas !== "all-school") {
      whereClause.kelas = params.kelas;
    }

    const records = await prisma.prestasi.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
    });

    if (records.length === 0) {
      return { entries: [], podiumRankings: [], rankings: [] };
    }

    // Kelompokkan per siswa (id_user atau nama)
    const grouped = new Map<
      string,
      {
        userId: string;
        nama: string;
        kelas: string;
        jenjang: string;
        totalPoints: number;
        achievements: typeof records;
      }
    >();

    for (const r of records) {
      const key = r.id_user && r.id_user !== "0" ? `id_${r.id_user}` : `name_${r.nama.trim().toLowerCase()}`;
      const existing = grouped.get(key);
      const points = r.poin ?? calculateAchievementPoints(r.tingkat, r.peringkat);

      if (existing) {
        existing.totalPoints += points;
        existing.achievements.push(r);
      } else {
        grouped.set(key, {
          userId: r.id_user,
          nama: r.nama,
          kelas: r.kelas,
          jenjang: r.jenjang || "SD",
          totalPoints: points,
          achievements: [r],
        });
      }
    }

    // Ambil info detail profil siswa
    const userIds = Array.from(grouped.values())
      .map((g) => {
        try {
          const n = BigInt(g.userId);
          return n > BigInt(0) ? n : null;
        } catch {
          return null;
        }
      })
      .filter((id): id is bigint => id !== null);

    const names = Array.from(grouped.values()).map((g) => g.nama);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          ...(userIds.length > 0 ? [{ id: { in: userIds } }] : []),
          ...(names.length > 0 ? [{ name: { in: names } }] : []),
        ],
      },
      select: { id: true, name: true, image: true, gender: true, kelas: true, status: true },
    });

    const userById = new Map<string, (typeof users)[0]>();
    const userByName = new Map<string, (typeof users)[0]>();
    for (const u of users) {
      userById.set(u.id.toString(), u);
      userByName.set(u.name.trim().toLowerCase(), u);
    }

    // Hitung rincian medali dan susun list terurut
    const entries: StudentLeaderboardEntry[] = [];

    for (const item of grouped.values()) {
      const student = userById.get(item.userId) || userByName.get(item.nama.trim().toLowerCase());
      const currentClass = student?.kelas || item.kelas;

      const medals = {
        internasional: 0,
        nasional: 0,
        daerah: 0,
        sekolah: 0,
        juara1: 0,
        juara2: 0,
        juara3: 0,
        harapan: 0,
      };

      for (const ach of item.achievements) {
        if (ach.tingkat === "Internasional") medals.internasional++;
        else if (ach.tingkat === "Nasional") medals.nasional++;
        else if (ach.tingkat === "Daerah/Kota") medals.daerah++;
        else medals.sekolah++;

        if (ach.peringkat === "Juara 1") medals.juara1++;
        else if (ach.peringkat === "Juara 2") medals.juara2++;
        else if (ach.peringkat === "Juara 3") medals.juara3++;
        else medals.harapan++;
      }

      // Cari prestasi tertinggi untuk highlight
      const topAch = item.achievements.reduce((prev, current) => {
        const pCurrent = current.poin ?? calculateAchievementPoints(current.tingkat, current.peringkat);
        const pPrev = prev.poin ?? calculateAchievementPoints(prev.tingkat, prev.peringkat);
        return pCurrent > pPrev ? current : prev;
      }, item.achievements[0]);

      entries.push({
        userId: student?.id ? student.id.toString() : item.userId,
        rank: 0, // diisi setelah sort
        userName: student?.name || item.nama,
        kelas: currentClass,
        avatarUrl: student?.image || null,
        gender: student?.gender || null,
        totalPoints: item.totalPoints,
        totalAchievements: item.achievements.length,
        medals,
        highlightPrestasi: topAch?.prestasi || "",
      });
    }

    // Sort: Total Points tertinggi, lalu jumlah Internasional, Nasional, dll.
    entries.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.medals.internasional !== a.medals.internasional)
        return b.medals.internasional - a.medals.internasional;
      if (b.medals.nasional !== a.medals.nasional) return b.medals.nasional - a.medals.nasional;
      if (b.medals.juara1 !== a.medals.juara1) return b.medals.juara1 - a.medals.juara1;
      return b.totalAchievements - a.totalAchievements;
    });

    // Tetapkan rank angka
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    // Format untuk podium top 3
    const podiumRankings = entries.slice(0, 3).map((e) => ({
      userId: e.userId,
      userName: e.userName,
      rank: e.rank,
      value: e.totalPoints,
      avatarUrl: e.avatarUrl,
      gender: e.gender,
      byline: e.kelas,
    }));

    // Format untuk daftar rankings
    const rankings = entries.map((e) => ({
      userId: e.userId,
      rank: e.rank,
      userName: e.userName,
      byline: `${e.kelas} • ${e.totalAchievements} Prestasi`,
      value: `${e.totalPoints} Poin`,
      avatarUrl: e.avatarUrl,
      gender: e.gender,
      displayed: true,
    }));

    return { entries, podiumRankings, rankings };
  }

  /**
   * Slider 1: Best Student Sekolah (Top peraih poin di jenjang SD / SMP)
   */
  static async getBestStudentSchool(
    jenjang: "SD" | "SMP" | "ALL",
    limit = 8
  ): Promise<BestStudentSliderItem[]> {
    const { entries } = await this.getLeaderboard({ jenjang: jenjang === "ALL" ? undefined : jenjang });
    return entries.slice(0, limit).map((e) => ({
      userId: e.userId,
      userName: e.userName,
      kelas: e.kelas,
      jenjang: /smp|kelas\s*(7|8|9)/i.test(e.kelas) ? "SMP" : "SD",
      avatarUrl: e.avatarUrl,
      gender: e.gender,
      totalPoints: e.totalPoints,
      totalAchievements: e.totalAchievements,
      topAchievement: e.highlightPrestasi,
      topTingkat: e.medals.internasional > 0 ? "Internasional" : e.medals.nasional > 0 ? "Nasional" : "Daerah/Kota",
      topPeringkat: e.medals.juara1 > 0 ? "Juara 1" : "Juara",
      rank: e.rank,
    }));
  }

  /**
   * Slider 2: Best Student Semua Rombel (1 peraih poin tertinggi dari tiap rombel aktif)
   */
  static async getBestStudentPerRombel(
    jenjang: "SD" | "SMP" | "ALL"
  ): Promise<BestStudentSliderItem[]> {
    // 1. Ambil seluruh kelas aktif pada jenjang terkait
    const kelasList = await prisma.kelas.findMany({
      where: jenjang !== "ALL" ? { jenjang } : {},
      orderBy: [{ tingkat: "asc" }, { nama_kelas: "asc" }],
    });

    if (kelasList.length === 0) return [];

    const result: BestStudentSliderItem[] = [];

    // 2. Untuk setiap rombel, cari siswa terbaik berdasarkan poin
    for (const k of kelasList) {
      const { entries } = await this.getLeaderboard({ kelas: k.nama_kelas });
      if (entries.length > 0) {
        const top = entries[0];
        result.push({
          userId: top.userId,
          userName: top.userName,
          kelas: k.nama_kelas,
          jenjang: k.jenjang,
          avatarUrl: top.avatarUrl,
          gender: top.gender,
          totalPoints: top.totalPoints,
          totalAchievements: top.totalAchievements,
          topAchievement: top.highlightPrestasi,
          topTingkat: top.medals.internasional > 0 ? "Internasional" : top.medals.nasional > 0 ? "Nasional" : "Daerah/Kota",
          topPeringkat: top.medals.juara1 > 0 ? "Juara 1" : "Juara",
          rank: 1,
        });
      }
    }

    return result;
  }
}

