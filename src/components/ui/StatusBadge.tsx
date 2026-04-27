"use client";

import { AbsensiStatus } from "@/types";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config: Record<string, string> = {
    Hadir: "bg-blue-500 text-white",
    Izin: "bg-orange-100 text-orange-500 border border-orange-200",
    Alpha: "bg-red-100 text-red-500 border border-red-200",
    "Belum Absen": "bg-gray-100 text-gray-500 border border-gray-200",
  };

  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-4 py-1.5";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold ${config[status]} ${sizeClass}`}
    >
      {status}
    </span>
  );
}
