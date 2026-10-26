"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-guard";

export async function createAdminAction(formData: FormData) {
  try {
    await requireSuperAdmin();

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = (formData.get("password") as string)?.trim();
    const jenjang = (formData.get("jenjang") as string) || "SD"; // SD, SMP, ALL
    const gender = (formData.get("gender") as string) || "L";

    if (!name || !email || !password) {
      return { success: false, error: "Nama, email, dan password wajib diisi." };
    }

    if (!["SD", "SMP", "ALL"].includes(jenjang)) {
      return { success: false, error: "Jenjang admin tidak valid (pilih SD, SMP, atau ALL)." };
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, error: "Email sudah terdaftar dalam sistem." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        password1: password,
        status: "3", // Admin
        jenjang,
        gender,
        notes: jenjang === "ALL" ? "Super Administrator" : `Admin Jenjang ${jenjang}`,
      },
    });

    revalidatePath("/admin/manage-admins");
    return { success: true, message: `Admin ${name} (${jenjang}) berhasil ditambahkan.` };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal membuat akun admin." };
  }
}

export async function updateAdminAction(formData: FormData) {
  try {
    await requireSuperAdmin();

    const idStr = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = (formData.get("password") as string)?.trim();
    const jenjang = (formData.get("jenjang") as string) || "SD";
    const gender = (formData.get("gender") as string) || "L";

    if (!idStr || !name || !email) {
      return { success: false, error: "ID, nama, dan email wajib diisi." };
    }

    const id = BigInt(idStr);

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing || existing.status !== "3") {
      return { success: false, error: "Akun admin tidak ditemukan." };
    }

    // Cek jika email diganti dan bentrok dengan email lain
    if (email !== existing.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email },
      });
      if (emailConflict) {
        return { success: false, error: "Email baru sudah digunakan oleh akun lain." };
      }
    }

    const updateData: any = {
      name,
      email,
      jenjang,
      gender,
      notes: jenjang === "ALL" ? "Super Administrator" : `Admin Jenjang ${jenjang}`,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
      updateData.password1 = password;
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/manage-admins");
    return { success: true, message: `Data admin ${name} berhasil diperbarui.` };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui admin." };
  }
}

export async function deleteAdminAction(formData: FormData) {
  try {
    const session = await requireSuperAdmin();

    const idStr = formData.get("id") as string;
    if (!idStr) {
      return { success: false, error: "ID admin wajib disertakan." };
    }

    const id = BigInt(idStr);

    // Proteksi: Tidak bisa menghapus akun sendiri
    if (session.id === idStr) {
      return { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri." };
    }

    const targetAdmin = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetAdmin || targetAdmin.status !== "3") {
      return { success: false, error: "Akun admin tidak ditemukan." };
    }

    // Proteksi: Jangan biarkan Super Admin terakhir terhapus
    if (targetAdmin.jenjang === "ALL") {
      const superAdminCount = await prisma.user.count({
        where: { status: "3", jenjang: "ALL" },
      });
      if (superAdminCount <= 1) {
        return {
          success: false,
          error: "Tidak dapat menghapus Super Admin terakhir dalam sistem.",
        };
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/admin/manage-admins");
    return { success: true, message: `Akun admin ${targetAdmin.name} berhasil dihapus.` };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menghapus admin." };
  }
}
