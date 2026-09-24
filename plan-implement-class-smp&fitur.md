# Plan Implementasi: Chat Guru-Murid, Pengumpulan & Koreksi Tugas In-Browser, Kelas SMP, dan Modul Mata Pelajaran — Student Apps

> **Versi Dokumen:** 1.0  
> **Tanggal:** 24 September 2026  
> **Target Aplikasi:** Student Apps — SD & SMP Islam Al-Azhar Cairo Palembang  
> **Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Prisma ORM + MySQL + Web APIs / Canvas  

---

## Ringkasan Eksekutif

Dokumen ini adalah rencana implementasi teknis (*Actionable Implementation Plan*) untuk menambahkan 4 pilar fitur penting ke dalam **Student Apps**:

1. **Dukungan Jenjang SMP (Sekolah Menengah Pertama)**: Menambahkan rombel Kelas 7, 8, dan 9 (nama rombel ilmuwan Islam) melengkapi rombel SD (Kelas 4, 5, 6), termasuk penyesuaian filter jenjang (*SD vs SMP*) pada manajemen pengguna, kelas, dan hak akses guru bidang studi.
2. **Manajemen Mata Pelajaran (Mapel) & Jadwal**: Menghadirkan entitas Mata Pelajaran di setiap kelas dan widget interaktif *"Mata Pelajaran Saya"* di dashboard siswa lengkap dengan guru pengampu, silabus, dan jadwal harian.
3. **Pengumpulan Tugas & Koreksi Langsung In-Browser (Tanpa Download)**: Siswa dapat mengunggah tugas dalam format PDF atau gambar PNG/JPG. Guru dapat langsung mereview dokumen secara *inline* (split-screen viewer), memberikan coretan/catatan perbaikan, input nilai 0–100, dan umpan balik tanpa perlu mengunduh file ke penyimpanan lokal.
4. **Chat Interaktif Murid & Guru**: Saluran komunikasi langsung (1-on-1) dan konsultasi materi antara siswa dan guru (wali kelas maupun guru bidang studi) dengan dukungan pesan teks, lampiran gambar, status terbaca (*read receipts*), dan indikator pesan belum dibaca.

---

## 1. Arsitektur Data & Skema Database (Prisma)

### 1.1. Diagram Entitas Relasi (ERD)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────┐
│      User       │       │      Kelas      │       │    MataPelajaran    │
├─────────────────┤       ├─────────────────┤       ├─────────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)             │
│ name, email     │◀─────▶│ nama_kelas      │       │ kode_mapel (e.g MTK)│
│ role (siswa/guru│       │ jenjang (SD/SMP)│◀──┐   │ nama_mapel          │
│ kelas, nis/nip  │       │ wali_kelas      │   │   │ jenjang (SD/SMP/ALL)│
│ guru_bidang     │       │ kode_restrict   │   │   │ icon, warna         │
└────────┬────────┘       └────────┬────────┘   │   └──────────┬──────────┘
         │                         │            │              │
         │ 1:N                     │ 1:N        │              │ 1:N
         ▼                         ▼            │              ▼
┌─────────────────┐       ┌─────────────────┐   │   ┌─────────────────────┐
│  JadwalMapel    │───────│      Tugas      │   └───│    JadwalMapel      │
├─────────────────┤       ├─────────────────┤       ├─────────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)             │
│ kelas_id ───────┼───────│ kelas_id        │       │ mapel_id ───────────┘
│ mapel_id ───────┼───────│ mapel_id        │       │ hari, jam_mulai     │
│ guru_id ────────┘       │ guru_id         │       │ jam_selesai, ruang  │
└─────────────────┘       │ judul, deadline │       └─────────────────────┘
                          │ file_petunjuk   │
                          └────────┬────────┘
                                   │ 1:N
                                   ▼
                          ┌───────────────────────┐
                          │    TugasSubmission    │
                          ├───────────────────────┤
                          │ id (PK)               │
                          │ tugas_id (FK)         │
                          │ siswa_id (FK)         │
                          │ file_url (PDF/PNG)    │
                          │ file_type (pdf/png)   │
                          │ status (dikumpul/dll) │
                          │ nilai (0 - 100)       │
                          │ catatan_guru          │
                          │ annotated_file_url    │
                          │ submitted_at          │
                          │ graded_at             │
                          └───────────────────────┘

┌─────────────────┐       ┌────────────────────────┐
│    ChatRoom     │1:N    │      ChatMessage       │
├─────────────────┤       ├────────────────────────┤
│ id (PK)         │◀─────▶│ id (PK)                │
│ type (DIRECT)   │       │ room_id (FK)           │
│ user_one_id (FK)│       │ sender_id (FK)         │
│ user_two_id (FK)│       │ message (text)         │
│ last_message_at │       │ attachment_url         │
│ created_at      │       │ is_read (boolean)      │
└─────────────────┘       │ read_at (datetime)     │
                          └────────────────────────┘
