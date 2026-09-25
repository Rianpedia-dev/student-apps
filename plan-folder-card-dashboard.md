# Plan Implementasi FolderCard Modern untuk Dashboard Al-Azhar

## 1. Ringkasan Eksekutif & Tujuan

Mengganti gaya 4 kartu statistik (*StatCard*) pada Dashboard Siswa (serta Guru & Admin) yang saat ini berbentuk kartu persegi panjang konvensional dengan komponen interaktif baru bertema **FolderCard** (kartu berbentuk folder arsip dengan siluet tab/notch SVG, *aurora gradient cover*, efek parallax spring saat *hover*, dan tipografi dinamis berbasis *CSS Container Queries*).

### Komparasi Visual:
| Aspek | Desain Lama (`StatCard`) | Desain Baru (`FolderCard`) |
| :--- | :--- | :--- |
| **Bentuk Card** | Kotak biasa `rounded-2xl` dengan border tipis | Siluet map folder arsip dengan lekukan tab Bézier (`FOLDER_PATH` SVG notch) |
| **Cover Header** | Watermark masjid & strip mozaik statis | *Aurora gradient cover* / media visual yang berada di balik tab folder |
| **Interaksi Hover** | Mengangkat sedikit (`-translate-y-1`) | Fisika pegas Framer Motion: Folder depan meluncur turun (`y: 8%`), cover membesar (`scale: 1.07`), seluruh card terangkat (`y: -8px`) |
| **Penempatan Konten** | Header di atas, nilai besar di bawah, icon di kanan | Tab atas: *Title & Subtitle*; Bawah: *Big Count Number* & *Unit Label*; Kanan atas: *Frosted Icon Badge*; Kanan bawah: *Meta badge* |
| **Responsivitas** | Menggunakan breakpoint Tailwind (`text-xl sm:text-2xl`) | Menggunakan *Container Queries* (`cqw`) + *Fluid Clamping* (`clamp(min, cqw, max)`) |

---

## 2. Analisis Struktur FolderCard & Penyesuaian

### 2.1 Anatomi Komponen FolderCard
1. **Bezel Luar (`aspect-[544/522]`)**: Frame pembungkus bergradien halus dengan bayangan mendalam (*soft elevation shadow*).
2. **Surface Dalam (`rounded-[5.88cqw]`)**: Area kanvas utama yang menampung *cover* dan *front panel*.
3. **Cover Layer (`h-[54%]`)**: Terletak di bagian atas. Di balik lekukan notch tab, cover ini terekspos.
   - Dilengkapi tema warna khas Al-Azhar (Emerald, Amber, Sapphire Blue, Crimson Rose, Amethyst Dusk).
   - Diperkaya dengan *Frosted Glass Floating Icon* di pojok kanan atas yang semakin terekspos saat kartu di-hover!
4. **Front Panel (SVG Tab Silhouette)**:
   - Memiliki tab di sebelah kiri (tinggi $y=135$) dan notch melengkung turun ke body ($y=194$).
   - Di dalam tab: `title` (misal: "Hadir Bulan Ini") dan `subtitle` (misal: "Total kehadiran").
5. **Footer Bar**:
   - Nilai angka besar (`count`, misal: "0") + label satuan (`countLabel`, misal: "Hari").
   - Keterangan status/navigasi di kanan (`meta`, misal: "Presensi" atau "Bulan Ini").

### 2.2 Penyesuaian Penting untuk Ekosistem Aplikasi
1. **Container Query & Grid 2-Kolom Mobile**:
   - Di mobile (`grid-cols-2`), lebar kartu berkisar ~165px. Ukuran murni `text-[4.25cqw]` akan setara ~7px (terlalu kecil).
   - Solusi: Gunakan CSS `clamp()` misal `text-[clamp(11px,4.25cqw,16px)]` agar teks tetap terbaca tajam dan nyaman di semua ukuran layar smartphone hingga monitor 4K.
2. **Tema Terang (Light) & Tema Gelap (Dark)**:
   - Warna `--folder-card-bezel` dan `--folder-card-surface` diselaraskan dengan palette dark slate Al-Azhar (`#0f172a` / `#1e293b`) dan light mode (`#ffffff` / `#f8fafc`).
3. **Dukungan Tautan Navigasi (`href`)**:
   - Kartu harus dapat diklik untuk navigasi (misal klik kartu "Hadir" menuju `/siswa/attendance`).
4. **Varian Warna Al-Azhar**:
   - **Amber / Gold**: Kartu Presensi / Kehadiran.
   - **Accent / Sky Blue**: Kartu Kegiatan / Kalender Sekolah.
   - **Rose / Crimson**: Kartu Tugas Aktif.
   - **Emerald / Green**: Kartu Mata Pelajaran.
   - **Purple / Amethyst**: Kartu Kelas Online / Khusus.

