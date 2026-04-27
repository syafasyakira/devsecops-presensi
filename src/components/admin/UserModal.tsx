"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { User, Role } from "@/types";

interface UserModalProps {
  user?: User | null; // null = add mode, User = edit mode
  onSave: (data: {
    namaLengkap: string;
    username: string;
    password: string;
    role: Role;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function UserModal({
  user,
  onSave,
  onCancel,
  isLoading = false,
}: UserModalProps) {
  const isEdit = !!user;

  const [namaLengkap, setNamaLengkap] = useState(user?.namaLengkap || "");
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role || "user");
  const [roleOpen, setRoleOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setNamaLengkap(user.namaLengkap);
      setUsername(user.username);
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = async () => {
    await onSave({ namaLengkap, username, password, role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
        style={{ background: "rgba(10,15,46,0.85)" }}
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? "Edit User" : "Tambah User Baru"}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          {/* Nama Lengkap */}
          <div>
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Username */}
          <div>
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: budi123"
              className="w-full px-4 py-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block mb-2">
              Password {isEdit && "(kosongkan jika tidak diubah)"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block mb-2">
              Role
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleOpen(!roleOpen)}
                className="w-full px-4 py-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 text-sm text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500"
              >
                <span className="capitalize">{role}</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${roleOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {roleOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10 animate-slide-down">
                  {(["user", "admin"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        setRoleOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm capitalize transition-colors ${
                        role === r
                          ? "bg-gray-100 text-gray-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !namaLengkap || !username}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {isLoading ? "Menyimpan..." : "Simpan User"}
          </button>
        </div>
      </div>
    </div>
  );
}