```

---

### 1.2. Penambahan Model di `prisma/schema.prisma`

```prisma
// ============================================
// 1. UPDATE MODEL KELAS: Menambahkan Field Jenjang
// ============================================
model Kelas {
  id            BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  nama_kelas    String    @map("nama-kelas") @db.VarChar(255)
  jenjang       String    @default("SD") @db.VarChar(20) // "SD" | "SMP"
  tingkat       Int?      @default(4) // 4, 5, 6 (SD) atau 7, 8, 9 (SMP)
  wali_kelas    String?   @map("wali-kelas") @db.VarChar(255)
  jumlah_siswa  String?   @map("jumlah-siswa") @db.VarChar(255)
  code_restrict String?   @map("code-restrict") @db.VarChar(255)
  kode_restrict String?   @map("kode-restrict") @db.VarChar(255)
  created_at    DateTime? @db.Timestamp(0)
  updated_at    DateTime? @updatedAt @db.Timestamp(0)

  jadwal        JadwalPelajaran[]
  tugas         Tugas[]

  @@map("tbl_kelas")
}

// ============================================
// 2. MASTER MATA PELAJARAN
// ============================================
model MataPelajaran {
  id          BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  kode_mapel  String    @unique @db.VarChar(50)  // Contoh: "PAI-SD", "MTK-SMP", "IPA-SMP"
  nama_mapel  String    @db.VarChar(255)         // Contoh: "Pendidikan Agama Islam", "Matematika"
  jenjang     String    @default("SEMUA") @db.VarChar(20) // "SD" | "SMP" | "SEMUA"
  deskripsi   String?   @db.Text
  icon        String?   @default("BookOpen") @db.VarChar(100)
  warna       String?   @default("emerald") @db.VarChar(50) // theme badge: "emerald", "blue", "amber", "indigo"
  created_at  DateTime? @default(now()) @db.Timestamp(0)
  updated_at  DateTime? @updatedAt @db.Timestamp(0)

  jadwal      JadwalPelajaran[]
  tugas       Tugas[]

  @@map("tbl_mata_pelajaran")
}

// ============================================
// 3. JADWAL MATA PELAJARAN PER KELAS
// ============================================
model JadwalPelajaran {
  id          BigInt        @id @default(autoincrement()) @db.UnsignedBigInt
  kelas_id    BigInt        @db.UnsignedBigInt
  mapel_id    BigInt        @db.UnsignedBigInt
  guru_id     BigInt        @db.UnsignedBigInt
  hari        String        @db.VarChar(20) // "Senin", "Selasa", "Rabu", "Kamis", "Jumat"
  jam_mulai   String        @db.VarChar(10) // "07:30"
  jam_selesai String        @db.VarChar(10) // "09:00"
  ruang       String?       @db.VarChar(100)
  created_at  DateTime?     @default(now()) @db.Timestamp(0)
  updated_at  DateTime?     @updatedAt @db.Timestamp(0)

  kelas       Kelas         @relation(fields: [kelas_id], references: [id], onDelete: Cascade)
  mapel       MataPelajaran @relation(fields: [mapel_id], references: [id], onDelete: Cascade)
  guru        User          @relation(fields: [guru_id], references: [id], onDelete: Cascade)

  @@index([kelas_id, hari])
  @@index([guru_id])
  @@map("tbl_jadwal_pelajaran")
}

// ============================================
// 4. SISTEM TUGAS & PENGUMPULAN (ASSIGNMENT)
// ============================================
model Tugas {
  id             BigInt            @id @default(autoincrement()) @db.UnsignedBigInt
  kelas_id       BigInt            @db.UnsignedBigInt
  mapel_id       BigInt            @db.UnsignedBigInt
  guru_id        BigInt            @db.UnsignedBigInt
  judul          String            @db.VarChar(255)
  deskripsi      String            @db.Text
  file_petunjuk  String?           @db.VarChar(500) // lampiran materi/soal dari guru
  deadline       DateTime          @db.Timestamp(0)
  poin_maksimal  Int               @default(100)
  status         String            @default("aktif") @db.VarChar(30) // "aktif" | "ditutup"
  created_at     DateTime?         @default(now()) @db.Timestamp(0)
  updated_at     DateTime?         @updatedAt @db.Timestamp(0)

  kelas          Kelas             @relation(fields: [kelas_id], references: [id], onDelete: Cascade)
  mapel          MataPelajaran     @relation(fields: [mapel_id], references: [id], onDelete: Cascade)
  guru           User              @relation(fields: [guru_id], references: [id], onDelete: Cascade)
  submissions    TugasSubmission[]

  @@index([kelas_id, status])
  @@index([guru_id])
  @@map("tbl_tugas")
}

