"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { clearAuth } from "@/lib/auth";

interface UserNavbarProps {
  userName?: string;
  subtitle?: string;
  isDemo?: boolean;
}

export default function UserNavbar({
  userName = "User",
  subtitle = "",
  isDemo = false,
}: UserNavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      {/* Left: Logo + User Info */}
      <div className="flex items-center gap-6">
        <Logo />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-white font-bold text-xl leading-tight">
              Halo, {userName}
            </h1>
            {isDemo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-medium">
                Demo Mode
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-blue-300 text-xs">{subtitle}</p>
          )}
        </div>
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
