/**
 * Modular Database Seeds for Al-Azhar Student App
 * Ekspor seed individual untuk kebutuhan pengujian & seeding spesifik
 */

export const SEED_MODULES = [
  { name: "Master Seed", path: "prisma/seed.ts" },
  { name: "Tugas Interaktif", path: "prisma/seeds/seed_tugas.ts" },
  { name: "Tugas Interaktif In-App", path: "prisma/seeds/seed_tugas_interaktif.ts" },
  { name: "Pertemuan & KBM", path: "prisma/seeds/seed_pertemuan.ts" },
  { name: "Prestasi Siswa", path: "prisma/seeds/seed_prestasi.ts" },
];
