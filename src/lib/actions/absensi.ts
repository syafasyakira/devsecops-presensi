"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AbsensiStatus } from "@/types";
import { z } from "zod";

// ─── Validation ────────────────────────────────────────────────────────────────
const idSchema = z.string().cuid("ID tidak valid");
const statusSchema = z.enum(["Hadir", "Izin", "Alpha"]);

// ─── GET USER DASHBOARD ────────────────────────────────────────────────────────
export async function getUserDashboard(userId: string) {
  // Validasi userId sebelum query
  const parsed = idSchema.safeParse(userId);
  if (!parsed.success) {
    throw new Error("ID pengguna tidak valid.");
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Verifikasi user benar-benar ada dan punya role 'user'
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    // ⚠️  KEAMANAN: Pastikan hanya user biasa yang bisa akses dashboard user
    if (!user || user.role !== "user") {
      throw new Error("Akses ditolak.");
    }

    const history = await prisma.absensiRecord.findMany({
      where: { userId },
      orderBy: { tanggal: "desc" },
      // Batasi jumlah data yang dikembalikan
      take: 100,
    });

    const todayRecord = await prisma.absensiRecord.findFirst({
      where: { userId, tanggal: today },
    });

    // Batas presensi: jam 12:00 siang hari ini (waktu lokal server)
    const batasPresensi = new Date();
    batasPresensi.setHours(12, 0, 0, 0);

    return {
      mataKuliah: "Sistem Informasi",
      subCapaianPembelajaran: "[Praktikum 2] - Vulnerability Assessment",
      presensiTanggalBerakhir: batasPresensi.toISOString(),
      todayRecord,
      history,
    };
  } catch (error: any) {
    console.error("Dashboard Error:", error);
    throw new Error(error.message || "Gagal memuat dashboard");
  }
}

// ─── SUBMIT ABSENSI ────────────────────────────────────────────────────────────
export async function submitAbsensiAction(userId: string, status: AbsensiStatus) {
  // Validasi input
  const idParsed = idSchema.safeParse(userId);
  if (!idParsed.success) {
    throw new Error("ID pengguna tidak valid.");
  }

  const statusParsed = statusSchema.safeParse(status);
  if (!statusParsed.success) {
    throw new Error("Status absensi tidak valid.");
  }

  try {
    // ⚠️  KEAMANAN: Verifikasi ulang userId di server — jangan percaya client
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "user") {
      throw new Error("Akses ditolak.");
    }

    const now = new Date();

    // ⚠️  VALIDASI WAKTU: Presensi hanya boleh jam 07:00 – 12:00
    const jam = now.getHours();
    const menit = now.getMinutes();
    const totalMenit = jam * 60 + menit;
    const batasAwal = 7 * 60;   // 07:00
    const batasTutup = 12 * 60; // 12:00

    if (totalMenit < batasAwal || totalMenit >= batasTutup) {
      throw new Error("Presensi hanya dapat dilakukan antara jam 07:00 hingga 12:00.");
    }

    // Gunakan UTC untuk konsistensi
    const tanggal = now.toISOString().split("T")[0];
    const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
    const jamMasuk = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // ⚠️  Cek duplikat manual sebelum insert untuk pesan error yang jelas
    const existing = await prisma.absensiRecord.findFirst({
      where: { userId, tanggal },
    });

    if (existing) {
      throw new Error("Anda sudah mengisi presensi hari ini.");
    }

    const record = await prisma.absensiRecord.create({
      data: {
        userId,
        tanggal,
        hari,
        status: statusParsed.data,
        jamMasuk: statusParsed.data === "Hadir" ? jamMasuk : "--:--",
      },
    });

    revalidatePath("/user/dashboard");
    return record;
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("Anda sudah mengisi presensi hari ini.");
    }
    throw new Error(error.message || "Gagal menyimpan presensi.");
  }
}
