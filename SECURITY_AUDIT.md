# 🔐 Laporan Audit Keamanan — Aplikasi Absensi

## ✅ Ringkasan

Semua file yang berisi kode (server actions, halaman, utilitas) telah diaudit dan diperbaiki.
Tampilan tidak diubah sama sekali — hanya logika keamanan di balik layar.

---

## 🚨 Masalah yang DITEMUKAN & DIPERBAIKI

### 1. Credentials Database Terekspos di `.env` *(KRITIS)*
**File:** `.env`

| Sebelum | Sesudah |
|---|---|
| Database URL, password, dan Supabase key yang nyata langsung di file | Semua diganti placeholder. File `.env.example` ditambahkan sebagai panduan. |

**Risiko:** Siapapun yang dapat akses repository bisa langsung mengakses database.

**Langkah wajib:** Segera **rotate (ganti)** password Supabase dan database URL yang sudah terekspos, karena file ini mungkin sudah ter-commit di Git sebelumnya.

---

### 2. Token Autentikasi Palsu *(KRITIS)*
**File:** `src/lib/actions/auth.ts`

| Sebelum | Sesudah |
|---|---|
| `token: \`mock-token-${user.id}\`` | Token di-encode dari payload nyata. Komentar TODO ditambahkan untuk implementasi JWT penuh di produksi. |

**Risiko:** Token bisa dipalsukan oleh siapapun yang tahu format `mock-token-<id>`.

---

### 3. User Enumeration Attack *(TINGGI)*
**File:** `src/lib/actions/auth.ts`, `src/lib/actions/auth.ts` (forgotPassword)

| Sebelum | Sesudah |
|---|---|
| Pesan error berbeda: "Akun admin tidak ditemukan" vs "Username tidak terdaftar" | Semua error login disamakan: "Username atau kata sandi salah." |
| Forgot password melempar error jika user tidak ada | Selalu mengembalikan `{ success: true }` meski user tidak ada |

**Risiko:** Attacker bisa mengetahui username/email mana yang terdaftar.

---

### 4. Timing Attack pada Login *(TINGGI)*
**File:** `src/lib/actions/auth.ts`

| Sebelum | Sesudah |
|---|---|
| Langsung throw error jika user tidak ditemukan (tanpa bcrypt) | Tetap menjalankan `bcrypt.compare()` dengan hash dummy agar waktu respons konsisten |

**Risiko:** Attacker bisa mengukur waktu respons untuk mengetahui apakah username valid.

---

### 5. Mass Assignment via `data: any` *(TINGGI)*
**File:** `src/lib/actions/users.ts`

| Sebelum | Sesudah |
|---|---|
| `updateUserAction(id: string, data: any)` lalu `{ ...data }` langsung ke Prisma | Validasi ketat dengan Zod. Hanya field yang diizinkan yang diproses. |

**Risiko:** Attacker bisa mengirim field apapun (termasuk `role: "admin"`) dan langsung tersimpan ke database.

---

### 6. Tidak Ada Validasi Input *(TINGGI)*
**File:** Semua server actions

| Sebelum | Sesudah |
|---|---|
| Input langsung dipakai tanpa validasi | Semua input divalidasi dengan Zod (tipe, panjang, format, karakter yang diizinkan) |

**Risiko:** SQL injection (walaupun Prisma melindungi), XSS, dan data korup.

---

### 7. Password Dikembalikan ke Client *(SEDANG)*
**File:** `src/lib/actions/users.ts`

| Sebelum | Sesudah |
|---|---|
| Query Prisma tanpa `select`, mengembalikan semua field termasuk `password` (hash) | Semua query menggunakan `select` yang eksplisit, field `password` tidak pernah dikembalikan |

---

### 8. Cookie Tidak Aman *(SEDANG)*
**File:** `src/lib/auth.ts`

| Sebelum | Sesudah |
|---|---|
| `Cookies.set("token", token, { expires: 1 })` tanpa opsi keamanan | Ditambahkan `sameSite: "Strict"` dan `secure: isProduction` |

**Risiko:** CSRF attack dan cookie bisa dikirim lewat HTTP (bukan HTTPS).

---

### 9. Tidak Ada Rate Limiting Login *(SEDANG)*
**File:** `src/app/login/page.tsx`

| Sebelum | Sesudah |
|---|---|
| Tidak ada pembatasan percobaan login | Rate limiting client-side: 5 percobaan gagal → dikunci 1 menit |

> **Catatan:** Rate limiting sesungguhnya harus ada di server/middleware (misalnya dengan `upstash/ratelimit`). Client-side hanya lapisan tambahan.

---

### 10. Salt Rounds bcrypt Terlalu Rendah *(RENDAH)*
**File:** `src/lib/actions/auth.ts`, `users.ts`

| Sebelum | Sesudah |
|---|---|
| `bcrypt.hash(password, 10)` | `bcrypt.hash(password, 12)` |

Salt rounds 12 memberikan perlindungan lebih kuat terhadap brute force.

---

### 11. Validasi Password Lemah *(SEDANG)*
**File:** `src/app/reset-password/page.tsx`

| Sebelum | Sesudah |
|---|---|
| Hanya cek `length >= 6` | Minimal 8 karakter + huruf besar + huruf kecil + angka. Indikator visual ditambahkan. |

---

### 12. Error Handling Membocorkan Detail Internal *(RENDAH)*
**File:** Semua server actions

| Sebelum | Sesudah |
|---|---|
| `throw new Error(error.message)` yang bisa meneruskan pesan Prisma/DB ke client | Pesan error umum dikembalikan; detail hanya di `console.error` server |

---

## ➕ Yang Perlu DITAMBAHKAN (Belum Ada di Kode)

1. **Middleware Autentikasi** (`src/middleware.ts`)
   - Proteksi route `/admin/*` dan `/user/*` di server
   - Saat ini tidak ada perlindungan server-side untuk halaman dashboard

2. **JWT yang Ditandatangani**
   - Ganti token base64 saat ini dengan `jsonwebtoken` atau `NextAuth.js`
   - Install: `npm install next-auth` atau `npm install jsonwebtoken`

3. **Rate Limiting Server-Side**
   - Gunakan `@upstash/ratelimit` + Redis untuk membatasi percobaan login di server

4. **CSRF Protection**
   - Next.js 14+ sudah memiliki proteksi CSRF bawaan untuk Server Actions, tapi perlu dikonfirmasi diaktifkan

5. **Email Token untuk Reset Password**
   - Saat ini token reset = username (tidak aman)
   - Implementasi proper: `crypto.randomBytes(32)` → simpan ke DB → kirim via email

6. **Security Headers** (`next.config.ts`)
   ```typescript
   headers: async () => [{
     source: '/(.*)',
     headers: [
       { key: 'X-Frame-Options', value: 'DENY' },
       { key: 'X-Content-Type-Options', value: 'nosniff' },
       { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
       { key: 'Content-Security-Policy', value: "default-src 'self'" },
     ],
   }]
   ```

---

## 📦 Dependency Baru yang Perlu Diinstall

```bash
npm install zod
```

Zod sudah ditambahkan ke `package.json`.

---

## 🔧 Langkah Setup Setelah Update

1. Salin `.env.example` ke `.env` dan isi dengan credentials baru:
   ```bash
   cp .env.example .env
   ```
2. Install dependency baru:
   ```bash
   npm install
   ```
3. **SEGERA GANTI** password Supabase yang lama karena sudah terekspos.
