"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
// Import Action Baru
import { forgotPasswordAction } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // Kita ganti email jadi identifier agar lebih fleksibel
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!identifier) {
      setError("Username atau Email harus diisi");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      // Panggil Server Action
      const res = await forgotPasswordAction({ identifier });
      setSent(true);
      
      // Simulasi: Kita arahkan user ke reset password setelah 3 detik
      // Di dunia nyata, user harus klik link dari email mereka.
      setTimeout(() => {
        router.push(`/reset-password?token=${res.username}`);
      }, 3000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memproses permintaan.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <div className="border-b border-gray-100 px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => router.push("/login")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
            Recovery Phase
          </span>
          <div className="h-[2px] flex-1 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full bg-blue-600 transition-all duration-500 ${sent ? 'w-full' : 'w-1/2'}`} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          {sent ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">User Verified</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-relaxed mb-10">
                Identitas ditemukan. Anda akan segera <br/> diarahkan ke halaman <span className="text-blue-600">Reset Password</span>
              </p>
              <div className="flex justify-center">
                <Loader2 className="animate-spin text-blue-600" size={24} />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-10">
                <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-6 shadow-sm">
                  <KeyRound size={36} className="text-blue-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none text-center">
                  Lupa Sandi?
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-center mt-3 leading-loose">
                  Masukkan Username terdaftar <br /> untuk mendapatkan akses kembali.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold uppercase flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1 mb-2 block">
                    Username / ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Masukkan username Anda"
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-gray-900 text-sm font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none pr-12"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                      <Mail size={18} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Processing...
                      </>
                    ) : "Verifikasi Akun"}
                  </button>
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full mt-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                  >
                    Batal & Kembali
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}