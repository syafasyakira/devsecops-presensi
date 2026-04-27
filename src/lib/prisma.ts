// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// 1. Inisialisasi variabel global untuk mencegah duplikasi koneksi saat development (Next.js HMR)
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// 2. Fungsi untuk membuat instansi Prisma
const createPrismaClient = () => {
  // Ambil URL database dari .env
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL tidak ditemukan di environment variables");
  }

  // Buat pool koneksi Postgres
  const pool = new Pool({ connectionString })
  
  // Buat adapter untuk Prisma 7
  const adapter = new PrismaPg(pool)

  // Inisialisasi Prisma Client dengan adapter
  return new PrismaClient({
    adapter,
    // Opsional: log untuk memudahkan debugging
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// 3. Ekspor instansi prisma (Singleton Pattern)
export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma