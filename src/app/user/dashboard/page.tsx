"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, CheckCircle2, Target, Clock, Info, Loader2 } from "lucide-react";
import UserNavbar from "@/components/user/UserNavbar";
import StatusBadge from "@/components/ui/StatusBadge";
import Toast from "@/components/ui/Toast";
import { AbsensiRecord, AbsensiStatus, DashboardUserData } from "@/types";
import { getStoredUser } from "@/lib/auth";

// Import Actions
import { getUserDashboard, submitAbsensiAction } from "@/lib/actions/absensi";

type Tab = "riwayat" | "alpha";

export default function UserDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("riwayat");
  const [dashboardData, setDashboardData] = useState<DashboardUserData | null>(null);
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" } | null>(null);

  const currentUser = getStoredUser();
  const todayDate = new Date().toISOString().split("T")[0];

  // Auth guard: jika tidak ada user di localStorage, redirect ke login
  useEffect(() => {
    if (!currentUser?.id) {
      window.location.href = "/login";
    }
  }, [currentUser?.id]);

  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      const data = await getUserDashboard(currentUser.id);
      setAbsensiList(data.history as any);
      setDashboardData(data as any);
    } catch (error) {
      setToast({ message: "Gagal memuat data", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recordToday = absensiList.find((r) => r.tanggal === todayDate);
  const hasAbsenToday = !!recordToday;

  // Cek apakah sekarang dalam rentang jam 07:00 – 12:00
  const now = new Date();
  const totalMenitSekarang = now.getHours() * 60 + now.getMinutes();
  const isWithinTimeWindow = totalMenitSekarang >= 7 * 60 && totalMenitSekarang < 12 * 60;
  const canAbsen = !hasAbsenToday && isWithinTimeWindow;

  const handleAbsensi = async (status: AbsensiStatus) => {
    if (!canAbsen || !currentUser?.id) return;
    setIsSubmitting(true);
    try {
      await submitAbsensiAction(currentUser.id, status);
      setSuccessBanner(true);
      setTimeout(() => setSuccessBanner(false), 4000);
      loadData();
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (str: string | undefined) => {
    if (!str) return "--:--";
    const d = new Date(str);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F2E] flex flex-col items-center justify-center text-blue-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sinkronisasi Data...</p>
      </div>
    );
  }

  const filteredData = activeTab === "riwayat" 
    ? absensiList.filter(r => r.tanggal === selectedDate)
    : absensiList.filter(r => r.status === "Alpha" && r.tanggal === selectedDate);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at 20% 10%, #1a2a6c 0%, #0D1B4B 40%, #0A0F2E 100%)" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <UserNavbar 
        userName={currentUser?.namaLengkap} 
        subtitle={"Mahasiswa - " + (currentUser?.username || "")}
      />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Card Presensi - Style Kode B */}
        <div className="bg-white rounded-2xl p-5 mb-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                <CalendarDays size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 uppercase tracking-tight leading-none">Presensi</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Kehadiran Hari Ini</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 uppercase">
              {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

            <div className="bg-blue-600 rounded-xl p-4 mb-5 shadow-inner">
            <p className="text-blue-100 text-[9px] font-black uppercase tracking-[0.2em] mb-3 text-center truncate">
              {dashboardData?.mataKuliah}
            </p>

            {/* Banner info waktu */}
            {!isWithinTimeWindow && !hasAbsenToday && (
              <div className="bg-yellow-400/20 border border-yellow-400/40 rounded-lg px-3 py-2 mb-3 text-center">
                <p className="text-yellow-200 text-[9px] font-black uppercase tracking-widest">
                  ⏰ Presensi hanya bisa dilakukan pukul 07:00 – 12:00
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {(["Hadir", "Izin", "Alpha"] as AbsensiStatus[]).map((status) => {
                const isSelected = recordToday?.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => handleAbsensi(status)}
                    disabled={isSubmitting || !canAbsen}
                    className={`bg-white rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                      hasAbsenToday
                        ? isSelected ? "border-yellow-400 scale-[1.02]" : "opacity-40 grayscale-[0.5]"
                        : !isWithinTimeWindow
                        ? "opacity-40 grayscale cursor-not-allowed"
                        : "hover:border-blue-100 active:scale-95"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${status === "Hadir" ? "bg-green-500" : status === "Izin" ? "bg-orange-400" : "bg-red-500"}`} />
                    <span className="text-gray-900 font-black text-[11px] uppercase tracking-tighter">{status}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-gray-400" />
              <p className="text-[9px] font-bold text-gray-500 truncate uppercase">{dashboardData?.subCapaianPembelajaran}</p>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Clock size={14} className="text-orange-400" />
              <p className="text-[9px] font-bold text-gray-500 uppercase italic">Batas: {formatDateTime(dashboardData?.presensiTanggalBerakhir)}</p>
            </div>
          </div>
        </div>

        {successBanner && (
          <div className="flex items-center gap-3 bg-green-500 text-white rounded-xl px-4 py-2 mb-5 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} />
            <span className="font-black text-[9px] uppercase tracking-widest">Absensi Berhasil Dicatat</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl backdrop-blur-sm border border-white/5">
            {["riwayat", "alpha"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as Tab)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-white text-blue-900 shadow-sm" : "text-white/50 hover:text-white"}`}
              >
                {t === "riwayat" ? "Riwayat" : "Alpha"}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white/10 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-white focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          {filteredData.length > 0 ? (
            filteredData.map((record) => (
              <div key={record.id} className="bg-white rounded-xl px-4 py-3 grid grid-cols-3 items-center border border-gray-50 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">
                    {new Date(record.tanggal).getDate()}
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold text-xs uppercase">{new Date(record.tanggal).toLocaleDateString("id-ID", { month: 'short' })}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{record.hari}</p>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-100">{record.jamMasuk || "--:--"}</span>
                </div>
                <div className="flex justify-center">
                  <StatusBadge status={record.status} />
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
              <Info className="mx-auto text-white/20 mb-3" size={32} />
              <p className="text-white font-bold uppercase tracking-widest text-[9px] opacity-40">Tidak ada data</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}