"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { resetPasswordAction } from "@/lib/actions/auth";

// Aturan kekuatan password
const passwordRules = [
  { label: "Minimal 8 karakter", test: (p: string) => p.length >= 8 },
  { label: "Ada huruf besar (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Ada huruf kecil (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Ada angka (0-9)", test: (p: string) => /\d/.test(p) },
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Hitung berapa aturan yang terpenuhi
  const rulesPassed = passwordRules.filter((r) => r.test(newPassword));
  const isPasswordStrong = rulesPassed.length === passwordRules.length;

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Semua field harus diisi");
      return;
    }
    if (!isPasswordStrong) {
      setError("Password belum memenuhi semua persyaratan");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    if (!token) {
      setError("Token reset tidak valid. Silakan ulangi proses lupa password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await resetPasswordAction({ token, newPassword });
      router.push("/password-success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan password. Coba lagi.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white flex flex-col min-h-screen">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <span className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">
            Security System
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Step 2 of 2
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-[2rem] bg-blue-50 flex items-center justify-center mb-6 shadow-sm">
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              Sandi Baru
            </h2>
            <p className="text-[11px] text-gray-400 font-bold text-center mt-3 uppercase tracking-wider leading-relaxed">
              Gunakan kombinasi karakter yang kuat
              <br />
              untuk melindungi akun Anda.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold uppercase flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              {error}
            </div>
          )}

          <div className="space-y-5 mb-6">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1 mb-2 block">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  maxLength={128}
                  autoComplete="new-password"
                  className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label={showNew ? "Sembunyikan" : "Tampilkan"}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Indikator kekuatan password */}
              {newPassword.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {passwordRules.map((rule) => {
                    const passed = rule.test(newPassword);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        {passed ? (
                          <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle size={12} className="text-gray-300 flex-shrink-0" />
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase ${passed ? "text-green-600" : "text-gray-400"}`}
                        >
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1 mb-2 block">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  maxLength={128}
                  autoComplete="new-password"
                  className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none pr-12"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label={showConfirm ? "Sembunyikan" : "Tampilkan"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Indikator kecocokan password */}
              {confirmPassword.length > 0 && (
                <p
                  className={`text-[10px] font-bold mt-2 ml-1 ${
                    newPassword === confirmPassword ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {newPassword === confirmPassword ? "✓ Password cocok" : "✗ Password tidak cocok"}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !isPasswordStrong || newPassword !== confirmPassword}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Menyimpan...
              </>
            ) : (
              "Simpan Sandi Baru"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center h-screen text-blue-500">
            <Loader2 className="animate-spin" size={32} />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
