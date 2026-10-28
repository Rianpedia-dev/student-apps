# 🧪 Rencana Komprehensif Unit & Integration Testing — Student Apps
## Al-Azhar Cairo Palembang

> **Target Aplikasi**: 1.500+ Pengguna Aktif (Siswa SD/SMP, Guru, Wali Kelas, Admin, Super Admin)  
> **Testing Stack**: Vitest 5.0 + TypeScript + Mock Prisma + Node 22  
> **Status Saat Ini**: 26 Berkas Test (175 Tests Lolos 100%) — Seluruh 10 Test Suite Baru Tuntas Diuji

---

## 📑 DAFTAR ISI
1. [Ringkasan Eksekutif & Sasaran Pengujian](#1-ringkasan-eksekutif--sasaran-pengujian)
2. [Audit Cakupan Uji Saat Ini vs Kesenjangan (Gap Analysis)](#2-audit-cakupan-uji-saat-ini-vs-kesenjangan-gap-analysis)
3. [Arsitektur & Piramida Pengujian](#3-arsitektur--piramida-pengujian)
4. [Daftar Rinci Test Suite Baru (10 Modul Pengujian)](#4-daftar-rinci-test-suite-baru-10-modul-pengujian)
   - [Suite 1: Autentikasi, Sesi & Isolasi Multi-Jenjang RBAC](#suite-1-autentikasi-sesi--isolasi-multi-jenjang-rbac)
   - [Suite 2: Master Akademik & Logika Bentrok Jadwal](#suite-2-master-akademik--logika-bentrok-jadwal)
   - [Suite 3: Mesin Absensi, Matriks Harian & Kalkulasi Rekapitulasi](#suite-3-mesin-absensi-matriks-harian--kalkulasi-rekapitulasi)
   - [Suite 4: Sistem Penugasan, Penilaian Otomatis & Alur Revisi](#suite-4-sistem-penugasan-penilaian-otomatis--alur-revisi)
   - [Suite 5: Obrolan Real-Time & Keamanan Token Socket.IO](#suite-5-obrolan-real-time--keamanan-token-socketio)
   - [Suite 6: Pertemuan Belajar & Progres Kelulusan Materi](#suite-6-pertemuan-belajar--progres-kelulusan-materi)
   - [Suite 7: Buku Kedisiplinan & Pencatatan Prestasi Siswa](#suite-7-buku-kedisiplinan--pencatatan-prestasi-siswa)
   - [Suite 8: Rute API Serverless & Proteksi Endpoint](#suite-8-rute-api-serverless--proteksi-endpoint)
   - [Suite 9: Validasi Schema Zod & Sanitasi Input](#suite-9-validasi-schema-zod--sanitasi-input)
   - [Suite 10: Multi-Layer Caching, Rate Limit & Telemetri](#suite-10-multi-layer-caching-rate-limit--telemetri)
5. [Standar Pola Mocking (Mocking Conventions)](#5-standar-pola-mocking-mocking-conventions)
6. [Roadmap Implementasi Bertahap (4 Fase)](#6-roadmap-implementasi-bertahap-4-fase)
7. [Checklist Kualitas & Metrik Ambang Batas (Coverage SLA)](#7-checklist-kualitas--metrik-ambang-batas-coverage-sla)

---

## 1. 🎯 Ringkasan Eksekutif & Sasaran Pengujian

Aplikasi Student Apps Al-Azhar Cairo Palembang menangani operasional harian sekolah skala menengah-besar (1.500+ pengguna) yang memiliki dua entitas jenjang sekolah: **SD Islam Al-Azhar 44** dan **SMP Islam Al-Azhar 33**.

### Sasaran Utama Rencana Testing:
1. **Zero Regression pada Logika Akademik**: Perhitungan absensi, rekap nilai, kalkulasi passing grade, dan penjadwalan tidak boleh salah hitung.
2. **Isolasi Data yang Kuat (Data Leak Prevention)**: Data siswa/guru SD tidak boleh bocor ke Admin SMP, dan sebaliknya.
3. **Integritas Penugasan (Cheating & Exploit Prevention)**: Pengacakan soal, pengacakan opsi jawaban, batas waktu deadline, dan verifikasi skor otomatis wajib teruji secara matematis.
4. **Ketahanan Beban & Real-Time**: Token capability socket tidak dapat dipalsukan, dan cache layer tidak boleh mengembalikan data usang setelah mutasi.

---

## 2. 🔍 Audit Cakupan Uji Saat Ini vs Kesenjangan (Gap Analysis)

| Area Fungsional | Status Saat Ini | Kesenjangan (Gap yang Harus Ditambahkan) | Prioritas |
|---|---|---|---|
| **Auth & Session** | 🟢 Sebagian (32 tests) | Verifikasi akun status 0 (pending), switch activeJenjang superadmin, brute force lock | P0 |
| **User & Teacher Import** | 🟢 Dasar (4 tests) | Validasi duplikasi NIY/NIS, normalisasi gender, fallback password aman | P1 |
| **Absensi (Attendance)** | 🟡 Terbatas (6 tests) | Matriks absensi wali kelas, rekap bulanan, kalkulasi persentase kehadiran, izin/sakit seharian | P0 |
| **Tugas & Lembar Kerja** | 🟡 Terbatas (7 tests) | Penilaian otomatis pilihan ganda/esai, pengacakan opsi, revisi berkas berulang | P0 |
| **Materi & Pertemuan** | 🔴 Belum Ada | Tracking `is_completed` siswa, publish/unpublish materi, link eksternal video | P1 |
| **Real-Time Chat** | 🔴 Belum Ada | Token capability JWT HS256, isolasi room siswa-guru, soft-delete pesan, unread badge | P0 |
| **Buku Kedisiplinan & Prestasi** | 🔴 Belum Ada | Point penambahan/pengurangan, filter kategori pelanggaran ringan/berat | P2 |
| **API Endpoints (`/api/*`)** | 🟡 Terbatas (1 test) | `/api/socket-token`, `/api/kelas-online/end-room`, `/api/upload` | P1 |
| **Zod Schema Validators** | 🟢 Baik (11 tests) | Edge cases: format tanggal, string kosong, file size bounds, special character | P2 |
| **Cache & Performance** | 🟢 Baik (7 tests) | Invalidation hook pada mutasi materi, tugas, dan jadwal | P1 |

---

## 3. 🏛️ Arsitektur & Piramida Pengujian

```
                     / \
                    /   \     E2E / Load Tests (k6 smoke test & browser flows)
                   /     \    ~ 5% dari total pengujian
                  /-------\
                 /         \   Integration Tests (Server Actions + Services)
                /           \  ~ 35% dari total pengujian
               /-------------\
              /               \ Unit Tests (Logika Murni, Validators, Utils, Helpers)
             /                 \ ~ 60% dari total pengujian
            /-------------------\
```

- **Runner**: Vitest (lingkungan Node.js tercepat berbasis worker threads).
- **Format**: File berekstensi `.test.ts` diletakkan di `test/unit/` dan `test/integration/`.
- **Eksekusi**: `npm run test` (single run) atau `npm run test:watch` (TDD mode).

---

## 4. 📋 Daftar Rinci Test Suite Baru (10 Modul Pengujian)

### Suite 1: Autentikasi, Sesi & Isolasi Multi-Jenjang RBAC
**Target File**: `test/unit/auth-rbac.test.ts`  
**Modul Diuji**: `src/lib/auth.ts`, `src/lib/auth-guard.ts`, `src/lib/jenjang.ts`

- [x] **Test 1.1**: Akun dengan status `"0"` (belum diverifikasi admin) wajib ditolak login dengan pesan error edukatif.
- [x] **Test 1.2**: User dengan role `"admin"` jenjang `"SD"` tidak boleh memiliki hak akses membaca rute atau data jenjang `"SMP"`.
- [x] **Test 1.3**: Super Admin (`jenjang: "ALL"`) dapat berganti active jenjang (`SD` -> `SMP` -> `ALL`) via cookie sesi secara aman.
- [x] **Test 1.4**: Token JWT sesi yang diubah manual (signature tampering) wajib ditolak oleh `verifySessionToken`.
- [x] **Test 1.5**: *Transparent Lazy Migration*: Login pengguna lama dengan password plaintext otomatis meng-upgrade hash ke Bcrypt 12 dan mengosongkan kolom `password1`.
- [x] **Test 1.6**: Demo login diblokir total jika `process.env.NODE_ENV === "production"` dan `ENABLE_DEMO_MODE !== "true"`.

---

### Suite 2: Master Akademik & Logika Bentrok Jadwal
**Target File**: `test/unit/academic-services.test.ts`  
**Modul Diuji**: `src/services/subject.service.ts`, `src/services/class.service.ts`

- [x] **Test 2.1**: Mengurutkan jadwal pelajaran secara kronologis berdasarkan hari (`Senin` s/d `Sabtu`) dan jam mulai (`jam_mulai`).
- [x] **Test 2.2**: Deteksi bentrok jadwal guru: Mencegah guru yang sama mengajar di dua kelas berbeda pada jam dan hari yang sama.
- [x] **Test 2.3**: Deteksi bentrok jadwal kelas: Mencegah satu rombel kelas memiliki dua mata pelajaran berbeda pada jam yang sama.
- [x] **Test 2.4**: Filter mata pelajaran sesuai jenjang: Siswa SD hanya melihat mapel bertanda `"SD"` atau `"SEMUA"`.
- [x] **Test 2.5**: Parsing file Excel impor kelas: Berhasil mendeteksi otomatis kolom nama kelas, tingkat (grade 1-9), dan jenjang.

---

### Suite 3: Mesin Absensi, Matriks Harian & Kalkulasi Rekapitulasi
**Target File**: `test/unit/attendance-engine.test.ts`  
**Modul Diuji**: `src/services/attendance.service.ts`, `src/actions/admin-attendance.ts`

- [x] **Test 3.1**: Kalkulasi statistik rekapitulasi kehadiran (Total Hadir, Sakit, Izin, Alpa, dan Persentase % Kehadiran).
- [x] **Test 3.2**: Fitur "Izin / Sakit Seharian" oleh Wali Kelas: Otomatis mendistribusikan status izin ke seluruh jam pelajaran di hari yang sama.
- [x] **Test 3.3**: Rekap bulanan siswa: Mengelompokkan kehadiran siswa berdasarkan bulan (`YYYY-MM`) secara tepat.
- [x] **Test 3.4**: Batch upsert absensi: Mencegah duplikasi data absensi untuk kombinasi `(user_id, mapel_id, date)` yang sama.
- [x] **Test 3.5**: Export absensi ke lembar kerja Excel: Memastikan header, rekapitulasi angka, dan styling ter-generate tanpa korupsi berkas.

---

### Suite 4: Sistem Penugasan, Penilaian Otomatis & Alur Revisi
**Target File**: `test/unit/assignment-engine.test.ts`  
**Modul Diuji**: `src/actions/assignment.ts`, komponen builder & runner

- [x] **Test 4.1**: Penilaian otomatis pilihan ganda: Memeriksa jawaban siswa terhadap kunci jawaban dan menghitung skor proporsional terhadap bobot poin soal.
- [x] **Test 4.2**: Pengacakan soal (`acak_soal = true`): Siswa yang berbeda menerima urutan nomor soal acak dengan seed deterministik.
- [x] **Test 4.3**: Pengacakan opsi jawaban (`acak_opsi = true`): Label A, B, C, D diacak posisinya tanpa merusak penanda opsi yang benar.
- [x] **Test 4.4**: Deadline guard: Mencegah pengiriman tugas (`submitTaskAction`) setelah melewati batas waktu jika pengumpulan terlambat dilarang.
- [x] **Test 4.5**: Alur revisi lembar kerja: Guru mengirim instruksi perbaikan -> status submission berubah menjadi `"revisi"` -> siswa dapat submit ulang berkas.
- [x] **Test 4.6**: Penilaian lembar kerja kanvas: Menyimpan metadata coretan kanvas (vektor anotasi) dan nilai manual guru.

---

### Suite 5: Obrolan Real-Time & Keamanan Token Socket.IO
**Target File**: `test/unit/chat-realtime.test.ts`  
**Modul Diuji**: `src/actions/chat.ts`, `src/hooks/use-socket.ts`, `server/socket-server.cjs`

- [x] **Test 5.1**: Penerbitan Socket Capability Token: Menghasilkan token JWT HS256 dengan payload `scope: "socket"`, TTL 15 menit, dan user ID terverifikasi.
- [x] **Test 5.2**: Boundary Proteksi Chat: Siswa hanya dapat membuka room chat dengan Guru (menolak inisiasi chat antar sesama siswa).
- [x] **Test 5.3**: Anti-Spoofing: Pesan yang dikirim melalui socket server SELALU menggunakan sender ID dari token terverifikasi, bukan dari payload klien.
- [x] **Test 5.4**: Soft-delete pesan: Pesan yang dihapus berubah status menjadi `is_deleted = true` dan isi teks disamarkan menjadi *"Pesan ini telah dihapus"*.
- [x] **Test 5.5**: Pengambilan riwayat pesan dengan paginasi (`limit` / `take: 100`) untuk mencegah kehabisan memori server.

---

### Suite 6: Pertemuan Belajar & Progres Kelulusan Materi
**Target File**: `test/unit/pertemuan-progress.test.ts`  
**Modul Diuji**: `src/actions/pertemuan.ts`

- [x] **Test 6.1**: Toggle kelulusan materi (`togglePertemuanProgress`): Menandai siswa telah menyelesaikan materi dan mencatat `completed_at`.
- [x] **Test 6.2**: Filter materi yang terpublikasi (`is_published`): Siswa hanya dapat melihat materi yang sudah di-publish oleh guru.
- [x] **Test 6.3**: Penggandaan materi ke rombel kelas paralel: Menyalin data pertemuan ke kelas lain tanpa merusak relasi foreign key guru dan mapel.

---

### Suite 7: Buku Kedisiplinan & Pencatatan Prestasi Siswa
**Target File**: `test/unit/violations-achievements.test.ts`  
**Modul Diuji**: `src/actions/guru.ts`, `src/actions/admin.ts`

- [x] **Test 7.1**: Pencatatan pelanggaran siswa: Mengurangi poin kedisiplinan akun siswa sesuai kategori pelanggaran (Ringan, Sedang, Berat).
- [x] **Test 7.2**: Pencatatan prestasi siswa: Menambah poin keaktifan siswa dan mengoptimasi foto penghargaan ke format WebP.
- [x] **Test 7.3**: Validasi penghapusan catatan kedisiplinan: Mengembalikan poin siswa ke nilai semula saat catatan pelanggaran dibatalkan/dihapus.

---

### Suite 8: Rute API Serverless & Proteksi Endpoint
**Target File**: `test/unit/api-routes.test.ts`  
**Modul Diuji**: `src/app/api/health/route.ts`, `src/app/api/socket-token/route.ts`, `src/app/api/upload/route.ts`

- [x] **Test 8.1**: Endpoint `/api/health`: Mengembalikan status 200 OK dengan metrik memori (RSS/Heap), latensi database, dan status cache.
- [x] **Test 8.2**: Endpoint `/api/health` saat database down: Mengembalikan status 503 Service Unavailable dan status `"degraded"`.
- [x] **Test 8.3**: Endpoint `/api/socket-token`: Menolak permintaan jika request tidak menyertakan cookie sesi yang sah (401 Unauthorized).
- [x] **Test 8.4**: Endpoint `/api/upload`: Menolak file berbahaya (berkas executable `.exe`, skrip `.php`, atau berkas melebihi ukuran batas maksimum).

---

### Suite 9: Validasi Schema Zod & Sanitasi Input
**Target File**: `test/unit/zod-validators-extended.test.ts`  
**Modul Diuji**: Seluruh skema di `src/lib/validators/`

- [x] **Test 9.1**: Validasi format email institusi dan nomor induk (NIY 18 digit, NIS 9-10 digit).
- [x] **Test 9.2**: Validasi jam jadwal pelajaran (Format wajib `"HH:mm"`, misal `"07:30"` s/d `"09:00"`).
- [x] **Test 9.3**: Validasi input sanitasi: Mengamankan karakter HTML berbahaya (anti-XSS) pada judul materi dan deskripsi pengumuman.

---

### Suite 10: Multi-Layer Caching, Rate Limit & Telemetri
**Target File**: `test/unit/cache-performance.test.ts`  
**Modul Diuji**: `src/lib/cache.ts`, `src/lib/rate-limit.ts`, `src/lib/metrics.ts`

- [x] **Test 10.1**: `AppCache.getOrSet`: Mengembalikan data cache seketika (<1ms) pada pemanggilan kedua tanpa menyentuh database.
- [x] **Test 10.2**: Invalidasi berbasis tag: Memanggil `AppCache.invalidateTag("mapel")` membersihkan seluruh cache mapel terdistribusi.
- [x] **Test 10.3**: Sliding Window Rate Limiter: Membatasi percobaan login maksimal 5 kali dalam 15 menit per identifier.
- [x] **Test 10.4**: Metrics Collector: Menghitung persentil P95 dan rata-rata durasi permintaan secara real-time.

---

## 5. 🛠️ Standar Pola Mocking (Mocking Conventions)

Untuk memastikan unit test berjalan super cepat (< 3 detik) tanpa ketergantungan koneksi jaringan luar, terapkan pola mocking seragam:

### 5.1 Mocking Prisma ORM
```typescript
import { vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    absen: {
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));
```

### 5.2 Mocking Next.js Cookies & Session
```typescript
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "mock-valid-token" }),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));
```

---

## 6. 📅 Roadmap Implementasi Bertahap (4 Fase)

```
[Minggu 1: Fondasi Kritis] -> [Minggu 2: Alur Akademik] -> [Minggu 3: Fitur Interaktif] -> [Minggu 4: E2E & Stres]
      (Suite 1 & 8)                (Suite 2 & 3)                 (Suite 4, 5, 6, 7)          (Load & CI/CD)
```

| Fase | Target Modul Pengujian | Estimasi Berkas | Target Output |
|---|---|---|---|
| **Fase A: Keamanan & API (P0)** | Suite 1 (Auth & RBAC), Suite 8 (API Routes), Suite 9 (Zod) | 3 berkas test baru | Proteksi hak akses & rute API 100% aman |
| **Fase B: Inti Akademik (P0)** | Suite 2 (Jadwal & Kelas), Suite 3 (Mesin Absensi) | 2 berkas test baru | Kalkulasi kehadiran & jadwal anti-bentrok |
| **Fase C: Penugasan & Chat (P1)**| Suite 4 (Tugas & Nilai), Suite 5 (Chat Socket), Suite 6 (Materi) | 3 berkas test baru | Penilaian akurat & transmisi pesan real-time |
| **Fase D: Disiplin & Performa (P1)**| Suite 7 (Pelanggaran/Prestasi), Suite 10 (Cache/Rate Limit) | 2 berkas test baru | Stabilitas sistem di bawah beban 1.500 user |

---

## 7. 📊 Checklist Kualitas & Metrik Ambang Batas (Coverage SLA)

Ambang batas minimum kelulusan (*quality gate*) pada pipeline CI/CD:

- [x] **Statements Coverage**: Minimal **85%** pada layer `src/services/`
- [x] **Branches Coverage**: Minimal **80%** pada logika otorisasi peran & validasi
- [x] **Functions Coverage**: Minimal **90%** pada fungsi kalkulasi utilitas (`utils.ts`, `serializer.ts`, `image-optimizer.ts`)
- [x] **Durasi Eksekusi**: Seluruh rangkaian unit test harus tuntas dalam waktu **< 5 detik** di mesin lokal.
- [x] **Zero Flaky Tests**: Tidak ada pengujian yang gagal secara sporadis karena faktor pewaktu asinkron (*asynchronous timing*).

---
*Dokumen ini dirancang sebagai panduan teknis operasional pengujian aplikasi Student Apps Al-Azhar Cairo Palembang untuk menjamin kesiapan penuh operasional produksi.*
