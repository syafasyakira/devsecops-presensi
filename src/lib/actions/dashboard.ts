"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AbsensiStatus } from "@/types";
import { z } from "zod";

// ─── Validation ────────────────────────────────────────────────────────────────
const updateAbsensiSchema = z.object({
  userId: z.string().cuid("ID user tidak valid"),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)")
    .refine((d) => {
      const date = new Date(d);
      return !isNaN(date.getTime());
    }, "Tanggal tidak valid"),
  status: z.enum(["Hadir", "Izin", "Alpha"]),
  jamMasuk: z
    .string()
    .regex(/^(\d{2}:\d{2}|--:--)$/, "Format jam tidak valid")
    .optional(),
});

// ─── GET ADMIN DASHBOARD DATA ──────────────────────────────────────────────────
export async function getAdminDashboardData() {
  const today = new Date().toISOString().split("T")[0];

  const [totalUser, hadir, izin, alpha, history] = await Promise.all([
    prisma.user.count({ where: { role: "user" } }),
    prisma.absensiRecord.count({ where: { tanggal: today, status: "Hadir" } }),
    prisma.absensiRecord.count({ where: { tanggal: today, status: "Izin" } }),
    prisma.absensiRecord.count({ where: { tanggal: today, status: "Alpha" } }),
    prisma.absensiRecord.findMany({
      include: {
        user: {
          // ⚠️  KEAMANAN: Hanya ambil field yang diperlukan, JANGAN ambil password
          select: { namaLengkap: true },
        },
      },
      orderBy: { tanggal: "desc" },
      // Batasi hasil untuk mencegah response yang terlalu besar
      take: 500,
    }),
  ]);

  return {
    stats: {
      totalUser,
      hadir,
      izin,
      alpha,
      subCapaianPembelajaran: "[Praktikum 2] - Vulnerability Assessment",
      presensiTanggalBerakhir: (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.toISOString(); })(),
      totalJam: "100 menit",
    },
    history,
  };
}

// ─── UPDATE ABSENSI (ADMIN) ────────────────────────────────────────────────────
export async function updateAbsensiAction(payload: {
  userId: string;
  tanggal: string;
  status: AbsensiStatus;
  jamMasuk?: string;
}) {
  // Validasi semua input sebelum upsert
  const parsed = updateAbsensiSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { userId, tanggal, status, jamMasuk } = parsed.data;

  // ⚠️  KEAMANAN: Pastikan userId memang ada di database sebelum upsert
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  // ⚠️  KEAMANAN: Batasi perubahan hanya untuk hari ini (atau sesuai policy)
  // Hapus batasan ini jika admin memang perlu edit data historis
  const today = new Date().toISOString().split("T")[0];
  if (tanggal !== today) {
    throw new Error("Hanya bisa mengubah absensi untuk hari ini.");
  }

  // Gunakan ID yang deterministik dari userId+tanggal
  const recordId = `${userId}-${tanggal}`;

  await prisma.absensiRecord.upsert({
    where: { id: recordId },
    update: {
      status,
      jamMasuk: jamMasuk ?? "--:--",
    },
    create: {
      id: recordId,
      userId,
      tanggal,
      status,
      jamMasuk: jamMasuk ?? "--:--",
      hari: new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", {
        weekday: "long",
      }),
    },
  });

  revalidatePath("/admin/dashboard");
}