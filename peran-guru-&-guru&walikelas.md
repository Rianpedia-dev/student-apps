# Panduan Hak Akses: Guru vs Guru & Wali Kelas
### SD - SMP Islam Al-Azhar Cairo Palembang

---

## 📌 Ringkasan Cepat (Inti Perbedaan)

| Kategori | Guru Mata Pelajaran | Guru & Wali Kelas |
| :--- | :--- | :--- |
| **Kode Status** | `2` | `4` |
| **Fokus Utama** | Mengajar mata pelajaran yang diampu | Mengajar mapel **+** membina 1 kelas |
| **Kelas Binaan** | Tidak punya kelas binaan | Memiliki 1 rombel binaan resmi |
| **Menu di Sidebar** | 8 Menu KBM & Komunikasi | 10 Menu (termasuk *Kelas Saya* & *Absensi*) |
| **Kelola Siswa Rombel** | ❌ Tidak berwenang | ✅ Berwenang mendaftarkan / mutasi siswa |
| **Absensi Harian Kelas** | ❌ Tidak berwenang | ✅ Berwenang mencatat presensi harian |
| **Pengaturan Status** | 🔒 Hanya oleh Administrator | 🔒 Hanya oleh Administrator |

---

## 📘 1. Guru Mata Pelajaran (Status `2`)

Guru Mata Pelajaran berfokus penuh pada **kualitas proses belajar mengajar (KBM)** dan materi akademik.

### ✅ Hak Akses & Fitur yang Dapat Digunakan:
* **Dashboard Guru (`/guru`)**:
  * Menampilkan badge **Guru Mata Pelajaran** dan nama mapel yang diajar.
  * Ringkasan: *Materi & Modul*, *Jadwal Mengajar*, *Tugas Aktif*, dan *Perlu Dinilai*.
* **Materi & Modul Pembelajaran (`/guru/mapel`)**:
  * Membuat materi baru untuk kelas-kelas yang diajarkan.
  * Mengunggah modul file (PDF, Word, PPT), link video pembelajaran, dan instruksi KBM.
* **Tugas, Kuis, & Ujian (`/guru/tugas`)**:
  * Membuat penugasan (pilihan ganda otomatis dinilai, esai, atau unggah file tugas).
  * Memeriksa jawaban siswa, memberi nilai angka, dan feedback catatan koreksi.
* **Chat Interaktif (`/guru/chat`)**:
  * Melayani tanya-jawab materi pelajaran langsung dengan siswa.
* **Kelas Online Video (`/guru/kelas-online`)**:
  * Membuka ruang tatap muka daring interaktif dengan siswa.
* **Kalender & Pengumuman (`/guru/calendar` & `/guru/announcements`)**:
  * Melihat jadwal KBM, agenda akademik sekolah, dan pengumuman resmi.
* **Prestasi & Catatan Pelanggaran**:
  * Mencatat prestasi siswa atau melaporkan pelanggaran perilaku murid saat jam pelajarannya.

### ❌ Batasan Guru Mata Pelajaran:
* **Menu "Kelas Saya" dan "Absensi Kelas" otomatis disembunyikan** dari sidebar navigasi.
* Tidak dibebani administrasi absensi pagi atau pembagian rombel murid.
* Jika membuka URL perwalian secara langsung, sistem menampilkan kartu informasi ramah yang mengarahkan kembali ke modul *Mapel & Tugas*.

---

## 📗 2. Guru & Wali Kelas (Status `4`)

Guru & Wali Kelas adalah guru mata pelajaran yang juga diberikan Surat Keputusan (SK) penugasan sebagai **Wali Kelas / Pembina Rombel**.

### ✅ Hak Akses & Fitur yang Dapat Digunakan:
* **Semua Hak Akses Guru Mapel**:
  * Tetap membuat materi, tugas, memeriksa nilai, konsultasi chat, dan membuka kelas online.
* **Dashboard Khusus Wali Kelas (`/guru`)**:
  * Menampilkan badge **Guru & Wali Kelas** dan nama rombel binaan (misal: *Kelas 6 - Tholhah bin Ubaidillah*).
  * Statistik rombel: *Jumlah Siswa Kelas Binaan* dan *Tingkat Kehadiran Hari Ini*.
* **Menu "Kelas Saya" (`/guru/my-class`)**:
  * Melihat daftar lengkap anak didik di kelas binaannya.
  * **Daftarkan Siswa (*Enroll*)**: Menambahkan siswa baru ke kelasnya.
  * **Keluarkan Siswa (*Remove*)**: Melepaskan siswa jika terjadi mutasi kelas.
  * **Catatan Wali Kelas**: Mengisi evaluasi kepribadian dan catatan karakter siswa binaan.
  * **Pantau Poin Disiplin**: Melihat rekap poin perilaku dan riwayat pelanggaran anak binaannya.
* **Menu "Absensi Kelas" (`/guru/attendance`)**:
  * **Input Absensi Harian**: Mengisi presensi kehadiran kelas (Hadir, Sakit, Izin, Alpa) setiap pagi.
  * **Matriks Bulanan**: Melihat grafik dan rekapitulasi presensi satu bulan.
  * **Koreksi Presensi**: Mengubah atau menghapus data jika ada kesalahan tanggal.
  * **Export Laporan PDF**: Mengunduh rekapan absensi kelas untuk laporan resmi ke sekolah/orang tua.

---

## 📊 3. Perbandingan Lengkap Fitur (Head-to-Head)

