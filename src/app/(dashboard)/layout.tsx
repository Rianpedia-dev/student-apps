import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { getUserProfileImage } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  let userImage = session.image;
  let userName = session.name;
  let userGender = session.gender;
  let userStatus = session.status;
  let userKelas = session.kelas;

  try {
    if (/^\d+$/.test(session.id)) {
      const dbUser = await prisma.user.findUnique({
        where: { id: BigInt(session.id) },
        select: { image: true, name: true, gender: true, status: true, kelas: true },
      });
      if (dbUser) {
        userImage = dbUser.image;
        userName = dbUser.name || userName;
        userGender = dbUser.gender || userGender;
        userStatus = dbUser.status || userStatus;
        userKelas = dbUser.kelas || userKelas;
      }
    }
  } catch (e) {
    console.error("DashboardLayout user query error:", e);
  }

  // Akun berstatus 0 (belum diverifikasi admin) dilarang mengakses dashboard
  if (userStatus === "0" || session.status === "0") {
    redirect("/login");
  }

  const finalUserImage = getUserProfileImage(userImage, userGender);

  return (
    <DashboardShell
      role={session.role}
      userName={userName}
      userEmail={session.email}
      kelas={userKelas}
      status={userStatus}
      userImage={finalUserImage}
    >
      {children}
    </DashboardShell>
  );
}
