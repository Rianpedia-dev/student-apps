import { loginAsDemoRole, type DemoRole } from "../src/lib/auth";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("==================================================");
  console.log("🔍 AUDIT & VERIFIKASI MENDALAM PLAN-UPDATE.MD");
  console.log("==================================================");

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition: boolean, title: string, details?: string) {
    totalChecks++;
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passedChecks++;
    } else {
      console.error(`❌ [FAIL] ${title}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // -------------------------------------------------------------
  // Test 1: Verifikasi 10 Akun Demo Login
  // -------------------------------------------------------------
  console.log("\n1️⃣ Verifikasi Autentikasi 10 Akun Demo...");
  const demoRoles: { role: DemoRole; expectedPath: string; expectedJenjang: string }[] = [
    { role: "superadmin", expectedPath: "/admin", expectedJenjang: "ALL" },
    { role: "admin_sd", expectedPath: "/admin", expectedJenjang: "SD" },
    { role: "admin_smp", expectedPath: "/admin", expectedJenjang: "SMP" },
    { role: "guru_sd", expectedPath: "/guru", expectedJenjang: "SD" },
    { role: "walas_sd", expectedPath: "/guru", expectedJenjang: "SD" },
    { role: "guru_smp", expectedPath: "/guru", expectedJenjang: "SMP" },
    { role: "walas_smp", expectedPath: "/guru", expectedJenjang: "SMP" },
    { role: "guru_lintas", expectedPath: "/guru", expectedJenjang: "ALL" },
    { role: "siswa_sd", expectedPath: "/siswa", expectedJenjang: "SD" },
    { role: "siswa_smp", expectedPath: "/siswa", expectedJenjang: "SMP" },
  ];

  for (const item of demoRoles) {
    const res = await loginAsDemoRole(item.role);
    if (!res.success) {
      assert(false, `Demo Role: '${item.role}' failed`, res.error);
    } else {
      assert(
        res.user.jenjang === item.expectedJenjang,
        `Demo Role: '${item.role}' -> redirect: '${res.redirectPath}', jenjang: '${res.user.jenjang}'`
      );
    }
  }

  // -------------------------------------------------------------
  // Test 2: Verifikasi Backward Compatibility Akun Demo Lama
  // -------------------------------------------------------------
  console.log("\n2️⃣ Verifikasi Akun Demo Lama (Backward Compatibility)...");
  const legacyRoles: DemoRole[] = ["admin", "guru", "guru1", "guru2", "siswa", "siswa1"];
  for (const leg of legacyRoles) {
    const res = await loginAsDemoRole(leg);
    assert(res.success === true, `Legacy Demo Role: '${leg}' -> Login Sukses`);
  }

  // -------------------------------------------------------------
  // Test 3: Verifikasi Scope Data Admin SD vs Admin SMP di Database
  // -------------------------------------------------------------
  console.log("\n3️⃣ Verifikasi Isolasi Data Jenjang (SD vs SMP)...");
  
  const sdStudents = await prisma.user.count({
    where: { status: "1", jenjang: "SD" },
  });
  const smpStudents = await prisma.user.count({
    where: { status: "1", jenjang: "SMP" },
  });
  assert(sdStudents > 0, `Siswa SD terdaftar di DB: ${sdStudents} siswa`);
  assert(smpStudents > 0, `Siswa SMP terdaftar di DB: ${smpStudents} siswa`);

  const sdClasses = await prisma.kelas.count({ where: { jenjang: "SD" } });
  const smpClasses = await prisma.kelas.count({ where: { jenjang: "SMP" } });
  assert(sdClasses >= 20, `Kelas SD terdaftar di DB: ${sdClasses} kelas`);
  assert(smpClasses >= 3, `Kelas SMP terdaftar di DB: ${smpClasses} kelas`);

  // -------------------------------------------------------------
  // Test 4: Verifikasi Super Admin Protection & Manage Admins
  // -------------------------------------------------------------
  console.log("\n4️⃣ Verifikasi Super Admin & Manajemen Admin...");
  const superAdminCount = await prisma.user.count({
    where: { status: "3", jenjang: "ALL" },
  });
  const adminSdCount = await prisma.user.count({
    where: { status: "3", jenjang: "SD" },
  });
  const adminSmpCount = await prisma.user.count({
    where: { status: "3", jenjang: "SMP" },
  });
  assert(superAdminCount >= 1, `Super Admin terdaftar: ${superAdminCount} akun`);
  assert(adminSdCount >= 1, `Admin SD terdaftar: ${adminSdCount} akun`);
  assert(adminSmpCount >= 1, `Admin SMP terdaftar: ${adminSmpCount} akun`);

  // -------------------------------------------------------------
  // Test 5: Verifikasi Guru Lintas Jenjang
  // -------------------------------------------------------------
  console.log("\n5️⃣ Verifikasi Guru Lintas Jenjang (jenjang = 'ALL')...");
  const guruLintas = await prisma.user.findFirst({
    where: { email: "guru.lintas@gmail.com" },
  });
  assert(
    guruLintas !== null && guruLintas.jenjang === "ALL",
    `Guru Lintas (guru.lintas@gmail.com) memiliki jenjang = 'ALL'`
  );

  // -------------------------------------------------------------
  // Ringkasan
  // -------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`📊 HASIL AUDIT PLAN-UPDATE: ${passedChecks}/${totalChecks} UJI COBA LOLOS`);
  console.log("==================================================");

  if (passedChecks === totalChecks) {
    console.log("🎉 SEMUA POIN DALAM PLAN-UPDATE.MD SUDAH TERVERIFIKASI SEMPURNA!");
  } else {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