---

## 3. Rencana Implementasi Bertahap

### Tahap 1: Pembuatan Komponen UI `FolderCard`
- **File**: `src/components/ui/folder-card.tsx`
- Mengimplementasikan komponen `FolderCard` lengkap sesuai spesifikasi user dengan:
  - Framer Motion variants & spring physics.
  - Varian tema Al-Azhar (*Aurora Gradients* untuk Amber, Sky Blue, Rose, Emerald, Violet).
  - Integrasi icon pendukung (floating glass icon badge di area cover notch yang terbuka).
  - Fleksibilitas navigasi tautan `href` dengan Next.js `Link`.
  - Dukungan `clamp` untuk keterbacaan container query pada layar kecil.

### Tahap 2: Integrasi & Refactor `StatCard`
- **File**: `src/components/stat-card.tsx`
- Merekayasa ulang `StatCard` agar menjadi adaptor tingkat tinggi yang membungkus `FolderCard`:
  - Menguraikan `value` (seperti `"0 Hari"` menjadi `count="0"` dan `countLabel="Hari"`, `"5 Kegiatan"` menjadi `count="5"` dan `countLabel="Kegiatan"`).
  - Meneruskan `icon`, `title`, `description` (ke `subtitle`), `variant`, dan `href`.
  - Menjaga *backward-compatibility* sehingga semua pemanggilan yang sudah ada tetap berfungsi 100% tanpa error, namun langsung tampil dengan visual FolderCard baru!

### Tahap 3: Pembaruan & Tuning Halaman Dashboard
1. **Dashboard Siswa (`src/app/(dashboard)/siswa/page.tsx`)**:
   - 4 Kartu: Hadir Bulan Ini, Kegiatan Bulan Ini, Tugas Aktif, Mata Pelajaran.
   - Penyesuaian grid dan properti meta (misal: "Presensi", "Kalender", "Deadline", "Silabus").
2. **Dashboard Guru (`src/app/(dashboard)/guru/page.tsx`)**:
   - 4 Kartu: Kelas Saya, Absensi Hari Ini, Tugas Kelas, Perlu Dinilai.
3. **Dashboard Admin (`src/app/(dashboard)/admin/page.tsx`)**:
   - 4 Kartu: Jumlah Siswa, Jumlah Guru, Akun Aktif, Akun Non-Aktif.
4. **Dashboard Admin Kelas Online (`src/app/(dashboard)/admin/kelas-online/page.tsx`)**:
   - 4 Kartu: Total Sesi, Total Menit, Rata-rata Durasi, Rata-rata Peserta.

### Tahap 4: Pengujian & Validasi
- **TypeScript Check**: `npx tsc --noEmit` untuk memastikan tidak ada kesalahan tipe data.
- **Visual & Interaction Check**:
  - Uji hover animation (folder slide down, card lift, cover zoom).
  - Uji responsivitas pada tampilan mobile (2 kolom) dan desktop (4 kolom).
  - Uji keselarasan tema dark mode dan light mode.
  - Uji fungsionalitas klik link navigasi.

---

## 4. Struktur Data Props Mapping

| StatCard Lama | Properti FolderCard Baru | Contoh Siswa | Contoh Guru |
| :--- | :--- | :--- | :--- |
| `title` | `title` | `"Hadir Bulan Ini"` | `"Kelas Saya"` |
| `description` | `subtitle` | `"Total kehadiran bulan ini"` | `"Wali kelas & murid"` |
| `value` (angka) | `count` | `"0"` | `"32"` |
| `value` (satuan)| `countLabel` | `"Hari"` | `"Siswa"` |
| *(baru)* | `meta` | `"Presensi"` | `"Aktif"` |
| `icon` | `icon` (floating badge di cover) | `<ClipboardListIcon />` | `<Users />` |
| `variant` | `variant` (aurora cover) | `"amber"` | `"primary"` |
| `href` | `href` | `"/siswa/attendance"` | `"/guru/my-class"` |

---

## 5. Keputusan Desain & Pertimbangan

1. **Apakah tetap mempertahankan icon?**
   - **Ya, tetapi dengan cara baru yang jauh lebih estetik:** Icon tidak lagi berada di dalam kotak kanan bawah biasa, melainkan menjadi *Frosted Glass Badge* mengambang di area cover atas yang terbuka. Ketika di-hover, folder membuka ke bawah dan icon terlihat makin jelas dengan kilau latar aurora.
2. **Bagaimana dengan grid layout?**
   - Grid tetap menggunakan `grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4`. `FolderCard` diberi `w-full` agar mengisi lebar grid secara proporsional.
