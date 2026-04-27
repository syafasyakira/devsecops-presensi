"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Clock, Target, Info } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import StatusBadge from "@/components/ui/StatusBadge";
import Toast from "@/components/ui/Toast";
import { DashboardAdminStats, AbsensiRecord, AbsensiStatus, User } from "@/types";

// Import Server Actions
import { getAdminDashboardData, updateAbsensiAction } from "@/lib/actions/dashboard";
import { getAllUsersAction } from "@/lib/actions/users";
import { getStoredUser } from "@/lib/auth";

type Tab = "riwayat" | "data-user";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("riwayat");
  const [stats, setStats] = useState<DashboardAdminStats | null>(null);
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [openStatusMenuUserId, setOpenStatusMenuUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; sub?: string; type?: "success" | "error" } | null>(null);
  const [filterStatus, setFilterStatus] = useState<AbsensiStatus | "All">("All");

  const currentUser = getStoredUser();

  // 1. AUTH GUARD: Tendang ke login jika tidak ada sesi
  useEffect(() => {
    if (!currentUser?.id) {
      window.location.href = "/login";
    }
  }, [currentUser?.id]);

  const todayDate = new Date().toISOString().split("T")[0];
  const isTodaySelected = selectedDate === todayDate;

  // Cek apakah sekarang dalam rentang jam 07:00 – 12:00
  const nowAdmin = new Date();
  const totalMenitAdmin = nowAdmin.getHours() * 60 + nowAdmin.getMinutes();
  const isWithinTimeWindowAdmin = totalMenitAdmin >= 7 * 60 && totalMenitAdmin < 12 * 60;
  const canAdminTandai = isTodaySelected && isWithinTimeWindowAdmin;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminDashboardData();
      const allUsers = await getAllUsersAction();

      setStats(data.stats as DashboardAdminStats);
      setAbsensiList(data.history as any);
      setUserList(allUsers as User[]);
    } catch (error) {
      setToast({ message: "Gagal memuat data", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (userId: string, status: AbsensiStatus) => {
    if (!canAdminTandai) {
      setToast({ message: "Hanya bisa menandai absen hari ini antara jam 07:00 – 12:00", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const jamMasuk = status === "Hadir" 
        ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }) 
        : "--:--";

      await updateAbsensiAction({
        userId,
        tanggal: selectedDate,
        status,
        jamMasuk
      });

      setToast({ message: "Status presensi berhasil diperbarui", type: "success" });
      setOpenStatusMenuUserId(null);
      loadData(); 
    } catch (err) {
      setToast({ message: "Gagal memperbarui status", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (str: string | undefined) => {
    if (!str) return "--:--";
    const d = new Date(str);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const recordsForDate = absensiList.filter((record) => {
    const matchDate = record.tanggal === selectedDate;
    const matchStatus = filterStatus === "All" || record.status === filterStatus;
    return matchDate && matchStatus;
  });

  return (
    <div
      className="min-h-screen"
      style={{
        background: "radial-gradient(ellipse at 20% 10%, #1a2a6c 0%, #0D1B4B 40%, #0A0F2E 100%)",
      }}
    >
      {toast && (
        <Toast
          message={toast.message}
          subMessage={toast.sub}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* NAVBAR */}
      <AdminNavbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* STATS HEADER */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-xl border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Admin Dashboard</h2>
              <p className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-wider">Ringkasan Aktivitas Sistem</p>
            </div>
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
              <CalendarDays className="text-blue-600" size={20} />
              <span className="text-blue-700 font-bold text-sm">
                {new Date().toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { dot: "bg-blue-500", label: "Total User", value: stats?.totalUser || 0, status: "All" },
              { dot: "bg-green-500", label: "Hadir", value: stats?.hadir || 0, status: "Hadir" },
              { dot: "bg-orange-500", label: "Izin", value: stats?.izin || 0, status: "Izin" },
              { dot: "bg-red-500", label: "Alpha", value: stats?.alpha || 0, status: "Alpha" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setFilterStatus(item.status as any);
                  setActiveTab("riwayat");
                }}
                className={`group p-5 rounded-3xl transition-all duration-300 text-left border-2 ${
                  filterStatus === item.status 
                  ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-900/20 scale-[1.02]" 
                  : "bg-gray-50 border-transparent hover:bg-white hover:border-blue-100"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${item.dot} mb-3 group-hover:scale-150 transition-transform`} />
                <span className={`text-2xl font-black block leading-none mb-1 ${filterStatus === item.status ? "text-white" : "text-gray-900"}`}>
                  {item.value}
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider ${filterStatus === item.status ? "text-blue-100" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0">
                <Target size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Capaian Pembelajaran</p>
                <p className="text-sm font-bold text-gray-800">{stats?.subCapaianPembelajaran || "..."}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-500 flex-shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Batas Presensi</p>
                <p className="text-sm font-bold text-gray-800 uppercase italic">Berakhir pukul {formatDateTime(stats?.presensiTanggalBerakhir)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION & FILTERS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex gap-1 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/5">
            {(["riwayat", "data-user"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? "bg-white text-blue-900 shadow-lg" : "text-white/60 hover:text-white"
                }`}
              >
                {tab === "riwayat" ? "Riwayat Absensi" : "Manajemen Mahasiswa"}
              </button>
            ))}
          </div>
          
          {activeTab === "riwayat" && (
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                />
             </div>
          )}
        </div>

        {/* TAB CONTENT */}
        <div className="animate-fade-in">
          {/* JUDUL TABEL (GRID HEADER) */}
          <div className="grid grid-cols-3 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 mb-4 border border-white/5 items-center">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] text-left">
              Mahasiswa
            </span>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] text-center">
              Waktu Masuk
            </span>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] text-center">
              {activeTab === "riwayat" ? "Status Presensi" : "Aksi Admin"}
            </span>
          </div>

          <div className="space-y-3">
            {activeTab === "riwayat" ? (
              recordsForDate.length > 0 ? (
                recordsForDate.map((record) => (
                  <div key={record.id} className="bg-white shadow-sm border border-gray-100 rounded-3xl px-6 py-5 grid grid-cols-3 items-center group hover:shadow-xl transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                        {(record as any).user?.namaLengkap?.substring(0, 2).toUpperCase() || "??"}
                      </div>
                      <div>
                        <p className="text-gray-900 font-black text-sm uppercase">{(record as any).user?.namaLengkap}</p>
                        <p className="text-gray-400 text-[10px] font-bold uppercase">{record.hari}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-black text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                        {record.jamMasuk || "--:--"}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <StatusBadge status={record.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center backdrop-blur-sm">
                  <Info className="mx-auto text-white/20 mb-4" size={40} />
                  <p className="text-white font-bold uppercase tracking-widest text-sm opacity-40">Data tidak ditemukan</p>
                </div>
              )
            ) : (
              // DATA USER TAB
              userList.filter(u => u.role === 'user').map((user) => {
                const record = absensiList.find(r => r.userId === user.id && r.tanggal === selectedDate);
                return (
                  <div key={user.id} className="bg-white shadow-sm border border-gray-100 rounded-3xl px-6 py-5 grid grid-cols-3 items-center group hover:shadow-xl transition-all">
                    <div className="text-left flex flex-col">
                      <p className="text-gray-900 font-black text-sm uppercase">{user.namaLengkap}</p>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter">{user.username}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-gray-500 italic">{record?.jamMasuk ?? "BELUM ABSEN"}</p>
                    </div>
                    <div className="relative flex justify-center">
                      {isTodaySelected && !record ? (
                        canAdminTandai ? (
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => setOpenStatusMenuUserId(openStatusMenuUserId === user.id ? null : user.id)}
                            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-blue-700 transition-all shadow-md"
                          >
                            Tandai Absen
                          </button>
                          {openStatusMenuUserId === user.id && (
                            <div className="absolute top-full z-20 mt-2 p-2 bg-white shadow-2xl border border-gray-100 rounded-2xl flex gap-1.5 animate-in fade-in zoom-in-95">
                              {(["Hadir", "Izin", "Alpha"] as AbsensiStatus[]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(user.id, status)}
                                  className={`text-[9px] font-black uppercase px-3 py-2 rounded-lg transition-all ${
                                    status === "Hadir" ? "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white" :
                                    status === "Izin" ? "bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white" :
                                    "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        ) : (
                          <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg uppercase tracking-tight text-center">
                            Di luar jam presensi
                          </span>
                        )
                      ) : (
                        <StatusBadge status={record?.status || "Belum Absen"} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}