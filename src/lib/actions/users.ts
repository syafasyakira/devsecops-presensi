"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role, User } from "@/types";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ─── Validation Schemas ────────────────────────────────────────────────────────
const addUserSchema = z.object({
  namaLengkap: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama terlalu panjang")
    .regex(/^[a-zA-Z\s]+$/, "Nama hanya boleh mengandung huruf dan spasi"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username terlalu panjang")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(128, "Password terlalu panjang"),
  role: z.enum(["admin", "user"]),
});

// Schema update: password boleh kosong (artinya tidak diubah)
const updateUserSchema = z.object({
  namaLengkap: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z\s]+$/)
    .optional(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  password: z
    .string()
    .max(128)
    .refine(
      (val) => val === "" || (val.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val)),
      { message: "Password baru harus min. 8 karakter dengan huruf besar, kecil, dan angka" }
    )
    .optional(),
  role: z.enum(["admin", "user"]).optional(),
  hari: z.string().max(20).optional(),
});

const idSchema = z.string().cuid("ID tidak valid");

// ─── AMBIL SEMUA USER ──────────────────────────────────────────────────────────
export async function getAllUsersAction(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      // ⚠️  KEAMANAN: JANGAN kembalikan field password ke client
      select: {
        id: true,
        namaLengkap: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return users.map((user: { id: string; namaLengkap: string; username: string; email: string | null; role: Role; createdAt: Date }) => ({
      id: user.id,
      namaLengkap: user.namaLengkap,
      username: user.username,
      email: user.email ?? undefined,
      role: user.role as Role,
      createdAt: user.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error Database:", error);
    throw new Error("Gagal mengambil data user");
  }
}

// ─── TAMBAH USER BARU ──────────────────────────────────────────────────────────
export async function addUserAction(data: {
  namaLengkap: string;
  username: string;
  password: string;
  role: Role;
}) {
  // Validasi input sebelum menyentuh database
  const parsed = addUserSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { namaLengkap, username, password, role } = parsed.data;

  try {
    // Hash password dengan salt rounds 12
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        namaLengkap,
        username,
        password: hashedPassword,
        role,
        // hari tidak diisi saat create — diisi lewat fitur edit setelah user dibuat
      },
      select: { id: true, namaLengkap: true, username: true, role: true },
    });

    revalidatePath("/admin/kelola-user");
    revalidatePath("/admin/dashboard");
    return user;
  } catch (error: any) {
    // Kode P2002 = unique constraint violation (username sudah ada)
    if (error.code === "P2002") {
      throw new Error("Username sudah digunakan. Coba username lain.");
    }
    console.error(error);
    throw new Error("Gagal menambah user.");
  }
}

// ─── UPDATE USER ───────────────────────────────────────────────────────────────
// ⚠️  KEAMANAN: Parameter 'id' dan 'data' sekarang divalidasi dengan Zod
// Sebelumnya memakai 'data: any' yang membuka celah mass assignment
export async function updateUserAction(
  id: string,
  data: {
    namaLengkap?: string;
    username?: string;
    password?: string;
    role?: Role;
    hari?: string;
  }
) {
  // Validasi ID
  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) {
    throw new Error("ID pengguna tidak valid.");
  }

  // Validasi data update
  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  // Bangun objek update dari data yang sudah divalidasi (bukan spread 'data: any')
  const updateData: Record<string, any> = {};

  if (parsed.data.namaLengkap) updateData.namaLengkap = parsed.data.namaLengkap;
  if (parsed.data.username) updateData.username = parsed.data.username;
  if (parsed.data.role) updateData.role = parsed.data.role;

  // Hanya hash password jika diisi
  if (parsed.data.password && parsed.data.password !== "") {
    updateData.password = await bcrypt.hash(parsed.data.password, 12);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, namaLengkap: true, username: true, role: true },
    });

    revalidatePath("/admin/kelola-user");
    revalidatePath("/admin/dashboard");
    return user;
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("Username sudah digunakan oleh pengguna lain.");
    }
    console.error(error);
    throw new Error("Gagal memperbarui data user.");
  }
}

// ─── HAPUS USER ────────────────────────────────────────────────────────────────
export async function deleteUserAction(id: string) {
  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) {
    throw new Error("ID pengguna tidak valid.");
  }

  try {
    await prisma.user.delete({ where: { id } });

    revalidatePath("/admin/kelola-user");
    revalidatePath("/admin/dashboard");
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new Error("Pengguna tidak ditemukan.");
    }
    console.error(error);
    throw new Error("Gagal menghapus user.");
  }
}