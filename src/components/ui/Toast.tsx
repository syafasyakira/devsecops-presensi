"use client";

import { useEffect } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  subMessage?: string;
  type?: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  subMessage,
  type = "success",
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-down">
      <div
        className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl border min-w-[260px] ${
          type === "success"
            ? "bg-white border-green-100"
            : "bg-white border-red-100"
        }`}
      >
        <div
          className={`flex-shrink-0 rounded-full p-0.5 ${
            type === "success" ? "text-green-500" : "text-red-500"
          }`}
        >
          {type === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              type === "success" ? "text-green-700" : "text-red-700"
            }`}
          >
            {message}
          </p>
          {subMessage && (
            <p className="text-xs text-gray-500 mt-0.5">{subMessage}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
