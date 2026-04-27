"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";

export default function PasswordSuccessPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, #1a3a8c 0%, #0D1B4B 40%, #0A0F2E 100%)",
      }}
    >
      {/* Top logo */}
      <div className="p-8">
        <Logo />
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p
          className="text-white/80 text-4xl leading-relaxed max-w-md"
          style={{ fontStyle: "italic", fontWeight: 300, letterSpacing: "-0.01em" }}
        >
          Password baru berhasil disimpan, kembali ke menu log in
        </p>

        <div className="w-full max-w-xl mt-12">
          <div className="h-px bg-white/20 mb-6" />
          <button
            onClick={() => router.push("/login")}
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition-colors"
          >
            Back to log in
          </button>
        </div>
      </div>
    </div>
  );
}