model TugasSubmission {
  id                 BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  tugas_id           BigInt    @db.UnsignedBigInt
  siswa_id           BigInt    @db.UnsignedBigInt
  file_url           String    @db.VarChar(500) // Lokasi file PDF atau PNG/JPG yang diupload siswa
  file_name          String    @db.VarChar(255)
  file_type          String    @db.VarChar(50)  // "pdf" | "png" | "jpg" | "jpeg"
  file_size          Int?                       // Ukuran dalam byte
  catatan_siswa      String?   @db.Text
  status             String    @default("menunggu_penilaian") @db.VarChar(50) 
  // status enum: "menunggu_penilaian" | "sudah_dinilai" | "perlu_revisi" | "terlambat"
  nilai              Float?                     // Nilai 0.00 - 100.00
  catatan_guru       String?   @db.Text         // Feedback komentar guru
  annotated_file_url String?   @db.VarChar(500) // File preview hasil coretan/anotasi (opsional)
  submitted_at       DateTime  @default(now()) @db.Timestamp(0)
  graded_at          DateTime? @db.Timestamp(0)
  graded_by          BigInt?   @db.UnsignedBigInt

  tugas              Tugas     @relation(fields: [tugas_id], references: [id], onDelete: Cascade)
  siswa              User      @relation(fields: [siswa_id], references: [id], onDelete: Cascade)

  @@unique([tugas_id, siswa_id], map: "unique_submission_per_siswa")
  @@index([tugas_id, status])
  @@index([siswa_id])
  @@map("tbl_tugas_submission")
}

// ============================================
// 5. SISTEM CHAT MURID & GURU
// ============================================
model ChatRoom {
  id              BigInt        @id @default(autoincrement()) @db.UnsignedBigInt
  type            String        @default("DIRECT") @db.VarChar(30) // "DIRECT" (1-on-1) atau "KELAS"
  user_one_id     BigInt        @db.UnsignedBigInt // Siswa atau Guru
  user_two_id     BigInt        @db.UnsignedBigInt // Guru atau Siswa
  last_message    String?       @db.Text
  last_message_at DateTime?     @default(now()) @db.Timestamp(0)
  created_at      DateTime?     @default(now()) @db.Timestamp(0)
  updated_at      DateTime?     @updatedAt @db.Timestamp(0)

  userOne         User          @relation("ChatUserOne", fields: [user_one_id], references: [id], onDelete: Cascade)
  userTwo         User          @relation("ChatUserTwo", fields: [user_two_id], references: [id], onDelete: Cascade)
  messages        ChatMessage[]

  @@unique([user_one_id, user_two_id], map: "unique_chat_pair")
  @@index([user_one_id])
  @@index([user_two_id])
  @@index([last_message_at])
  @@map("tbl_chat_rooms")
}

