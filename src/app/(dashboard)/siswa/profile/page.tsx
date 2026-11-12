import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { SiswaProfileForm } from "@/components/features/profile/siswa-profile-form";
import { ProfileLanyardBadge } from "@/components/features/profile/profile-lanyard-badge";

export const dynamic = "force-dynamic";

export default async function SiswaProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  let student: any = null;

  try {
    const isNum = /^\d+$/.test(session.id);
    const dbStudent = isNum
      ? await prisma.user.findUnique({
          where: { id: BigInt(session.id) },
        })
      : null;
    student = dbStudent;
  } catch (e) {
    console.error("Database query error in siswa profile:", e);
  }

  if (!student) {
    student = {
      id: session.id,
      name: session.name || "Siswa",
      email: session.email || "",
      nis: session.nis || "-",
      kelas: session.kelas || "-",
      gender: null,
      status: session.status || "1",
      point: "0",
      address: "",
      skills: "",
      notes: "",
      image: session.image || null,
    };
  }

  const formattedStudent = {
    id: student.id ? student.id.toString() : session.id,
    name: student.name || "",
    email: student.email || "",
    nis: student.nis || null,
    kelas: student.kelas || null,
    gender: student.gender || null,
    address: student.address || null,
    skills: student.skills || null,
    notes: student.notes || null,
    image: student.image || null,
  };

  return (
    <div className="relative space-y-6 max-w-7xl mx-auto">

      <div className="relative">
        {/* Grid Konten: Form di Kiri, Kolom Ruang ID Card di Kanan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Profil di Kiri (7 Kolom di Desktop) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6">
            <Card className="shadow-2xl overflow-hidden rounded-3xl card-elevation">
              <SiswaProfileForm student={formattedStudent} />
            </Card>
          </div>

          {/* Spacer Kolom Kanan di Desktop agar layout proporsional */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-5 h-[680px] pointer-events-none" />
        </div>

        {/* Lanyard Badge Desktop: Menjangkau dari margin atas (-top-24) dan radius seluas halaman */}
        <div className="hidden lg:block pointer-events-none absolute inset-x-0 -top-24 h-[760px] overflow-visible z-20">
          <ProfileLanyardBadge
            user={{
              id: formattedStudent.id,
              name: formattedStudent.name,
              email: formattedStudent.email,
              nis: formattedStudent.nis,
              kelas: formattedStudent.kelas,
              gender: formattedStudent.gender,
              image: formattedStudent.image,
              address: formattedStudent.address,
              role: "siswa",
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
              id: formattedStudent.id,
              name: formattedStudent.name,
              email: formattedStudent.email,
              nis: formattedStudent.nis,
              kelas: formattedStudent.kelas,
              gender: formattedStudent.gender,
              image: formattedStudent.image,
              address: formattedStudent.address,
              role: "siswa",
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
