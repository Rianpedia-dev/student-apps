# Plan Pembersihan & Penghapusan Fitur: Sholat, Keterlambatan, Leaderboard Poin, dan Best Student

> **Aplikasi:** Student Apps — SD & SMP Islam Al-Azhar Cairo Palembang  
> **Tanggal:** 24 September 2026  
> **Status:** Draft Rencana Tindakan (*Actionable Plan*)  
> **Tujuan:** Merampingkan aplikasi agar lebih berfokus pada kegiatan pembelajaran inti (*Mata Pelajaran*, *Pengumpulan & Penilaian Tugas In-Browser*, serta *Komunikasi Chat Murid-Guru*).

---

## 1. Ringkasan & Ruang Lingkup

Fitur-fitur berikut akan dihapus secara menyeluruh dari kode sumber antarmuka (UI), rute halaman (*routes*), navigasi (*sidebar*), logika backend (*server actions & services*), serta skema database:

1. **Checklist Sholat**: Mutaba'ah harian 6 waktu sholat siswa dan verifikasi guru/orang tua.
2. **Riwayat Sholat**: Halaman riwayat dan kalender mutaba'ah sholat siswa.
3. **Data Keterlambatan**: Pencatatan menit keterlambatan siswa oleh guru dan rekap keterlambatan siswa.
4. **Leaderboard Poin**: Peringkat siswa berdasarkan akumulasi poin di dashboard siswa dan guru.
5. **Best Student**: Penghargaan dan pencatatan siswa teladan/berprestasi bulanan kelas.

---

## 2. Inventaris Berkas yang Dihapus (*File Deletion Inventory*)

Berkas dan folder berikut tidak lagi digunakan dan akan dihapus:

### A. Rute Halaman Siswa
| Path Berkas | Fitur Terkait |
|---|---|
| `src/app/(dashboard)/siswa/prayers/page.tsx` | Form Checklist Sholat Harian |
| `src/app/(dashboard)/siswa/prayers/history/page.tsx` | Riwayat & Rekap Sholat Siswa |
| `src/app/(dashboard)/siswa/lateness/page.tsx` | Catatan Keterlambatan Siswa |
| `src/app/(dashboard)/siswa/best-point/page.tsx` | Leaderboard Poin Siswa |
| `src/app/(dashboard)/siswa/best-student/page.tsx` | Daftar Siswa Teladan (Best Student) |

### B. Rute Halaman Guru
| Path Berkas | Fitur Terkait |
|---|---|
| `src/app/(dashboard)/guru/best-point/page.tsx` | Leaderboard Poin Siswa versi Guru |
| `src/app/(dashboard)/guru/best-student/page.tsx` *(jika ada)* | Manajemen Siswa Teladan versi Guru |

### C. Komponen & Service
| Path Berkas | Keterangan |
|---|---|
| `src/components/prayer-schedule-widget.tsx` | Widget Jadwal Sholat API Kemenag/Palembang di Dashboard Siswa |
| `src/services/prayer.service.ts` | Service ORM untuk penyimpanan & verifikasi sholat |

---

## 3. Inventaris Berkas yang Dimodifikasi (*Refactoring Inventory*)

### A. Navigasi & Sidebar (`src/components/layouts/sidebar.tsx`)
- **Menu Siswa (`siswaMenu`)**:
  - Hapus: `Checklist Sholat` (`/siswa/prayers`, icon: `ClipboardCheckIcon`)
  - Hapus: `Riwayat Sholat` (`/siswa/prayers/history`, icon: `HistoryIcon`)
  - Hapus: `Data Keterlambatan` (`/siswa/lateness`, icon: `ClockAlertIcon`)
  - Hapus: `Leaderboard Poin` (`/siswa/best-point`, icon: `Trophy`)
  - Hapus: `Best Student` (`/siswa/best-student`, icon: `Award`)
- **Menu Guru (`guruMenu`)**:
  - Hapus: `Best Student` (`/guru/best-student`, icon: `Award`)
  - Hapus: `Leaderboard Poin` (`/guru/best-point`, icon: `Trophy`)
- **Pembersihan Import**: Hapus import icon yang tidak lagi dipakai (`ClipboardCheckIcon`, `ClockAlertIcon`, `HistoryIcon`, `Award`, `Trophy` jika sudah tidak digunakan menu lain).

---

### B. Dashboard Siswa (`src/app/(dashboard)/siswa/page.tsx`)
1. **Pembersihan Data Query**:
   - Hapus query Prisma untuk `prayerToday`, `studentWithMaxPoints`, dan `bestStudents`.
2. **Penyesuaian UI & Layout**:
   - Hapus banner *"Mutaba'ah Sholat Hari Ini"*.
   - Hapus widget `<PrayerScheduleWidget />`.
   - Modifikasi 4 Stat Cards: Mengganti kartu *"Best Point"* dan *"Poin Saya"* menjadi kartu yang lebih relevan:
     - **Tugas Aktif**: Jumlah tugas yang sedang berjalan dan perlu dikerjakan.
     - **Mata Pelajaran**: Jumlah mata pelajaran aktif semester ini.
   - Hapus Card *"Best Student Kelas"* pada kolom samping; pertahankan Card *"Prestasi Teman Sekolah"* dan *"Pengumuman Sekolah"* dengan layout yang lebih lapang.

---

### C. Dashboard Guru (`src/app/(dashboard)/guru/page.tsx`)
1. **Pembersihan Data Query**:
   - Hapus query `prisma.bestStudent.findMany` dan komputasi `studentWithMaxPoints`.
