"use server"

import { prisma } from "@/lib/prisma";
import { LoginRequest, Role } from "@/types";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ─── Validation Schemas ────────────────────────────────────────────────────────
const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username terlalu panjang")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  password: z.string().min(1, "Password harus diisi").max(128, "Password terlalu panjang"),
  role: z.enum(["admin", "user"]),
});

const forgotSchema = z.object({
  identifier: z.string().min(3, "Identifier terlalu pendek").max(100),
});

const resetSchema = z.object({
  token: z.string().min(3).max(100),
  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(128, "Password terlalu panjang")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung huruf besar, huruf kecil, dan angka"
    ),
});

// ─── 1. LOGIN ──────────────────────────────────────────────────────────────────
export async function loginAction(payload: LoginRequest) {
  const parsed = loginSchema.safeParse({
    username: payload.username,
    password: payload.password,
    role: payload.role,
  });

  if (!parsed.success) {
    throw new Error("Input tidak valid: " + parsed.error.issues[0].message);
  }

  const { username, password, role } = parsed.data;

  try {
    const user = await prisma.user.findFirst({
      where: { username, role: role as any },
    });

    // ⚠️  KEAMANAN: Pesan error SENGAJA sama agar tidak bocorkan info
    // apakah username atau password yang salah (mencegah user enumeration attack)
    const genericError = "Username atau kata sandi salah.";

    if (!user) {
      // Tetap jalankan bcrypt agar waktu respons konsisten (mencegah timing attack)
      await bcrypt.compare(password, "$2b$12$invalidhashfortimingattack.....");
      throw new Error(genericError);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error(genericError);
    }

    // ⚠️  Token ini hanya untuk development. Di produksi, gunakan JWT yang di-sign
    // dengan NEXTAUTH_SECRET atau gunakan NextAuth.js.
    const tokenPayload = Buffer.from(
      JSON.stringify({ id: user.id, role: user.role, ts: Date.now() })
    ).toString("base64");

    return {
      success: true,
      user: {
        id: user.id,
        namaLengkap: user.namaLengkap,
        username: user.username,
        role: user.role as Role,
      },
      token: tokenPayload,
    };
  } catch (error: any) {
    throw new Error(error.message || "Terjadi kesalahan pada server");
  }
}

// ─── 2. FORGOT PASSWORD ────────────────────────────────────────────────────────
export async function forgotPasswordAction(payload: { identifier: string }) {
  const parsed = forgotSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Input tidak valid.");
  }

  const { identifier } = parsed.data;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
      select: { id: true, username: true },
    });

    // ⚠️  KEAMANAN: Selalu kembalikan sukses meski user tidak ada.
    // Mencegah attacker mengetahui username mana yang terdaftar (user enumeration).
    if (!user) {
      return { success: true };
    }

    // TODO produksi: generate token aman + simpan ke DB + kirim via email
    return { success: true, username: user.username };
  } catch {
    throw new Error("Gagal memproses permintaan.");
  }
}

// ─── 3. RESET PASSWORD ─────────────────────────────────────────────────────────
export async function resetPasswordAction(payload: {
  token: string;
  newPassword: string;
}) {
  const parsed = resetSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { token, newPassword } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { username: token },
      select: { id: true },
    });

    if (!user) {
      throw new Error("Sesi reset sandi tidak valid atau sudah kedaluwarsa.");
    }

    // Hash dengan salt rounds 12 (lebih kuat dari 10)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Gagal menyimpan sandi baru.");
  }
}
