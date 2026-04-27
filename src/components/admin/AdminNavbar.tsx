"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { clearAuth } from "@/lib/auth";

interface AdminNavbarProps {
  userName?: string;
}

export default function AdminNavbar({ userName = "Admin" }: AdminNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isOverview = pathname === "/admin/dashboard";
  const isKelola = pathname === "/admin/kelola-user";

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-6">
        <Logo />
        <div>
          <h1 className="text-white font-bold text-xl leading-tight">
            Halo, Admin
          </h1>
          <p className="text-blue-300 text-xs">Overview absensi keseluruhan</p>
        </div>
      </div>

      {/* Center: Nav tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
            isOverview
              ? "bg-white/10 text-blue-300 border border-blue-400/30"
              : "text-white border border-white/20 hover:bg-white/5"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => router.push("/admin/kelola-user")}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
            isKelola
              ? "bg-blue-500 text-white border border-blue-400"
              : "text-white border border-white/20 hover:bg-white/5"
          }`}
        >
          Kelola User
        </button>
      </div>

      {/* Right: Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all"
      >
        <LogOut size={16} />
        Keluar
      </button>
    </nav>
  );
}
