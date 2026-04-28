// src/lib/auth.ts
import { Role, User } from "@/types";
import Cookies from "js-cookie";

// ─── MENYIMPAN DATA AUTENTIKASI ────────────────────────────────────────────────
// ⚠️  KEAMANAN: Cookie HARUS menggunakan secure: true di produksi.
// Cookie 'token' idealnya diset via server (httpOnly) agar tidak bisa diakses JS.
// Saat ini js-cookie TIDAK bisa set httpOnly — untuk keamanan penuh gunakan
// endpoint API/route handler Next.js yang menangani cookie via Set-Cookie header.
export function saveAuth(token: string, user: User, role: Role) {
  if (typeof window === "undefined") return;

  // Cek apakah kita di production
  const isProduction = process.env.NODE_ENV === "production";
  
  // Cek apakah koneksi saat ini adalah HTTPS
  const isSecureConnection = window.location.protocol === "https:";

  localStorage.setItem(
    "user",
    JSON.stringify({
      id: user.id,
      namaLengkap: user.namaLengkap,
      username: user.username,
      role: user.role,
    })
  );

  const cookieOptions: Cookies.CookieAttributes = {
    expires: 1, 
    sameSite: "Strict", 
    secure: isProduction && isSecureConnection, 
  };

  Cookies.set("token", token, cookieOptions);
  Cookies.set("role", role, cookieOptions);
}

// ─── MENGHAPUS SESI (LOGOUT) ───────────────────────────────────────────────────
export function clearAuth() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("user");
  Cookies.remove("token");
  Cookies.remove("role");

  window.location.href = "/login";
}

// ─── MENGAMBIL DATA USER YANG SEDANG LOGIN ─────────────────────────────────────
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem("user");
  try {
    const parsed = u ? JSON.parse(u) : null;
    // Validasi minimal: pastikan objek punya field yang diperlukan
    if (!parsed || !parsed.id || !parsed.role) return null;
    return parsed as User;
  } catch {
    // Hapus data korup
    localStorage.removeItem("user");
    return null;
  }
}

// ─── MENGAMBIL ROLE DARI COOKIES ───────────────────────────────────────────────
export function getStoredRole(): Role | null {
  const role = Cookies.get("role");
  // Validasi nilai role sebelum dikembalikan
  if (role !== "admin" && role !== "user") return null;
  return role as Role;
}

// ─── CEK APAKAH USER SUDAH LOGIN ──────────────────────────────────────────────
export function isAuthenticated(): boolean {
  return !!Cookies.get("token") && !!getStoredUser();
}

// ─── UTILS: FORMAT TANGGAL ─────────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}