2. **Penyesuaian Stat Cards**:
   - Ganti kartu *"Best Point"* dan *"Best Student"* menjadi:
     - **Tugas Aktif**: Total tugas yang dibuat guru.
     - **Tugas Perlu Dinilai**: Submisi tugas siswa yang belum diberi nilai.

---

### D. Manajemen Kelas Guru (`src/app/(dashboard)/guru/my-class/`)
1. `src/app/(dashboard)/guru/my-class/my-class-table.tsx`:
   - Hapus kolom atau badge status sholat hari ini (`prayerToday`).
   - Hapus tombol / aksi `verifyPrayerAction`.
2. `src/app/(dashboard)/guru/my-class/[id]/page.tsx` (Detail Siswa):
   - Hapus Tab *"Keterlambatan"*, form pencatatan keterlambatan baru, dan tabel riwayat keterlambatan.
   - Hapus import `createLatenessAction` dan `deleteLatenessAction`.
   - Sisakan tab fokus: *Catatan Guru* dan *Pelanggaran Siswa*.

---

### E. Server Actions & Services
1. `src/actions/siswa.ts`:
   - Hapus `savePrayerChecklistAction`.
2. `src/actions/guru.ts`:
   - Hapus `verifyPrayerAction`.
   - Hapus `createLatenessAction` dan `deleteLatenessAction`.
   - Hapus `createBestStudentAction` dan `deleteBestStudentAction`.
   - Hapus `addPointAction` / `resetPointsAction` (jika ada).
3. `src/lib/validators/index.ts`:
   - Hapus schema `prayerChecklistSchema`.
   - Hapus schema `latenessSchema`.
   - Hapus schema `bestStudentSchema`.
4. `src/types/index.ts`:
   - Hapus interface `PrayerItem`.
   - Hapus interface `LatenessItem`.
   - Hapus interface `BestStudentItem`.

---

### F. Skema Database (`prisma/schema.prisma`) & Seeder (`prisma/seed.ts`)
1. **Prisma Schema**:
   - Hapus model `Prayer` (`@@map("prayers")`).
   - Hapus model `Keterlambatan` (`@@map("tbl_keterlambatan")`) dan relasinya pada model `User`.
   - Hapus model `BestStudent` (`@@map("tbl_beststudent")`).
2. **Seeder (`prisma/seed.ts`)**:
   - Hapus blok inisialisasi sample data sholat (`prisma.prayer.createMany`).
   - Hapus blok inisialisasi sample keterlambatan dan best student.

---

## 4. Tahapan Rencana Eksekusi (Step-by-Step Execution Roadmap)

```
[Langkah 1: Navigasi & Sidebar]
  └── Hapus menu sholat, lateness, point, & best student di sidebar.tsx
  
[Langkah 2: Dashboard Refactoring]
  ├── Sesuaikan siswa/page.tsx (Ganti stat cards ke Tugas & Mapel, hapus widget sholat & best student)
  ├── Sesuaikan guru/page.tsx (Ganti stat cards ke Tugas Aktif & Perlu Dinilai)
  └── Bersihkan guru/my-class/[id]/page.tsx (Hapus tab keterlambatan & kolom sholat di tabel)

[Langkah 3: Hapus Halaman & Komponen (Delete Unused Files)]
  ├── Hapus folder siswa/prayers, siswa/lateness, siswa/best-point, siswa/best-student
  ├── Hapus folder guru/best-point, guru/best-student
  └── Hapus prayer-schedule-widget.tsx & prayer.service.ts

[Langkah 4: Backend Cleanup]
  ├── Bersihkan actions/siswa.ts & actions/guru.ts
  ├── Bersihkan lib/validators/index.ts & types/index.ts
  └── Perbarui prisma/schema.prisma & prisma/seed.ts

[Langkah 5: Database Push & Validasi Build]
  ├── Jalankan: npx prisma db push
  ├── Jalankan: npx tsc --noEmit (Pastikan 0 type error)
  └── Jalankan: npm run build (Pastikan build produksi sukses)
```

---

## 5. Pratinjau Tampilan Dashboard Baru (Sesudah Disederhanakan)

### Dashboard Siswa Baru:
- **Hero Header**: Ucapan salam Islami ramah anak, nama siswa, kelas (SD/SMP), nama wali kelas, dan NIS.
- **Quick Action Bar**:
  - 📚 **Mata Pelajaran Saya** -> Melihat jadwal & silabus.
  - 📝 **Tugas Saya** -> Melihat tugas aktif & kumpul tugas PDF/PNG.
  - 💬 **Chat Guru** -> Konsultasi dan tanya jawab materi.
- **4 Stat Cards Utama**:
  1. 🏫 **Hadir Bulan Ini** (Data Presensi)
  2. 📅 **Agenda Kegiatan** (Kalender Sekolah)
  3. 📝 **Tugas Perlu Dikerjakan** (Status Tugas)
  4. 📚 **Mata Pelajaran Aktif** (Jumlah Mapel)
- **Widget Mapel & Pengumuman**: Grid kartu mata pelajaran ceria dan timeline pengumuman resmi sekolah.

### Dashboard Guru Baru:
- **Quick Action**: Banner presensi harian kelas jika belum diisi.
- **4 Stat Cards Utama**:
  1. 👥 **Kelas Saya** (Jumlah siswa rombel)
  2. 📋 **Absensi Hari Ini** (Jumlah siswa hadir)
  3. 📝 **Tugas Aktif** (Tugas kelas yang sedang berjalan)
  4. ⭐ **Tugas Perlu Dinilai** (Submisi siswa yang belum dikoreksi)
- **Review Cepat**: Tombol langsung menuju pemeriksaan lembar kerja siswa tanpa download.