model ChatMessage {
  id              BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  room_id         BigInt    @db.UnsignedBigInt
  sender_id       BigInt    @db.UnsignedBigInt
  message         String    @db.Text
  attachment_url  String?   @db.VarChar(500)
  attachment_type String?   @db.VarChar(50) // "image" | "file"
  is_read         Boolean   @default(false)
  read_at         DateTime? @db.Timestamp(0)
  created_at      DateTime? @default(now()) @db.Timestamp(0)

  room            ChatRoom  @relation(fields: [room_id], references: [id], onDelete: Cascade)
  sender          User      @relation(fields: [sender_id], references: [id], onDelete: Cascade)

  @@index([room_id, created_at])
  @@index([sender_id])
  @@index([is_read])
  @@map("tbl_chat_messages")
}
```

---

## 2. Fitur 1: Penambahan Kelas SMP & Multi-Jenjang (SD & SMP)

### 2.1. Standar Penamaan Rombel Al-Azhar Cairo (SD & SMP)

| Jenjang | Tingkat | Rombongan Belajar (Rombel) | Wali Kelas / Fokus |
| :--- | :--- | :--- | :--- |
| **SD** | Kelas 4 | Mehmed Al Fatih, Sayfuddin Al Quthuz, Sholahuddin Al Ayubi, Sulaiman Al Qanuni, Mushab bin Umair | Tematik & Diniyah |
| **SD** | Kelas 5 | Al Bukhari, Muslim, Abu Daud, Tirmidzi, An Nasa'i | Tematik & Hadits |
| **SD** | Kelas 6 | Tholhah bin Ubaidillah, Anas bin Malik, Jabir bin Abdillah, Mu'adz bin Jabal, Urwah bin Zubair | Tematik & Persiapan Ujian |
| **SMP** | **Kelas 7** | **Kelas 7 - Ibnu Sina**<br>**Kelas 7 - Al Khawarizmi**<br>**Kelas 7 - Al Biruni**<br>**Kelas 7 - Jabir Ibnu Hayyan** | Transisi SMP & Saintis Muslim |
| **SMP** | **Kelas 8** | **Kelas 8 - Ibnu Khaldun**<br>**Kelas 8 - Al Razi**<br>**Kelas 8 - Al Kindi**<br>**Kelas 8 - Ibnu Battuta** | Pengembangan Keilmuan Sosial & Sains |
| **SMP** | **Kelas 9** | **Kelas 9 - Al Farabi**<br>**Kelas 9 - Tariq bin Ziyad**<br>**Kelas 9 - Salahuddin Al Ayyubi**<br>**Kelas 9 - Umar bin Abdul Aziz** | Pendalaman Akademik & Tahfidz Lanjutan |

### 2.2. Perubahan Logika & Form Input

1. **Filter Tab Jenjang pada Halaman Admin**:
   - `/admin/classes`: Tab Filter: `[ Semua (27) ]` `[ SD (15) ]` `[ SMP (12) ]`.
   - `/admin/students`: Tambah dropdown filter jenjang untuk memudahkan pencarian siswa SD vs siswa SMP.
   - `/admin/teachers`: Identifikasi guru wali kelas (SD) dan guru bidang studi (SMP) dengan field `guru_bidang` yang sudah ada di tabel `users`.
2. **Form Registrasi Siswa/Guru** (`/register`):
   - Dropdown pemilihan kelas dikelompokkan dengan `<optgroup label="Sekolah Dasar (SD)">` dan `<optgroup label="Sekolah Menengah Pertama (SMP)">`.

---

## 3. Fitur 2: Fitur Mata Pelajaran di Dashboard Siswa & Setiap Kelas

### 3.1. Daftar Mata Pelajaran Terstandar

| Kode Mapel | Nama Mata Pelajaran | Jenjang | Ikon (Lucide) | Badge Tema |
| :--- | :--- | :--- | :--- | :--- |
| `PAI` | Pendidikan Agama Islam & Adab | SEMUA | `BookHeart` | Hijau Emerald |
| `TAHFIDZ` | Tahfidz & Tahsin Al-Qur'an | SEMUA | `Sparkles` | Emas / Amber |
| `BARAB` | Bahasa Arab | SEMUA | `Languages` | Teal |
| `BING` | English Cambridge / Bilingual | SEMUA | `Globe` | Biru Cyan |
| `BIND` | Bahasa Indonesia | SEMUA | `BookOpenText` | Sky Blue |
| `MTK` | Matematika | SEMUA | `Calculator` | Indigo |
| `IPA` | Ilmu Pengetahuan Alam (Sains) | SEMUA | `Atom` | Violet |
| `IPS` | Ilmu Pengetahuan Sosial | SMP | `Compass` | Oranye |
| `INFOR` | Informatika / iPad Digital Learning | SEMUA | `Laptop` | Rose |
| `PJOK` | Pendidikan Jasmani & Kesehatan | SEMUA | `Activity` | Hijau Lime |
| `SBK` | Seni Budaya & Prakarya | SD | `Palette` | Fushia |

### 3.2. Antarmuka Siswa: Widget *"Mata Pelajaran Saya"* di Dashboard

Pada halaman dashboard siswa (`/siswa/page.tsx`), tambahkan section grid interaktif tepat di bawah statistik kehadiran dan pengumuman:

```tsx
// Wireframe Tampilan Widget Mata Pelajaran Siswa
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📚 Mata Pelajaran Saya (Kelas 7 - Ibnu Sina)        [Lihat Semua Jadwal ➔] │
├──────────────────┬──────────────────┬──────────────────┬────────────────────┤
│ 📐 MATEMATIKA    │ 🔬 SAINS (IPA)   │ 📖 BAHASA ARAB   │ 💻 INFORMATIKA     │
│ Ustadz Farhan, S │ Ustadzah Aisyah  │ Ustadz Syakir, L │ Ustadz Dimas, M.Ko │
│ Senin & Rabu     │ Selasa & Kamis   │ Senin & Jumat    │ Rabu               │
│ 07:30 - 09:00    │ 09:30 - 11:00    │ 10:30 - 12:00    │ 13:00 - 14:30      │
│                  │                  │                  │                    │
│ [ 2 Tugas Aktif ]│ [ Semua Selesai ]│ [ 1 Tugas Baru ] │ [ Nilai: 95/100 ]  │
│ [Buka Modul ➔]   │ [Buka Modul ➔]   │ [Buka Modul ➔]   │ [Buka Modul ➔]     │
└──────────────────┴──────────────────┴──────────────────┴────────────────────┘
```

### 3.3. Halaman Detail Mata Pelajaran Siswa (`/siswa/mapel/[mapelId]`)

Halaman komprehensif untuk setiap mata pelajaran yang berisi:
1. **Header**: Nama pelajaran, guru pengampu dengan tautan cepat **"Chat Guru Mapel"**, dan buku petunjuk silabus.
2. **Tab 1 — Tugas & Ujian**: Daftar tugas aktif, tugas selesai, dan riwayat perolehan nilai siswa.
3. **Tab 2 — Materi & Bahan Ajar**: File PDF modul, slide presentasi guru, dan tautan referensi video.
4. **Tab 3 — Jadwal & Kelas Online**: Jadwal pertemuan mingguan serta tombol *"Gabung Kelas Virtual"* jika guru sedang membuka ruang kelas online.

---

## 4. Fitur 3: Kumpul Tugas (PDF/PNG) & Koreksi In-Browser (Tanpa Download)

### 4.1. Alur Pengumpulan Tugas oleh Siswa

1. **Akses Tugas**: Siswa membuka `/siswa/tugas/[tugasId]`.
2. **Review Instruksi**: Siswa melihat tenggat waktu, bobot poin, instruksi teks, serta dapat mengunduh lampiran soal jika ada.
3. **Upload File**:
   - Menerima format: `.pdf`, `.png`, `.jpg`, `.jpeg`.
   - Validasi sisi klien & server: Batas maksimal file 10MB.
   - **Live Preview Klien**: Jika mengunggah PNG/JPG, tampilkan thumbnail gambar langsung. Jika PDF, tampilkan badge nama file, ukuran, dan preview halaman pertama.
4. **Catatan Tambahan**: Siswa dapat menyertakan pesan/catatan untuk guru.
5. **Submit**: Data tersimpan di tabel `tbl_tugas_submission` dan status menjadi `"menunggu_penilaian"`.

### 4.2. In-Browser Grader untuk Guru (Koreksi Tanpa Download)

Ini adalah fitur utama yang menghemat waktu guru secara dramatis. Guru membuka `/guru/tugas/[tugasId]/penilaian/[submissionId]`. Halaman menggunakan layout **Split-Screen (50:50 atau 60:40)**:

```
┌──────────────────────────────────────────┬──────────────────────────────────────────┐
│ 📄 DOKUMEN TUGAS SISWA (PREVIEW LANGSUNG)│ ✍️ PANEL PENILAIAN & UMPAN BALIK GURU   │
├──────────────────────────────────────────┼──────────────────────────────────────────┤
│ Toolbar Dokumen:                         │ Siswa: Ahmad Fathan (Kelas 7 - Ibnu Sina)│
│ [Zoom In +] [Zoom Out -] [Rotate] [Fit]  │ Dikumpulkan: 24 Sep 2026, 09:15 WIB      │
│ [Coretan/Marker ✏️] [Reset Coretan 🔄]     │ Status: Menunggu Penilaian               │
├──────────────────────────────────────────┼──────────────────────────────────────────┤
│                                          │ Input Nilai (Skala 0 - 100):             │
│ [PREVIEW CONTAINER]                      │ ┌──────────────────────────────────────┐ │
│                                          │ │ 88.5                                 │ │
│ Jika PDF:                                │ └──────────────────────────────────────┘ │
│ Menggunakan embedded PDF Viewer          │                                          │
│ (iframe / PDF.js) dengan scroll halaman. │ Umpan Balik / Catatan Perbaikan:         │
│                                          │ ┌──────────────────────────────────────┐ │
│ Jika PNG/JPG:                            │ │ MasyaAllah pengerjaan no 1-4 sangat  │ │
│ Render di HTML5 Canvas beresolusi tinggi │ │ rapi. Perhatikan rumus di soal no 5. │ │
│ yang mendukung zoom, drag/pan, dan       │ │ Pertahankan prestasimu, Ananda!      │ │
│ penanda coretan guru (merah/kuning).     │ └──────────────────────────────────────┘ │
│                                          │                                          │
│                                          │ Checklist Kriteria:                      │
│                                          │ [x] Ketepatan Waktu                      │
│                                          │ [x] Kerapihan Tulisan                    │
│                                          │ [ ] Kesempurnaan Jawaban Akhir           │
│                                          │                                          │
│                                          │ Aksi:                                    │
│                                          │ [ ✅ Simpan & Rilis Nilai ke Siswa ]     │
│                                          │ [ 🔄 Minta Siswa Perbaiki (Revisi) ]     │
└──────────────────────────────────────────┴──────────────────────────────────────────┘
```

#### Komponen Teknis In-Browser Viewer:

1. **Mode PDF**:
   - Menggunakan tag `<iframe src={`${fileUrl}#toolbar=0`} className="w-full h-full border-0" />` atau komponen `@react-pdf-viewer` dengan canvas fallback.
   - Dokumen langsung terbuka di dalam viewport aplikasi tanpa browser memicu dialog *"Save As / Download"*.
2. **Mode Gambar (PNG / JPG)**:
   - Komponen custom `CanvasImageViewer.tsx` berbasis HTML5 Canvas.
   - Fitur interaktif:
     - Zoom via scroll mouse atau tombol zoom (+ / -).
     - Pan/drag untuk memeriksa detail tulisan tangan siswa pada iPad/buku tulis.
     - Pen tool sederhana (warna merah/hijau) untuk memberi tanda centang (✓) atau garis bawah pada bagian yang perlu dikoreksi.
     - Simpan hasil anotasi sebagai snapshot gambar baru (opsional: tersimpan di `annotated_file_url`).

---

## 5. Fitur 4: Chat Interaktif Murid & Guru

### 5.1. Fitur Utama Sistem Chat

1. **Percakapan Terarah (Direct 1-on-1)**:
   - Siswa hanya dapat memulai percakapan dengan **Guru Wali Kelas** dan **Guru Mata Pelajaran** yang mengajar di kelasnya (mencegah pesan salah sasaran atau spam).
   - Guru dapat melihat kontak seluruh murid di kelas yang diampunya, lengkap dengan pencarian nama murid atau filter rombel.
2. **Pesan Real-Time / Semi-Real-Time**:
   - SWR Polling setiap 3–5 detik untuk pembaruan pesan baru ketika jendela chat sedang aktif, dipadukan dengan Socket.io / Server Action untuk pengiriman instan.
3. **Dukungan Lampiran (Attachment)**:
   - Siswa dan guru dapat mengirim foto pertanyaan tugas (PNG, JPG) atau file dokumen langsung di dalam gelembung obrolan (*chat bubble*).
4. **Indikator Pesan & Notifikasi**:
   - Badge merah unread messages di icon Navbar dan menu Sidebar.
   - Tanda centang ganda abu-abu (terkirim) dan centang ganda biru / hijau (sudah dibaca).

### 5.2. Antarmuka Chat (`/siswa/chat` & `/guru/chat`)

```
┌────────────────────────────────┬────────────────────────────────────────────────────┐
│ 💬 Percakapan Guru             │ 👤 Ustadz Farhan, S.Pd (Guru Matematika)           │
├────────────────────────────────┼────────────────────────────────────────────────────┤
│ 🔍 Cari guru atau pelajaran... │ Status: Online • Terakhir dilihat 5 mnt lalu       │
├────────────────────────────────┼────────────────────────────────────────────────────┤
│ [Ust. Farhan - MTK]   (2) 🟢   │ [Siswa 09:10]                                      │
│ "Baik, coba periksa no 3..."   │ Assalamu'alaikum Ustadz, untuk tugas aljabar no 4  │
│                                │ apakah menggunakan metode eliminasi?              │
│ [Ust. Syakir - B.Arab]         │                                                    │
│ "Kosa kata hafalan sdh bnr"    │ [Guru 09:12]                                       │
│                                │ Wa'alaikumussalam Ahmad. Betul, gunakan eliminasi. │
│ [Usth. Aisyah - IPA]           │ Coba periksa contoh di halaman 42 ya.              │
│ "Pertemuan besok di lab ya"    ├────────────────────────────────────────────────────┤
│                                │ [ 📎 Lampirkan Foto/File ] [ Tulis pesan... ] [KIRIM]│
└────────────────────────────────┴────────────────────────────────────────────────────┘
```

---

## 6. Rencana Struktur Direktori & File Baru

Berikut susunan file dan komponen baru yang akan ditambahkan ke proyek:

```
src/
├── actions/
│   ├── chat.ts                     # Server actions kirim pesan, mark as read, get rooms
│   ├── subject.ts                  # Server actions CRUD mata pelajaran & jadwal
│   └── assignment.ts               # Server actions buat tugas, submit tugas, beri nilai
├── app/
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── subjects/page.tsx   # Kelola Mata Pelajaran (Admin)
│   │   │   └── schedules/page.tsx  # Kelola Jadwal Pelajaran (Admin)
│   │   ├── guru/
│   │   │   ├── chat/page.tsx       # Antarmuka Chat Guru
│   │   │   ├── tugas/
│   │   │   │   ├── page.tsx        # Daftar tugas yang dibuat guru
│   │   │   │   ├── create/page.tsx # Buat tugas baru
│   │   │   │   └── [tugasId]/
│   │   │   │       ├── page.tsx    # Rekap pengumpulan tugas siswa
│   │   │   │       └── review/[subId]/page.tsx # IN-BROWSER GRADER (Koreksi Dokumen)
│   │   └── siswa/
│   │       ├── chat/page.tsx       # Antarmuka Chat Siswa
│   │       ├── mapel/
│   │       │   ├── page.tsx        # Daftar seluruh mata pelajaran kelas siswa
│   │       │   └── [mapelId]/page.tsx # Detail mata pelajaran, silabus & tugas
│   │       └── tugas/
│   │           ├── page.tsx        # Daftar tugas siswa (aktif & selesai)
│   │           └── [tugasId]/page.tsx # Halaman kumpul tugas & upload PDF/PNG
├── components/
│   ├── chat/
│   │   ├── chat-container.tsx      # Komponen utama jendela chat
│   │   ├── chat-message-bubble.tsx # Render bubble pesan (teks & file)
│   │   └── chat-contact-list.tsx   # Sidebar kontak siswa/guru
│   ├── assignment/
│   │   ├── file-submission-zone.tsx # Drag & Drop uploader file tugas (PDF/PNG)
│   │   ├── in-browser-grader.tsx    # Split-screen reviewer & form penilaian
│   │   ├── canvas-doc-viewer.tsx    # Interactive image viewer & annotation canvas
│   │   └── pdf-viewer-frame.tsx     # Inline zero-download PDF viewer
│   └── subjects/
│       ├── subject-card.tsx         # Card mata pelajaran di dashboard siswa
│       └── schedule-timeline.tsx    # Timeline jadwal harian
```

---

## 7. Rincian Implementasi API & Server Actions

### 7.1. Server Action: Pengumpulan Tugas (`src/actions/assignment.ts`)

```typescript
"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function submitTugasAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    return { success: false, error: "Akses ditolak." };
  }

  const tugasId = BigInt(formData.get("tugas_id") as string);
  const catatanSiswa = (formData.get("catatan_siswa") as string) || "";
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return { success: false, error: "File tugas wajib diunggah." };
  }

  // Validasi tipe file
  const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { success: false, error: "Format file harus berupa PDF, PNG, atau JPG." };
  }

  // Validasi ukuran (Maksimal 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "Ukuran file maksimal adalah 10MB." };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeFileName = `tugas-${tugasId}-siswa-${session.id}-${Date.now()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "tugas");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeFileName), buffer);

  const fileUrl = `/uploads/tugas/${safeFileName}`;
  const fileType = ext === ".pdf" ? "pdf" : "png";

  const userIdBigInt = BigInt(session.id);

  await prisma.tugasSubmission.upsert({
    where: {
      tugas_id_siswa_id: {
        tugas_id: tugasId,
        siswa_id: userIdBigInt,
      },
    },
    create: {
      tugas_id: tugasId,
      siswa_id: userIdBigInt,
      file_url: fileUrl,
      file_name: file.name,
      file_type: fileType,
      file_size: file.size,
      catatan_siswa: catatanSiswa,
      status: "menunggu_penilaian",
      submitted_at: new Date(),
    },
    update: {
      file_url: fileUrl,
      file_name: file.name,
      file_type: fileType,
      file_size: file.size,
      catatan_siswa: catatanSiswa,
      status: "menunggu_penilaian",
      submitted_at: new Date(),
    },
  });

  revalidatePath("/siswa/tugas");
  return { success: true, message: "Tugas berhasil dikumpulkan!" };
}

