"use client";

interface LogoProps {
  className?: string;
  dark?: boolean;
}

export default function Logo({ className = "", dark = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <span
        className={`font-bold italic text-xl tracking-tight ${
          dark ? "text-gray-900" : "text-white"
        }`}
        style={{ fontStyle: "italic", letterSpacing: "-0.02em" }}
      >
        Absensi
      </span>
      <span className="text-brand-blue text-2xl font-bold leading-none" style={{ marginTop: "-2px" }}>
        .
      </span>
    </div>
  );
}
