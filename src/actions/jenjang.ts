"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { JENJANG_COOKIE_NAME, type JenjangType } from "@/lib/jenjang";

export async function switchJenjangAction(targetJenjang: JenjangType) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Sesi tidak ditemukan." };
    }

    // Hanya pengguna dengan otoritas "ALL" (Super Admin atau Guru Lintas Jenjang)
    // yang diperbolehkan beralih jenjang tampilan
    if (session.jenjang !== "ALL" && session.role !== "admin") {
      return {
        success: false,
        error: "Akun Anda terikat pada satu jenjang spesifik dan tidak dapat beralih.",
      };
    }

    if (!["SD", "SMP", "ALL"].includes(targetJenjang)) {
      return { success: false, error: "Jenjang tidak valid." };
    }

    const cookieStore = await cookies();
    cookieStore.set(JENJANG_COOKIE_NAME, targetJenjang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 hari
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Revalidate dashboard routes
    revalidatePath("/guru");
    revalidatePath("/admin");

    return {
      success: true,
      activeJenjang: targetJenjang,
      message: `Tampilan berhasil dialihkan ke ${
        targetJenjang === "ALL" ? "Semua Jenjang" : `Jenjang ${targetJenjang}`
      }.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengubah jenjang aktif." };
  }
}
