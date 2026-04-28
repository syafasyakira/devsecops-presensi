"use client";

import { useState, useRef } from "react";
import { Eye, EyeOff, ShieldCheck, User as UserIcon, Loader2 } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { saveAuth } from "@/lib/auth";
import { loginAction } from "@/lib/actions/auth";

// ⚠️  KEAMANAN: Rate limiting sederhana di sisi client
// Mencegah brute force yang terang-terangan. Rate limiting SESUNGGUHNYA
// harus dilakukan di server/middleware.
const MAX_ATTEMPTS = 6;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 menit

export default function LoginPage() {
  const [role, setRole] = useState<"user" | "admin">("user");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State rate limiting
  const attemptsRef = useRef(0);
  const lockoutUntilRef = useRef<number>(0);

  const handleLogin = async () => {
    // Cek lockout
    if (Date.now() < lockoutUntilRef.current) {
      const remaining = Math.ceil((lockoutUntilRef.current - Date.now()) / 1000);
      setError(`Terlalu banyak percobaan. Coba lagi dalam ${remaining} detik.`);
      return;
    }

    // Validasi client-side dasar
    if (!identifier.trim() || !password) {
      setError("Semua field harus diisi");
      return;
    }

    // Batasi panjang input di client (server juga memvalidasi)
    if (identifier.length > 50 || password.length > 128) {
      setError("Input terlalu panjang");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await loginAction({
        username: identifier.trim(),
        password,
        role,
      });

      // Reset counter setelah berhasil
      attemptsRef.current = 0;

      saveAuth(res.token, res.user, res.user.role);

      // Gunakan window.location.href agar middleware bisa membaca cookie
      // yang baru di-set sebelum navigasi terjadi.
      // router.push() bisa race dengan cookie yang belum ter-commit.
      if (res.user.role === "admin") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/user/dashboard";
      }
    } catch (err: any) {
      // Tambah counter percobaan gagal
      attemptsRef.current += 1;

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        lockoutUntilRef.current = Date.now() + LOCKOUT_DURATION_MS;
        attemptsRef.current = 0;
        setError(`Terlalu banyak percobaan gagal. Akun dikunci sementara 1 menit.`);
      } else {
        setError(err.message || "Login gagal. Periksa kembali akun Anda.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans" style={{ background: "#0A0F2E" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 w-[45%]"
        style={{
          background: "radial-gradient(ellipse at 30% 20%, #1a2a6c 0%, #0D1B4B 40%, #0A0F2E 100%)",
        }}
      >
        <Logo />
        <div>
          <p
            className="text-white/80 text-4xl leading-snug"
            style={{ fontStyle: "italic", fontWeight: 300, letterSpacing: "-0.01em" }}
          >
            Welcome.
            <br />
            Start your journey
            <br />
            now with our
            <br />
            management
            <br />
            system!
          </p>
        </div>
        <div />
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 md:p-16">
        <div className="lg:hidden mb-12">
          <Logo dark />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">
              Login Account Ppp.
            </h2>
            <p className="text-gray-400 text-[10px] font-bold mt-2 uppercase tracking-[0.2em]">
              Masuk untuk melanjutkan
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold uppercase flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex p-1 bg-gray-100 rounded-2xl gap-1">
              {(["user", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    role === r
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {r === "admin" ? <ShieldCheck size={14} /> : <UserIcon size={14} />}
                  {r}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1 mb-2 block">
                  Username
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan username"
                  maxLength={50}
                  autoComplete="username"
                  className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    maxLength={128}
                    autoComplete="current-password"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none pr-12"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full mt-10 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Authenticating...
              </>
            ) : (
              "Login Now"
            )}
          </button>

          <p className="text-center text-[10px] font-bold text-gray-400 mt-8 uppercase tracking-widest leading-loose">
            {role === "user" ? (
              <>
                Forget Password?{" "}
                <a
                  href="/forgot-password"
                  className="text-blue-600 hover:underline underline-offset-4 ml-1"
                >
                  Change Password
                </a>
              </>
            ) : (
              "Admin Access Restricted"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
