import { NextRequest, NextResponse } from "next/server";

// Route yang butuh login
const PROTECTED_ADMIN = /^\/admin/;
const PROTECTED_USER = /^\/user/;

// Route yang hanya boleh diakses saat BELUM login
const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;
  const isLoggedIn = !!token && !!role;

  // ── Jika sudah login dan mencoba buka halaman auth → redirect ke dashboard
  if (isLoggedIn && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const dest = role === "admin" ? "/admin/dashboard" : "/user/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ── Proteksi route /admin/*
  if (PROTECTED_ADMIN.test(pathname)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "admin") {
      // User biasa coba akses admin → tendang ke dashboard mereka
      return NextResponse.redirect(new URL("/user/dashboard", request.url));
    }
  }

  // ── Proteksi route /user/*
  if (PROTECTED_USER.test(pathname)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "user") {
      // Admin coba akses halaman user → tendang ke dashboard admin
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Matcher: jalankan middleware di semua route kecuali aset statis & API
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
