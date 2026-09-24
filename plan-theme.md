# 🎨 Rencana Induk Desain Tema & Motif Background (Versi Resmi Sesuai Mockup)
## Sistem Informasi Akademik "Student Apps" — SD & SMP Islam Al-Azhar Cairo Palembang

---

## 🏛️ 1. Referensi Desain Resmi & Konsep Visual

Berdasarkan referensi desain resmi portal **Al-Azhar Cairo Palembang**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]  PORTAL SISTEM SEKOLAH TERPADU | AL-AZHAR CAIRO PALEMBANG         [CORAK PRISMA MOZAIK]  │
├─────────┬───────────────────────────────────────────────────────────────────────────────────────┤
│ [Menu]  │  Beranda Dashboard                                                                    │
│ 🏠 Dash │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐                  │
│ 👥 Siswa│  │ Total Siswa [🕌]  │  │ Kehadiran Siswa 🌈│  │ Pengumuman    [📢]│                  │
│ 📚 Mapel│  │ [Bar Chart Emas]  │  │ [Donut Chart Spek]│  │ [Timeline Berita] │                  │
│ 📝 Tugas│  └───────────────────┘  └───────────────────┘  └───────────────────┘                  │
│ 💬 Chat │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐                  │
│ 📅 Agnda│  │ Modul Belajar [🕌]│  │ Akses Materi [💜] │  │ Laporan Kehadiran │                  │
│ 📊 Absen│  │ [Folder Warna-Wrni│  │ [Folder Pelajaran]│  │ [🕌 Siluet Spektrum│                  │
│         │  └───────────────────┘  └───────────────────┘  │  Pendidikan Modern]│                  │
│ [MOZAIK │                                                └───────────────────┘                  │
│ KRISTAL]│                                                  [Watermark Geometri Prisma Halus]    │
└─────────┴───────────────────────────────────────────────────────────────────────────────────────┘
```

### Karakteristik Visual Utama:
1. **Latar Belakang Bersih & Terang (Crisp Pure Porcelain Canvas)**:
   - Background utama bernuansa putih bersih lembut (`#f8fafc` / `#f1f5f9`), menciptakan kesan rapi, modern, dan sangat nyaman dibaca oleh siswa SD, SMP, maupun guru tanpa membuat mata cepat lelah.
2. **Mozaik Poligonal Kristal Khas Logo (Vibrant Low-Poly Corner Accents)**:
   - **Pojok Kanan Atas Header**: Hiasan pita segitiga kristal mozaik spektrum warna logo (merah, jingga, emas, hijau, sian, biru, nila, ungu).
   - **Bawah Sidebar**: Banner kisi-kisi segitiga geometris penuh warna khas Al-Azhar Cairo.
   - **Watermark Sudut Layar**: Pendaran tipis bentuk geometri kristal (*faceted prism*) di sudut-sudut antarmuka.
3. **Kartu Bertema Khusus dengan Siluet Kubah/Menara (Thematic Mosque Cards)**:
   - Setiap kartu memiliki strip header berwarna tematik (Emas Matahari, Hijau Zamrud, Biru Kairo, Ungu Amethyst) dengan watermark siluet menara & kubah masjid Al-Azhar di pojok header kartu.
   - Border kartu bersih dengan bayangan lembut (*card elevation shadow*).
4. **Indikator Aktif Sidebar Modern**:
   - Menu aktif menggunakan latar netral abu-abu terang lembut (`#f1f5f9` / `#e2e8f0`) dengan **garis penanda warna oranye/emas (`border-l-4 border-amber-500`)** di sisi kiri dan ikon berwarna tajam.

---

## 🎨 2. Palet Warna Spektrum Logo Al-Azhar Cairo

Warna diambil langsung dari titik-titik mozaik logo [logo-alazhar-cairo.avif](file:///c:/ruang-kerja-alazhar/student-app/assets/logo-alazhar-cairo.avif):

| Token Warna | Nilai Heksadesimal | Nuansa | Peran di Antarmuka |
| :--- | :--- | :--- | :--- |
| **Cairo Azure** | `#0284c7` / `#0ea5e9` | Biru Langit & Sian | Kartu Pengumuman, Materi Kelas, Status Informasi |
| **Islamic Emerald**| `#059669` / `#10b981` | Hijau Zamrud | Kartu Modul Belajar, Presensi Hadir, Nilai Baik |
| **Nile Sun Gold** | `#f59e0b` / `#fbbf24` | Emas Mentari | Kartu Total Siswa, Highlight Wali Kelas, Peringkat |
| **Coral Orange** | `#f97316` / `#ea580c` | Jingga Madu | Garis Indikator Aktif Sidebar, Badge Penting, Tombol Utama |
| **Royal Amethyst**| `#8b5cf6` / `#7c3aed` | Ungu Nil | Kartu Akses Materi, Kelas Online, Ruang Tanya Guru |
| **Ruby Rose** | `#e11d48` / `#f43f5e` | Merah Delima | Kategori Khusus, Peringatan & Evaluasi Kedisiplinan |

---

## 📐 3. Komponen Motif & Ornamen Vektor

1. **`AlAzharMosaicStrip`**:
   Pita pola berulang segitiga prisma poligonal warna-warni yang diletakkan di:
   - Bagian bawah sidebar navigasi.
   - Sudut kanan atas navbar header.
   - Aksen dekoratif kartu pengantar.
2. **`AlAzharMosqueWatermark`**:
   Siluet vektor kubah dan menara masjid Al-Azhar tipis yang menyatu dengan header kartu (*card header watermark*).
3. **`GlobalBackground`**:
   - Canvas dasar cerah bersih anti-silau.
   - Ornamen watermark geometri prisma di pojok kanan bawah dan kiri atas dengan opacity sangat halus (3% - 6%), tidak mengaburkan teks tabel atau formulir tugas.
4. **`AlAzharSchoolBanner`**:
   Badge ilustrasi siluet masjid Al-Azhar warna-warni bertuliskan **"PENDIDIKAN MODERN & INKLUSIF BERBASIS NILAI ISLAM"** yang dapat disematkan di dashboard siswa dan guru.

---

## 📋 4. Roadmap Implementasi

1. **Fase 1: Pembuatan Komponen Ornamen SVG**
   - Perbarui [src/components/ui/alazhar-patterns.tsx](file:///c:/ruang-kerja-alazhar/student-app/src/components/ui/alazhar-patterns.tsx) untuk menambahkan `AlAzharMosaicStrip`, `AlAzharMosqueWatermark`, dan `AlAzharSchoolBanner`.
2. **Fase 2: Pembaruan Token Tema di `globals.css`**
   - Konfigurasi tema terang (*Light Mode*) dengan basis putih kristal, teks slate pekat, dan variabel warna spektrum logo.
   - Konfigurasi mode gelap (*Dark Mode*) yang seimbang dan tetap mempertahankan keanggunan motif.
3. **Fase 3: Pembaruan Latar Belakang Global**
   - Modifikasi [src/components/ui/global-background.tsx](file:///c:/ruang-kerja-alazhar/student-app/src/components/ui/global-background.tsx) dengan canvas bersih dan hiasan prisma di sudut layar.
4. **Fase 4: Penataan Sidebar & Navbar Sesuai Mockup**
   - [sidebar.tsx](file:///c:/ruang-kerja-alazhar/student-app/src/components/layouts/sidebar.tsx): Tambahkan pita mozaik segitiga warna-warni di bagian bawah, perbarui indikator aktif dengan lis kiri amber/emas.
   - [navbar.tsx](file:///c:/ruang-kerja-alazhar/student-app/src/components/layouts/navbar.tsx): Tambahkan judul resmi *"PORTAL SISTEM SEKOLAH TERPADU | AL-AZHAR CAIRO PALEMBANG"* dan ornamen mozaik di pojok kanan atas.
5. **Fase 5: Penataan Kartu-Kartu Dashboard Siswa & Guru**
   - Tambahkan varian header berwarna (Emas, Hijau, Biru, Ungu) lengkap dengan watermark siluet masjid di kartu statistik dan mata pelajaran.
6. **Fase 6: Verifikasi & Build Testing**
   - Pastikan `npx tsc --noEmit`, `npx vitest run`, dan `npm run build` lulus 100%.
