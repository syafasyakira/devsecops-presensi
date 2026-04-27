// ============================================================
// TYPES - src/types/index.ts
// Type definitions for the frontend application
// ============================================================

export type Role = "admin" | "user";

export type AbsensiStatus = "Hadir" | "Izin" | "Alpha";

export interface User {
  id: string;
  namaLengkap: string;
  username: string;
  email?: string;
  role: Role;
  hari?: string; 
  createdAt?: string;
}

export interface AbsensiRecord {
  id: string;
  userId: string;
  tanggal: string; // ISO date string "YYYY-MM-DD"
  hari: string;
  jamMasuk?: string; // "HH:mm"
  status: AbsensiStatus;
}

export interface DashboardAdminStats {
  totalUser: number;
  hadir: number;
  izin: number;
  alpha: number;
  subCapaianPembelajaran: string;
  presensiTanggalBerakhir: string; // ISO datetime string
  totalJam: string; // e.g., "100 menit"
}

export interface DashboardUserData {
  mataKuliah: string;
  subCapaianPembelajaran: string;
  presensiTanggalBerakhir: string;
  totalJam: string;
}

// Auth request/response types
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
  role?: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
  role: Role;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface AddUserRequest {
  namaLengkap: string;
  username: string;
  password: string;
  role: Role;
}

export interface UpdateAbsensiRequest {
  userId: string;
  tanggal: string;
  status: AbsensiStatus;
  jamMasuk?: string;
}

export interface AbsensiRequest {
  status: AbsensiStatus;
}