import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { GuruProfileForm } from "@/components/features/profile/guru-profile-form";
import { ProfileLanyardBadge } from "@/components/features/profile/profile-lanyard-badge";

export const dynamic = "force-dynamic";

export default async function GuruProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  let teacher: any = null;

  try {
    const isNum = /^\d+$/.test(session.id);
    const dbTeacher = isNum
      ? await prisma.user.findUnique({
          where: { id: BigInt(session.id) },
        })
      : null;
    teacher = dbTeacher;
  } catch (e) {
    console.error("Database query error in guru profile:", e);
  }

  if (!teacher) {
    teacher = {
      id: session.id,
      name: session.name || "Guru",
      email: session.email || "",
      nip: session.nip || "",
      guru_bidang: "",
      kelas: session.kelas || null,
      status: session.status || "2",
      address: "",
      image: session.image || null,
    };
  }

  const formattedTeacher = {
    id: teacher.id ? teacher.id.toString() : session.id,
    name: teacher.name || "",
    email: teacher.email || "",
    nip: teacher.nip || null,
    status: teacher.status || session.status || "2",
    guru_bidang: teacher.guru_bidang || null,
    kelas: teacher.kelas || null,
    address: teacher.address || null,
    gender: teacher.gender || (session as any).gender || null,
    image: teacher.image || null,
    appleid: teacher.appleid || null,
  };

  return (
    <div className="relative space-y-6 max-w-7xl mx-auto">

      <div className="relative">
        {/* Grid Konten: Form Guru di Kiri, Kolom Ruang ID Card di Kanan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Profil di Kiri (7 Kolom di Desktop) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6">
            <Card className="shadow-2xl overflow-hidden rounded-3xl card-elevation">
              <GuruProfileForm teacher={formattedTeacher} />
            </Card>
          </div>

          {/* Spacer Kolom Kanan di Desktop agar layout proporsional */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-5 h-[680px] pointer-events-none" />
        </div>

        {/* Lanyard Badge Desktop: Menjangkau dari margin atas (-top-24) dan radius seluas halaman */}
        <div className="hidden lg:block pointer-events-none absolute inset-x-0 -top-24 h-[760px] overflow-visible z-20">
          <ProfileLanyardBadge
            user={{
              id: formattedTeacher.id,
              name: formattedTeacher.name,
              email: formattedTeacher.email,
              nip: formattedTeacher.nip,
              guru_bidang: formattedTeacher.guru_bidang,
              kelas: formattedTeacher.kelas,
              gender: formattedTeacher.gender,
              image: formattedTeacher.image,
              address: formattedTeacher.address,
              role: "guru",
            }}
            anchorRatio={0.79}
            buckleY={175}
            height="760px"
          />
        </div>

        {/* Lanyard Badge Mobile: Tampil di bawah form secara natural */}
        <div className="lg:hidden mt-8 flex justify-center w-full">
          <ProfileLanyardBadge
            user={{
              id: formattedTeacher.id,
              name: formattedTeacher.name,
              email: formattedTeacher.email,
              nip: formattedTeacher.nip,
              guru_bidang: formattedTeacher.guru_bidang,
              kelas: formattedTeacher.kelas,
              gender: formattedTeacher.gender,
              image: formattedTeacher.image,
              address: formattedTeacher.address,
              role: "guru",
            }}
            anchorRatio={0.5}
            buckleY={110}
            height="550px"
          />
        </div>
      </div>
    </div>
  );
}