| Modul & Fitur Sistem | Guru Mapel | Guru & Wali Kelas | Keterangan |
| :--- | :---: | :---: | :--- |
| **Kelola Materi KBM** | ✅ Ya | ✅ Ya | Upload modul, PDF, dan video materi |
| **Buat Tugas & Ujian** | ✅ Ya | ✅ Ya | Buat kuis PG, esai, tugas file |
| **Koreksi & Beri Nilai** | ✅ Ya | ✅ Ya | Memeriksa dan menilai jawaban siswa |
| **Chat Konsultasi Siswa** | ✅ Ya | ✅ Ya | Komunikasi belajar privat dengan siswa |
| **Kelas Online Video** | ✅ Ya | ✅ Ya | Sesi tatap muka tatap maya |
| **Kalender & Pengumuman** | ✅ Ya | ✅ Ya | Informasi agenda resmi sekolah |
| **Menu "Kelas Saya"** | ❌ Tidak | ✅ Ya | Hanya tampil jika berstatus Wali Kelas |
| **Daftar Murid Rombel** | ❌ Tidak | ✅ Ya | Khusus melihat murid kelas binaannya |
| **Mutasi Siswa Rombel** | ❌ Tidak | ✅ Ya | Enroll atau Remove siswa di rombelnya |
| **Catatan Karakter Raport**| ❌ Tidak | ✅ Ya | Input catatan kepribadian anak binaan |
| **Menu "Absensi Kelas"** | ❌ Tidak | ✅ Ya | Hanya tampil jika berstatus Wali Kelas |
| **Input Presensi Harian** | ❌ Tidak | ✅ Ya | Catat Hadir, Sakit, Izin, Alpa |
| **Ekspor Rekap Absen PDF** | ❌ Tidak | ✅ Ya | Download laporan kehadiran bulanan |

---

## 🔐 4. Aturan & Kebijakan Pengaturan Status

### Kenapa Guru Tidak Bisa Mengatur Status & Bidang Studi Sendiri di Profil?
1. **Mencegah Klaim Kelas & Penugasan Sepihak**: Agar tidak ada guru yang secara mandiri mengubah rombel binaan atau bidang studi pengampu tanpa penetapan resmi kurikulum sekolah.
2. **Integritas Database Sekolah**: Setiap rombel hanya boleh memiliki satu wali kelas aktif, dan bidang studi guru diselaraskan langsung dengan master mata pelajaran yang terdaftar.
3. **Tampilan Kolom di Profil Guru Bersifat Read-Only**:
   * **Bidang Studi (Mapel)**: Bersifat *Read-Only* (badge info). Guru dapat melihat mata pelajaran yang diampunya, namun pengaturannya dilakukan oleh Admin melalui menu master Mata Pelajaran & Kelola Guru.
   * **Wali Kelas**: Bersifat *Read-Only* (badge info). Guru hanya dapat melihat status peran dan nama kelas binaannya saat ini.
   * Keduanya tidak dapat diedit atau dimanipulasi secara mandiri oleh akun guru.

### Cara Administrator Mengatur Status & Mapel Guru:
Pengaturan penugasan sepenuhnya berada di tangan **Administrator** melalui menu **Admin > Kelola Guru (`/admin/teachers`)**:

1. **Tambah Akun Guru Baru**:
   * Admin memilih opsi peran: *Guru Mata Pelajaran* atau *Guru & Wali Kelas*.
   * Jika memilih *Guru & Wali Kelas*, Admin **wajib** memilih salah satu kelas binaan dari daftar yang ada.
2. **Edit Data / Ganti Penugasan**:
   * Admin dapat menaikkan guru mapel menjadi wali kelas, memindahkan kelas binaan, atau mencabut status wali kelas.
3. **Verifikasi Guru Baru**:
   * Guru yang baru mendaftar (status pending `0`) dapat diverifikasi oleh Admin menjadi Guru Mapel (`2`) atau Guru & Wali Kelas (`4`).
4. **Sinkronisasi Dua Arah Otomatis**:
   * Sistem otomatis memperbarui nama wali kelas pada data rombel (`tbl_kelas.wali-kelas`).
   * Jika tugas wali kelas dicabut, sistem otomatis membersihkan data lama tanpa merusak data siswa di dalamnya.

---

## ❓ 5. Pertanyaan Umum (FAQ)

**Q: Saya seorang Guru Mapel, mengapa menu "Kelas Saya" dan "Absensi Kelas" tidak muncul di sidebar saya?**  
> **A:** Ini adalah perilaku sistem yang benar. Menu tersebut dikhususkan bagi guru yang ditugaskan sebagai Wali Kelas. Guru Mapel berfokus pada menu **Mapel & Tugas**.

**Q: Saya baru saja ditunjuk menjadi Wali Kelas, bagaimana cara mengaktifkan fiturnya?**  
> **A:** Hubungi Administrator sekolah. Admin akan membuka menu **Kelola Guru**, mengedit akun Anda, mengubah peran menjadi **Guru & Wali Kelas**, dan memilih kelas binaan Anda. Setelah disimpan, menu *Kelas Saya* dan *Absensi Kelas* akan otomatis muncul di akun Anda.

**Q: Apakah Wali Kelas tetap bisa mengajar mata pelajaran lain?**  
> **A:** Ya, tentu saja. Wali Kelas memiliki seluruh fitur pengajaran Guru Mapel dan tetap bisa mengajar di kelas-kelas lain seperti biasa.
