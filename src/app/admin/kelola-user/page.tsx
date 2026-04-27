"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, UserCircle, ShieldCheck, Edit3, Trash2, Search, Loader2 } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import UserModal from "@/components/admin/UserModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";
import { User, Role } from "@/types";
import { getStoredUser } from "@/lib/auth";

// Import Server Actions yang sudah kita buat sebelumnya
import { 
  getAllUsersAction, 
  addUserAction, 
  updateUserAction, 
  deleteUserAction 
} from "@/lib/actions/users";

export default function KelolaUserPage() {
  // State Utama
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // State Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<User | null>(null);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  
  // State UI
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    sub?: string;
    type?: "success" | "error";
  } | null>(null);

  const currentUser = getStoredUser();

  // Fungsi memuat data dari Database
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsersAction();
      // Konversi data dari Prisma ke format state User[]
      setUsers(data as any);
      setFilteredUsers(data as any);
    } catch (error) {
      setToast({ message: "Gagal menyambungkan ke database", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Fungsi Search (Client Side)
  useEffect(() => {
    const results = users.filter(user => 
      user.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchQuery, users]);

  // Handler: Tambah User
  const handleAddUser = async (data: any) => {
    setIsSaving(true);
    try {
      await addUserAction(data);
      setToast({ 
        message: "Berhasil!", 
        sub: `${data.namaLengkap} telah ditambahkan ke sistem.`, 
        type: "success" 
      });
      setAddModal(false);
      loadUsers(); // Refresh data
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menambah user", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Edit User
  const handleEditUser = async (data: any) => {
    if (!editModal) return;
    setIsSaving(true);
    try {
      await updateUserAction(editModal.id, data);
      setToast({ message: "Perubahan berhasil disimpan!", type: "success" });
      setEditModal(null);
      loadUsers();
    } catch (err: any) {
      setToast({ message: "Gagal memperbarui data", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Hapus User
  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    setIsSaving(true);
    try {
      await deleteUserAction(deleteModal.id);
      setToast({ message: "User berhasil dihapus!", type: "success" });
      setDeleteModal(null);
      loadUsers();
    } catch (err: any) {
      setToast({ message: "Gagal menghapus user", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F2E]" style={{
      background: "radial-gradient(ellipse at 20% 10%, #1a2a6c 0%, #0D1B4B 40%, #0A0F2E 100%)",
    }}>
      {/* Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          subMessage={toast.sub}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modals */}
      {(addModal || editModal) && (
        <UserModal
          user={editModal}
          onSave={editModal ? handleEditUser : handleAddUser}
          onCancel={() => {
            setAddModal(false);
            setEditModal(null);
          }}
          isLoading={isSaving}
        />
      )}

      {deleteModal && (
        <ConfirmModal
          title="Hapus User"
          message={`Yakin ingin menghapus "${deleteModal.namaLengkap}"?`}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteModal(null)}
          isLoading={isSaving}
        />
      )}

      <AdminNavbar userName={currentUser?.namaLengkap || "Admin"} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Data Pengguna</h2>
            <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">
              Total {users.length} personil terdaftar
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Cari nama atau username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full md:w-64 transition-all"
              />
            </div>
            <button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-blue-400/50 gap-4">
            <Loader2 className="animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Menghubungkan ke Supabase...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid gap-4">
            {/* Table Header Hidden on Mobile */}
            <div className="hidden md:grid grid-cols-4 px-8 mb-2 opacity-40">
              {["Profil", "Username", "Status", "Aksi"].map(h => (
                <span key={h} className="text-[10px] font-black text-white uppercase tracking-widest text-center first:text-left">{h}</span>
              ))}
            </div>

            {/* List User */}
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-[2rem] p-4 md:px-8 md:py-6 grid grid-cols-1 md:grid-cols-4 items-center gap-4 group hover:translate-y-[-2px] transition-all duration-300 border border-transparent hover:border-blue-500/20 shadow-lg shadow-black/5"
              >
                {/* Profil */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                    {user.role === 'admin' ? <ShieldCheck size={24} /> : <UserCircle size={24} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-900 font-black text-sm truncate uppercase tracking-tight">{user.namaLengkap}</p>
                  </div>
                </div>

                {/* Username */}
                <div className="md:text-center">
                  <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">@{user.username}</span>
                </div>

                {/* Role */}
                <div className="md:text-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-blue-600' : 'text-gray-300'}`}>
                    {user.role}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center md:justify-center gap-2 pt-4 md:pt-0 border-t md:border-none border-gray-50">
                  <button
                    onClick={() => setEditModal(user)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-50 text-gray-600 p-3 md:px-4 md:py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all group/btn"
                  >
                    <Edit3 size={14} />
                    <span className="text-[10px] font-bold uppercase md:hidden lg:block">Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteModal(user)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-500 p-3 md:px-4 md:py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                  >
                    <Trash2 size={14} />
                    <span className="text-[10px] font-bold uppercase md:hidden lg:block">Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/5">
            <p className="text-white/20 font-black text-xs uppercase tracking-[0.2em]">Data tidak ditemukan</p>
          </div>
        )}
      </main>
    </div>
  );
}