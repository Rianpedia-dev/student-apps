import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { SystemSettingService } from "@/services/system-setting.service";
import { DemoDataService } from "@/services/demo-data.service";
import type { AdminUserItem } from "./_components/admin-table";
import { ManageAdminsView } from "./_components/manage-admins-view";

export const metadata = {
  title: "Kelola Administrator • Student Apps Al-Azhar",
  description: "Manajemen hak akses dan akun administrator SD, SMP, dan Super Admin.",
};

export default async function ManageAdminsPage() {
  let session;
  try {
    session = await requireSuperAdmin();
  } catch {
    // Jika bukan super admin, redirect ke dashboard admin
    redirect("/admin");
  }

  const [rawAdmins, isDemoEnabled, demoStats] = await Promise.all([
    prisma.user.findMany({
      where: { status: "3" },
      select: {
        id: true,
        name: true,
        email: true,
        jenjang: true,
        gender: true,
        created_at: true,
      },
      orderBy: [
        { jenjang: "asc" },
        { name: "asc" },
      ],
    }),
    SystemSettingService.isDemoModeEnabled(),
    DemoDataService.getDemoDataStats(),
  ]);

  const admins: AdminUserItem[] = rawAdmins.map((a) => ({
    id: a.id.toString(),
    name: a.name,
    email: a.email,
    jenjang: (a.jenjang as "SD" | "SMP" | "ALL") || "ALL",
    gender: a.gender,
    created_at: a.created_at ? a.created_at.toISOString() : null,
  }));

  return (
    <ManageAdminsView
      admins={admins}
      currentUserId={session.id}
      isDemoEnabled={isDemoEnabled}
      demoStats={demoStats}
    />
  );
}