export async function gradeTugasAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    return { success: false, error: "Hanya guru yang berhak menilai tugas." };
  }

  const submissionId = BigInt(formData.get("submission_id") as string);
  const nilai = parseFloat(formData.get("nilai") as string);
  const catatanGuru = formData.get("catatan_guru") as string;
  const status = (formData.get("status") as string) || "sudah_dinilai";

  if (isNaN(nilai) || nilai < 0 || nilai > 100) {
    return { success: false, error: "Nilai harus berupa angka antara 0 hingga 100." };
  }

  await prisma.tugasSubmission.update({
    where: { id: submissionId },
    data: {
      nilai,
      catatan_guru: catatanGuru,
      status,
      graded_at: new Date(),
      graded_by: BigInt(session.id),
    },
  });

  revalidatePath("/guru/tugas");
  return { success: true, message: "Nilai dan koreksi berhasil disimpan!" };
}
```

---

### 7.2. Server Action: Chat Murid & Guru (`src/actions/chat.ts`)

```typescript
"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getOrCreateChatRoom(otherUserId: bigint) {
  const session = await getSession();
  if (!session) return null;

  const myId = BigInt(session.id);
  const [userOneId, userTwoId] = myId < otherUserId ? [myId, otherUserId] : [otherUserId, myId];

  let room = await prisma.chatRoom.findUnique({
    where: {
      user_one_id_user_two_id: {
        user_one_id: userOneId,
        user_two_id: userTwoId,
      },
    },
  });

  if (!room) {
    room = await prisma.chatRoom.create({
      data: {
        type: "DIRECT",
        user_one_id: userOneId,
        user_two_id: userTwoId,
      },
    });
  }

  return room;
}

