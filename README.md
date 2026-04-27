# 🕒 Absensi App — Sistem Manajemen Presensi 

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-green)

## Anggota Tim

| No | Nama                             | NIM             | 
| -- | -------------------------------- | --------------- | 
| 1  | Khaelano Abroor Maulana          | 235150200111051 | 
| 2  | I Made Deva Satria Wiguna Giri   | 235150200111054 | 
| 3  | Zaqia Mahadewi                   | 235150201111001 | 
| 4  | Syafa Syakira Shalsabilla        | 235150201111006 | 
| 5  | Jonathan Salim                   | 235150207111065 | 
| 6  | Aero Nathanael Silalahi          | 235150207111001 | 
| 7  | Shafiyyah Daniswara Nurwijayanti | 235150207111057 | 
| 8  | Niquita Aislam Az Zahara         | 245150207111057 | 

Absensi App adalah aplikasi berbasis web yang dibangun dengan Next.js untuk mengelola kehadiran (presensi) pengguna secara digital. Aplikasi ini dirancang dengan arsitektur modern yang memisahkan peran antara Admin (untuk pengelolaan user dan laporan) dan User (untuk melakukan absensi harian).

---

## 🚀 Fitur Utama

### 🔐 Autentikasi & Keamanan (DevSecOps Focused)
Aplikasi ini telah melalui audit keamanan ketat dengan fokus pada mitigasi serangan umum:

- **Secure Login**: Perlindungan terhadap User Enumeration dan Timing Attacks.
- **Role-based Access Control (RBAC)**: Pemisahan hak akses antara Admin dan User melalui Middleware.
- **Password Hashing**: Menggunakan bcrypt dengan 12 salt rounds.
- **Input Validation**: Validasi skema data di sisi server menggunakan Zod.
- **Data Protection**: Query database menggunakan seleksi field eksplisit untuk mencegah kebocoran hash password ke client.

---

### 👨‍💼 Fitur User (Pegawai)

- **Dashboard Personal**: Melihat ringkasan kehadiran 
- **Presensi Harian**: Melakukan absensi (Masuk) yang mencatat tanggal, hari, dan jam secara real-time.
- **Status Kehadiran**: Sistem otomatis mencatat status (Hadir, Izin, Alpha).
- **Manajemen Akun**: Fitur lupa password dan reset password dengan kriteria keamanan tinggi.

---

### 🛠️ Fitur Admin (Management)

- **Panel Dashboard**: Statistik total pegawai dan ringkasan kehadiran hari ini.
- **Kelola User**: CRUD (Create, Read, Update, Delete) data pegawai secara aman.
- **Monitoring Presensi**: Melihat daftar riwayat absensi seluruh pegawai.

---

## 🏗️ Stack Teknologi

- **Framework**: Next.js 15 (App Router)
- **Bahasa**: TypeScript
- **Database ORM**: Prisma
- **Database**: PostgreSQL (via Supabase/Postgres)
- **Styling**: Tailwind CSS 4
- **Validasi**: Zod
- **Ikon**: Lucide React

---

## 📊 Skema Database (Prisma)

Aplikasi menggunakan dua model utama:
- User: Menyimpan informasi profil, kredensial, dan peran (admin/user).
- AbsensiRecord: Mencatat riwayat kehadiran yang terelasi dengan User melalui userId.
  
## 🛡️ Catatan Keamanan Penting

Berdasarkan Laporan Audit Keamanan terakhir:
- Pastikan untuk selalu melakukan Rotate Secrets jika .env sempat terekspos ke publik.
- Gunakan koneksi HTTPS saat deploy untuk mengamankan Strict Cookie.
- Selalu gunakan Zod untuk memvalidasi setiap Server Action baru.