export async function sendMessageAction(roomId: bigint, message: string, attachmentUrl?: string) {
  const session = await getSession();
  if (!session || !message.trim()) {
    return { success: false, error: "Pesan tidak boleh kosong." };
  }

  const senderId = BigInt(session.id);

  const chatMessage = await prisma.chatMessage.create({
    data: {
      room_id: roomId,
      sender_id: senderId,
      message: message.trim(),
      attachment_url: attachmentUrl || null,
      attachment_type: attachmentUrl ? "image" : null,
      is_read: false,
    },
  });

  await prisma.chatRoom.update({
    where: { id: roomId },
    data: {
      last_message: message.trim(),
      last_message_at: new Date(),
    },
  });

  return { success: true, chatMessage };
}
```

---

## 8. Data Awal Seeder (Database Seed Script)

Tambahkan kode ini ke dalam `prisma/seed.ts` untuk menginisialisasi kelas SMP dan master mata pelajaran:

```typescript
// ===========================================================================
// SEED KELAS SMP (KELAS 7, 8, 9)
// ===========================================================================
console.log("\n🏫 Menyiapkan Rombel Kelas SMP Islam Al-Azhar Cairo...");
const smpClasses = [
  // Kelas 7
  { nama: "Kelas 7 - Ibnu Sina", tingkat: 7 },
  { nama: "Kelas 7 - Al Khawarizmi", tingkat: 7 },
  { nama: "Kelas 7 - Al Biruni", tingkat: 7 },
  { nama: "Kelas 7 - Jabir Ibnu Hayyan", tingkat: 7 },
  // Kelas 8
  { nama: "Kelas 8 - Ibnu Khaldun", tingkat: 8 },
  { nama: "Kelas 8 - Al Razi", tingkat: 8 },
  { nama: "Kelas 8 - Al Kindi", tingkat: 8 },
  { nama: "Kelas 8 - Ibnu Battuta", tingkat: 8 },
  // Kelas 9
  { nama: "Kelas 9 - Al Farabi", tingkat: 9 },
  { nama: "Kelas 9 - Tariq bin Ziyad", tingkat: 9 },
  { nama: "Kelas 9 - Salahuddin Al Ayyubi", tingkat: 9 },
  { nama: "Kelas 9 - Umar bin Abdul Aziz", tingkat: 9 },
];

for (const c of smpClasses) {
  const exist = await prisma.kelas.findFirst({ where: { nama_kelas: c.nama } });
  if (!exist) {
    await prisma.kelas.create({
      data: {
        nama_kelas: c.nama,
        jenjang: "SMP",
        tingkat: c.tingkat,
        wali_kelas: "Ustadz Pembina SMP",
        jumlah_siswa: "28",
        kode_restrict: "SMP2026",
      },
    });
  }
}

// ===========================================================================
// SEED MASTER MATA PELAJARAN
// ===========================================================================
console.log("\n📚 Menyiapkan Master Mata Pelajaran...");
const subjectsData = [
  { kode: "PAI", nama: "Pendidikan Agama Islam & Adab", jenjang: "SEMUA", icon: "BookHeart", warna: "emerald" },
  { kode: "TAHFIDZ", nama: "Tahfidz & Tahsin Al-Qur'an", jenjang: "SEMUA", icon: "Sparkles", warna: "amber" },
  { kode: "BARAB", nama: "Bahasa Arab", jenjang: "SEMUA", icon: "Languages", warna: "teal" },
  { kode: "BING", nama: "English Bilingual", jenjang: "SEMUA", icon: "Globe", warna: "blue" },
  { kode: "BIND", nama: "Bahasa Indonesia", jenjang: "SEMUA", icon: "BookOpenText", warna: "sky" },
  { kode: "MTK", nama: "Matematika", jenjang: "SEMUA", icon: "Calculator", warna: "indigo" },
  { kode: "IPA", nama: "Ilmu Pengetahuan Alam (IPA)", jenjang: "SEMUA", icon: "Atom", warna: "violet" },
  { kode: "IPS", nama: "Ilmu Pengetahuan Sosial (IPS)", jenjang: "SMP", icon: "Compass", warna: "orange" },
  { kode: "INFOR", nama: "Informatika & Coding", jenjang: "SEMUA", icon: "Laptop", warna: "rose" },
  { kode: "PJOK", nama: "Pendidikan Jasmani & Olahraga", jenjang: "SEMUA", icon: "Activity", warna: "lime" },
];

for (const sub of subjectsData) {
  const exist = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: sub.kode } });
  if (!exist) {
    await prisma.mataPelajaran.create({
      data: {
        kode_mapel: sub.kode,
        nama_mapel: sub.nama,
        jenjang: sub.jenjang,
        icon: sub.icon,
        warna: sub.warna,
      },
    });
  }
}
```

---

## 9. Pembaruan Menu Navigasi (Sidebar)

Tambahkan menu baru pada [src/components/layouts/sidebar.tsx](file:///c:/ruang-kerja-alazhar/student-app/src/components/layouts/sidebar.tsx):

### Menu Guru Tambahan:
- `{ label: "Tugas & Penilaian", href: "/guru/tugas", icon: FileCheck }`
- `{ label: "Mata Pelajaran", href: "/guru/mapel", icon: BookOpen }`
- `{ label: "Chat Siswa", href: "/guru/chat", icon: MessageSquareQuote }`

### Menu Siswa Tambahan:
- `{ label: "Mata Pelajaran", href: "/siswa/mapel", icon: BookOpen }`
- `{ label: "Tugas Saya", href: "/siswa/tugas", icon: FileCheck }`
- `{ label: "Chat Guru", href: "/siswa/chat", icon: MessageSquareQuote }`

### Menu Admin Tambahan:
- `{ label: "Mata Pelajaran", href: "/admin/subjects", icon: BookOpen }`
- `{ label: "Jadwal Pelajaran", href: "/admin/schedules", icon: CalendarClock }`

---

## 10. Checklist Pelaksanaan Eksekusi (Sprint Execution Roadmap)

| Fase | Tahapan | Aktivitas Utama | Output |
| :---: | :--- | :--- | :--- |
| **1** | **Skema Database** | Tambahkan model `MataPelajaran`, `JadwalPelajaran`, `Tugas`, `TugasSubmission`, `ChatRoom`, `ChatMessage` ke `schema.prisma`. Jalankan migrasi / db push. | Tabel database MySQL siap digunakan. |
| **2** | **Ekspansi Kelas SMP** | Perbarui `prisma/seed.ts` dengan 12 rombel SMP, update form pendaftaran (`register`), dan filter kelas di dashboard admin. | Pilihan kelas SD & SMP aktif di seluruh aplikasi. |
| **3** | **Modul Mata Pelajaran** | Buat server actions `subject.ts`, admin manager mapel, dan pasang widget *"Mata Pelajaran Saya"* di dashboard siswa. | Siswa dapat melihat mata pelajaran & guru pengampu di dashboard. |
| **4** | **Sistem Tugas & Koreksi In-Browser** | Buat uploader PDF/PNG siswa, dan buat Split-Screen In-Browser Document Grader untuk guru tanpa perlu unduh file. | Guru dapat langsung memeriksa & memberi nilai di browser. |
| **5** | **Sistem Chat Siswa & Guru** | Buat server actions `chat.ts`, komponen chat container, gelembung pesan, lampiran, dan indicator unread badge. | Siswa dan guru dapat berkirim pesan langsung secara real-time. |
| **6** | **Integrasi & Pengujian QA** | Uji coba pengunggahan file tugas 10MB (PDF/PNG), verifikasi koreksi in-browser, uji kirim pesan chat, dan validasi tampilan responsif iPad/Mobile. | Seluruh fitur berjalan mulus dan siap dirilis ke server produksi. |
