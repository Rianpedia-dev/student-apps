# 🚀 Panduan Lengkap Deployment ke Production — Student Apps Al-Azhar Cairo Palembang

> **Target Kapasitas**: 1.500+ Pengguna Aktif Harian (Siswa SD/SMP, Guru, Wali Kelas, Admin, Super Admin)  
> **Teknologi**: Next.js 16 (App Router + Turbopack + Standalone) + React 19 + Prisma 7 + MySQL 8.0 + Redis 7 + Socket.IO 4 + Nginx + PM2/Docker  
> **Dokumen Rujukan Audit**: [`plan-update-.md`](file:///c:/ruang-kerja-alazhar/student-app/plan-update-.md) & [`docs/runbook.md`](file:///c:/ruang-kerja-alazhar/student-app/docs/runbook.md)  
> **Status Kode**: 🟢 Siap Production (176 Unit Tests Lolos, Build Next.js 16 Sukses)

---

## 📑 DAFTAR ISI

1. [Arsitektur Sistem & Spesifikasi Server Produksi](#1-arsitektur-sistem--spesifikasi-server-produksi)
2. [Tahap 1: Persiapan Server & Infrastruktur (Prerequisites)](#2-tahap-1-persiapan-server--infrastruktur-prerequisites)
   - [1.1 Rekomendasi Hardware & Provider](#11-rekomendasi-hardware--provider)
   - [1.2 Setup Keamanan OS & Firewall (UFW)](#12-setup-keamanan-os--firewall-ufw)
   - [1.3 Konfigurasi DNS Domain & SSL/TLS Certificate](#13-konfigurasi-dns-domain--ssltls-certificate)
3. [Tahap 2: Konfigurasi Environment & Keamanan (Pre-Flight Checklist)](#3-tahap-2-konfigurasi-environment--keamanan-pre-flight-checklist)
   - [2.1 File Konfigurasi `.env.production`](#21-file-konfigurasi-envproduction)
   - [2.2 Checklist Validasi Keamanan Kritis (P0)](#22-checklist-validasi-keamanan-kritis-p0)
4. [Tahap 3: Metode Deployment — Langkah Demi Langkah](#4-tahap-3-metode-deployment--langkah-demi-langkah)
   - [Metode A: Docker Compose (Rekomendasi Utama)](#metode-a-docker-compose-rekomendasi-utama)
   - [Metode B: Native Bare-Metal / VPS (PM2 + Nginx / Windows Server)](#metode-b-native-bare-metal--vps-pm2--nginx--windows-server)
5. [Tahap 4: Migrasi Database & Keamanan Password Legacy](#5-tahap-4-migrasi-database--keamanan-password-legacy)
   - [5.1 Sinkronisasi Skema Prisma ke MySQL](#51-sinkronisasi-skema-prisma-ke-mysql)
   - [5.2 Eksekusi Skrip Migrasi Password Plaintext ke Bcrypt](#52-eksekusi-skrip-migrasi-password-plaintext-ke-bcrypt)
   - [5.3 Pengisian Data Master / Seeding (Opsional)](#53-pengisian-data-master--seeding-opsional)
6. [Tahap 5: Konfigurasi Reverse Proxy Nginx & Optimasi Performa](#6-tahap-5-konfigurasi-reverse-proxy-nginx--optimasi-performa)
   - [6.1 Konfigurasi Nginx untuk Static Caching & WebSocket](#61-konfigurasi-nginx-untuk-static-caching--websocket)
   - [6.2 Optimasi Parameter MySQL untuk 1.500 User Bersamaan](#62-optimasi-parameter-mysql-untuk-1500-user-bersamaan)
7. [Tahap 6: Pipeline CI/CD Otomatis dengan GitHub Actions](#7-tahap-6-pipeline-cicd-otomatis-dengan-github-actions)
   - [7.1 Konfigurasi Repository Secrets](#71-konfigurasi-repository-secrets)
   - [7.2 Workflow `.github/workflows/deploy.yml`](#72-workflow-githubworkflowsdeployyml)
   - [7.3 Alur Kerja Zero-Downtime Deployment](#73-alur-kerja-zero-downtime-deployment)
8. [Tahap 7: Validasi Kesiapan & Pengujian Beban (Go-Live Smoke Test)](#8-tahap-7-validasi-kesiapan--pengujian-beban-go-live-smoke-test)
   - [8.1 Pemeriksaan Endpoint Health Check](#81-pemeriksaan-endpoint-health-check)
   - [8.2 Pengujian Beban Simulasi 100 - 1.500 Virtual Users](#82-pengujian-beban-simulasi-100---1500-virtual-users)
9. [Tahap 8: Pencadangan Otomatis (Backup) & Disaster Recovery](#9-tahap-8-pencadangan-otomatis-backup--disaster-recovery)
   - [9.1 Otomasi Backup MySQL dengan Cron](#91-otomasi-backup-mysql-dengan-cron)
   - [9.2 Prosedur Restore Database Darurat](#92-prosedur-restore-database-darurat)
   - [9.3 Backup Berkas Media & Dokumen Upload](#93-backup-berkas-media--dokumen-upload)
10. [Tahap 9: Monitoring, Alerting & Runbook Troubleshooting](#10-tahap-9-monitoring-alerting--runbook-troubleshooting)
    - [10.1 Pemantauan Server & Uptime Kuma](#101-pemantauan-server--uptime-kuma)
    - [10.2 Matriks Penanganan Insiden Cepat (Troubleshooting)](#102-matriks-penanganan-insiden-cepat-troubleshooting)
11. [Cheatsheet Perintah Operasional Administrator](#11-cheatsheet-perintah-operasional-administrator)

---

## 1. Arsitektur Sistem & Spesifikasi Server Produksi

Aplikasi **Student Apps Al-Azhar Cairo Palembang** melayani kebutuhan dua jenjang sekolah (**SD Islam Al-Azhar 44** dan **SMP Islam Al-Azhar 33**) secara terisolasi dengan otorisasi berbasis peran (RBAC).

```
                      [ Pengguna: Siswa / Guru / Admin (1.500+ User) ]
                                            │
                                            ▼
                           [ DNS / Cloudflare Proxy (WAF) ]
                                            │ (HTTPS: Port 443)
                                            ▼
                        [ Nginx Reverse Proxy & Load Balancer ]
                           ├── Static Assets (/_next/static/) -> Caching Disk 365d
                           ├── Uploads (/uploads/)             -> Caching Disk 30d
                           ├── WebSocket (/socket.io/)         -> Forward ke Port 3001
                           └── Web App & API (/)               -> Forward ke Port 3000
                                       │                   │
                        ┌──────────────┘                   └──────────────┐
                        ▼                                                 ▼
             [ Next.js 16 App Service ]                        [ Socket.IO Real-time ]
             - Turbopack Standalone Node                       - Capability JWT Token
             - Proxy Security (src/proxy.ts)                   - Chat & Notifikasi
             - Multi-Layer In-Memory Cache                     - Port 3001
                        │                                                 │
                        ├─────────────────────────┬───────────────────────┤
                        ▼                         ▼                       ▼
            [ Redis 7 (In-Memory) ]    [ MySQL 8.0 Server ]    [ Persistent Storage ]
            - Session / Rate Limit     - Buffer Pool 1GB       - /public/uploads
            - Socket Adapter           - Max Conn: 300         - Dokumen, Tugas, Foto
```

---

## 2. Tahap 1: Persiapan Server & Infrastruktur (Prerequisites)

### 1.1 Rekomendasi Hardware & Provider

Untuk menangani **1.500 pengguna aktif harian** (dengan perkiraan jam sibuk 300-500 pengguna bersamaan saat jam masuk absensi dan pengumpulan tugas):

| Komponen | Spesifikasi Minimum | Rekomendasi Ideal (Optimal) |
|---|---|---|
| **CPU** | 2 vCPU | 4 vCPU (High Performance) |
| **RAM** | 4 GB | 8 GB RAM |
| **Storage** | 50 GB NVMe / SSD | 100 GB NVMe SSD |
| **Bandwidth** | 100 Mbps unmetered | 1 Gbps unmetered |
| **Sistem Operasi** | Ubuntu 22.04 / 24.04 LTS *(Rekomendasi)* | Windows Server 2022 (jika bare-metal lokal) |

**Pilihan Provider Cloud / VPS**:
- **VPS Datacenter Indonesia** (Latensi terendah untuk sekolah): IDCloudHost, Biznet Gio, Niagahoster VPS, atau Deka Cloud (~Rp350.000 - Rp600.000/bln).
- **VPS Global Datacenter Singapura**: DigitalOcean Droplet (4 vCPU, 8GB RAM ~$48/bln) atau Hetzner Cloud / Linode.

### 1.2 Setup Keamanan OS & Firewall (UFW)

Jika menggunakan Ubuntu Server, login via SSH sebagai root dan amankan port:

```bash
# 1. Update paket sistem
sudo apt update && sudo apt upgrade -y

# 2. Install dependensi esensial
sudo apt install -y curl wget git unzip htop ufw fail2ban certbot python3-certbot-nginx

# 3. Konfigurasi Firewall UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Let's Encrypt / Redirect)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 1.3 Konfigurasi DNS Domain & SSL/TLS Certificate

1. Arahkan DNS **A Record** dari domain/subdomain Anda (misal `sisfo.alazhar-palembang.sch.id`) ke IP Publik Server Anda.
2. Jika menggunakan Cloudflare, atur mode SSL ke **Full (Strict)**.
3. Terbitkan sertifikat SSL Let's Encrypt secara gratis:

```bash
sudo certbot certonly --standalone -d sisfo.alazhar-palembang.sch.id --agree-tos -m admin@alazhar-palembang.sch.id
```
Sertifikat akan tersimpan di:
- Certificate: `/etc/letsencrypt/live/sisfo.alazhar-palembang.sch.id/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/sisfo.alazhar-palembang.sch.id/privkey.pem`

---

## 3. Tahap 2: Konfigurasi Environment & Keamanan (Pre-Flight Checklist)

### 2.1 File Konfigurasi `.env.production`

Buat berkas `.env.production` di root direktori proyek (`/opt/student-apps` atau `C:\apps\sisfo-alazhar-sd`). Gunakan template resmi dari [`.env.production.example`](file:///c:/ruang-kerja-alazhar/student-app/.env.production.example):

```bash
# ===================================================================
# KONFIGURASI PRODUCTION RESMI — AL-AZHAR CAIRO PALEMBANG
# ===================================================================
NODE_ENV="production"
PORT=3000

# 1. KONEKSI DATABASE MYSQL / MARIADB
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE?connection_limit=30
DATABASE_URL="mysql://sisfo_user:GantiDenganPasswordDatabaseSangatKuat2026!@127.0.0.1:3306/sisfo_alazhar"
DB_CONNECTION_LIMIT=30
DB_SSL_REJECT_UNAUTHORIZED="true"

# 2. ENKRIPSI TOKEN SESI & CAPABILITY TOKEN SOCKET
# WAJIB minimal 64 karakter acak! Dibuat via: openssl rand -base64 48
AUTH_SECRET="K7m9Z3qW8pL1xR5vT2yA4bC6dE8fG0hI2jK4mN6oP8qR0sT2uV4wX6yZ8aB0cD2e"

# 3. MODE KEAMANAN PRODUKSI
# WAJIB "false"! Mematikan semua akun demo dan bypass login
ENABLE_DEMO_MODE="false"

# 4. RATE LIMITING SLIDING-WINDOW
RATE_LIMIT_ENABLED="true"

# 5. WEBSOCKET REAL-TIME SERVER (SOCKET.IO)
SOCKET_PORT=3001
SOCKET_CORS_ORIGIN="https://sisfo.alazhar-palembang.sch.id"

# 6. DISTRIBUTED CACHE & ADAPTER
REDIS_URL="redis://127.0.0.1:6379"

# 7. INTEGRASI VIDEO CALL (Opsional)
DAILY_API_KEY=""
```

### 2.2 Checklist Validasi Keamanan Kritis (P0)

Sebelum menjalankan aplikasi, pastikan:
- [x] **`AUTH_SECRET` Bukan Nilai Default**: Jangan gunakan string bawaan repository. Jika `AUTH_SECRET` kurang dari 32 karakter di mode `production`, sistem akan menolak boot (`FATAL SECURITY ERROR`).
- [x] **`ENABLE_DEMO_MODE` Diset `"false"`**: Mencegah pihak luar masuk menggunakan akun demo guru/siswa/admin default tanpa password asli.
- [x] **`SOCKET_CORS_ORIGIN` Dikunci**: Harus mengarah tepat ke `https://domain-resmi.sch.id` (bukan wildcard `*`).
- [x] **Proxy Keamanan Next.js 16 Aktif**: Berkas [`src/proxy.ts`](file:///c:/ruang-kerja-alazhar/student-app/src/proxy.ts) menangani otentikasi edge, isolasi jenjang SD vs SMP, serta proteksi unauthorized route.

---

## 4. Tahap 3: Metode Deployment — Langkah Demi Langkah

Anda dapat memilih salah satu dari dua metode deployment yang didukung:

---

### Metode A: Docker Compose (Rekomendasi Utama)

Metode ini mengemas seluruh aplikasi (Next.js Standalone, Standalone Socket.IO, MySQL 8.0 teroptimasi, Redis 7, dan Nginx Reverse Proxy) ke dalam container terisolasi menggunakan [`docker-compose.production.yml`](file:///c:/ruang-kerja-alazhar/student-app/docker-compose.production.yml).

#### Langkah A.1: Instalasi Docker & Docker Compose di Server

```bash
# Hapus versi lama jika ada
sudo apt remove -y docker docker-engine docker.io containerd runc

# Pasang Docker resmi
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verifikasi
docker --version && docker compose version
```

#### Langkah A.2: Clone Repository & Persiapan Folder

```bash
# Buat direktori aplikasi
sudo mkdir -p /opt/student-apps
sudo chown -R $USER:$USER /opt/student-apps
cd /opt/student-apps

# Clone repository
git clone https://github.com/organisasi-sekolah/student-app.git .

# Salin SSL sertifikat ke folder config/ssl (agar dapat dibaca Nginx container)
mkdir -p config/ssl
sudo cp /etc/letsencrypt/live/sisfo.alazhar-palembang.sch.id/fullchain.pem config/ssl/
sudo cp /etc/letsencrypt/live/sisfo.alazhar-palembang.sch.id/privkey.pem config/ssl/
sudo chmod 644 config/ssl/*.pem
```

#### Langkah A.3: Siapkan File Konfigurasi `.env`

```bash
cp .env.production.example .env
nano .env
# Edit DATABASE_URL, AUTH_SECRET, DB_ROOT_PASSWORD, dll.
```

#### Langkah A.4: Build & Jalankan Seluruh Container

```bash
# Build seluruh image dan jalankan di background (-d)
docker compose -f docker-compose.production.yml up -d --build

# Periksa status seluruh container
docker compose -f docker-compose.production.yml ps
```
Pastikan 5 container berstatus **Up (healthy)**:
- `sisfo_app` (Next.js 16 Standalone Port 3000)
- `sisfo_socket` (Socket.IO Server Port 3001)
- `sisfo_mysql` (MySQL 8.0 Port 3306)
- `sisfo_redis` (Redis 7 Port 6379)
- `sisfo_nginx` (Nginx Ports 80 & 443)

---

### Metode B: Native Bare-Metal / VPS (PM2 + Nginx / Windows Server)

Metode ini cocok untuk VPS langsung tanpa Docker atau mesin lokal Windows Server sekolah.

#### Langkah B.1: Instalasi Node.js 22 LTS, PM2 & Database

```bash
# Di Ubuntu Server:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs mysql-server redis-server
sudo npm install -g pm2

# Di Windows Server:
# Unduh Node.js 22 LTS (msi), MySQL Installer 8.0, dan jalankan di PowerShell Administrator:
# npm install -g pm2
```

#### Langkah B.2: Setup Proyek & Build

```powershell
# Masuk ke direktori aplikasi
cd C:\apps\sisfo-alazhar-sd   # atau /opt/student-apps di Linux

# Install seluruh dependency sesuai lockfile
npm ci

# Generate Prisma Client
npx prisma generate

# Kompilasi Next.js untuk production
npm run build
```

#### Langkah B.3: Menjalankan Cluster dengan PM2

Proyek sudah dilengkapi konfigurasi resmi di [`ecosystem.config.cjs`](file:///c:/ruang-kerja-alazhar/student-app/ecosystem.config.cjs):
- **Aplikasi Web**: Menjalankan mode `cluster` dengan alokasi core CPU maksimal dan auto-restart jika memori melebihi 1 GB.
- **Server Socket**: Berjalan pada proses tersendiri (port 3001).

```bash
# Jalankan seluruh service
pm2 start ecosystem.config.cjs

# Simpan daftar proses agar otomatis menyala saat server restart
pm2 save
pm2 startup
```

---

## 5. Tahap 4: Migrasi Database & Keamanan Password Legacy

Sebelum pengguna dapat login, struktur tabel database harus disinkronkan dan seluruh password warisan (legacy) harus diamankan.

### 5.1 Sinkronisasi Skema Prisma ke MySQL

Jalankan perintah berikut:

```bash
# Jika menggunakan Docker Compose:
docker compose -f docker-compose.production.yml exec app npx prisma db push --skip-generate

# Jika menggunakan Native / PM2:
npx prisma db push --skip-generate
```

> [!NOTE]
> `prisma db push` mengaplikasikan 25 model tabel di [`prisma/schema.prisma`](file:///c:/ruang-kerja-alazhar/student-app/prisma/schema.prisma) beserta indeks performa baru (`@@index([jenjang, kelas])`, `@@index([guru_bidang])`, dll.) langsung ke database MySQL produksi tanpa merusak data yang telah ada.

### 5.2 Eksekusi Skrip Migrasi Password Plaintext ke Bcrypt

Audit arsitektur mengungkap bahwa sistem warisan lama pernah menyimpan password plaintext di kolom `password1`. Proyek ini telah dilengkapi skrip audit otomatis di [`scripts/migrate-passwords.ts`](file:///c:/ruang-kerja-alazhar/student-app/scripts/migrate-passwords.ts).

Jalankan skrip ini sekali saat pertama kali deploy:

```bash
# Jika menggunakan Docker Compose:
docker compose -f docker-compose.production.yml exec app npx tsx scripts/migrate-passwords.ts

# Jika menggunakan Native / PM2:
npx tsx scripts/migrate-passwords.ts
```

**Hasil Eksekusi**:
1. Mengambil seluruh user yang memiliki isi di kolom `password1`.
2. Mengenkripsi ulang password tersebut menggunakan algoritma **Bcrypt dengan 12 Salt Rounds**.
3. Mengosongkan kolom `password1` menjadi `NULL` sehingga tidak ada lagi data kredensial terbuka di database.

> [!TIP]
> **Transparent Lazy Upgrade**: Bila ada user yang belum sempat termigrasi lewat batch script, sistem otentikasi di [`src/lib/auth.ts`](file:///c:/ruang-kerja-alazhar/student-app/src/lib/auth.ts) otomatis akan meng-upgrade hash password ke Bcrypt dan mengosongkan plaintext saat pertama kali user tersebut berhasil login.

### 5.3 Pengisian Data Master / Seeding (Opsional)

Jika memulai database baru dari nol (fresh installation) dan ingin mengisi mata pelajaran, pertemuan, atau jadwal standar:

```bash
# Eksekusi seed master akademik
npm run seed:academic
```

---

## 6. Tahap 5: Konfigurasi Reverse Proxy Nginx & Optimasi Performa

### 6.1 Konfigurasi Nginx untuk Static Caching & WebSocket

Konfigurasi produksi lengkap sudah disediakan di [`config/nginx.conf`](file:///c:/ruang-kerja-alazhar/student-app/config/nginx.conf).

Jika Anda menggunakan Nginx native pada host server Linux:

```bash
# Salin konfigurasi ke sites-available
sudo cp config/nginx.conf /etc/nginx/sites-available/sisfo-alazhar.conf

# Edit domain dan path SSL jika diperlukan
sudo nano /etc/nginx/sites-available/sisfo-alazhar.conf

# Buat symlink ke sites-enabled
sudo ln -sf /etc/nginx/sites-available/sisfo-alazhar.conf /etc/nginx/sites-enabled/

# Uji sintaksis Nginx
sudo nginx -t

# Muat ulang Nginx
sudo systemctl reload nginx
```

#### Fitur Utama Konfigurasi Nginx:
1. **DDoS & Brute Force Rate Limiting**:
   - Limit API umum: `30 request/detik` per IP.
   - Limit `/login`: Maksimal `5 request/menit` per IP untuk mencegah serangan penebakan password massal.
2. **WebSocket Upgrade**:
   - Menghubungkan jalur `/socket.io/` ke server Socket port 3001 dengan timeout 24 jam tanpa terputus.
3. **Static Asset Caching (Immutable)**:
   - Aset `/_next/static/` di-cache di browser selama **365 hari** (`Cache-Control: public, max-age=31536000, immutable`).
4. **Ukuran Upload File**:
   - `client_max_body_size 35M;` memungkinkan guru dan siswa mengunggah dokumen PDF dan gambar tugas hingga 35MB.

### 6.2 Optimasi Parameter MySQL untuk 1.500 User Bersamaan

Konfigurasi resmi telah dibuat di [`config/my.cnf`](file:///c:/ruang-kerja-alazhar/student-app/config/my.cnf). Parameter utama yang diterapkan:

```ini
[mysqld]
# Koneksi Maksimal
max_connections = 300
connect_timeout = 10
wait_timeout = 600

# Buffer Pool Memori (1GB dialokasikan untuk caching index dan baris tabel di RAM)
innodb_buffer_pool_size = 1G
innodb_buffer_pool_instances = 2
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Slow Query Logging (mencatat query yang melebihi 2 detik)
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

---

## 7. Tahap 6: Pipeline CI/CD Otomatis dengan GitHub Actions

Proyek ini telah dikonfigurasikan dengan alur kerja continuous integration & delivery di [`.github/workflows/deploy.yml`](file:///c:/ruang-kerja-alazhar/student-app/.github/workflows/deploy.yml).

### 7.1 Konfigurasi Repository Secrets

Buka repositori Anda di GitHub: **Settings > Secrets and variables > Actions > New repository secret**. Tambahkan variabel berikut:

| Nama Secret | Deskripsi / Contoh Nilai |
|---|---|
| `SERVER_HOST` | IP publik server produksi Anda (misal `103.120.x.x`) |
| `SERVER_USER` | Username SSH (misal `ubuntu` atau `deployer`) |
| `SSH_PRIVATE_KEY` | Private SSH Key server (`-----BEGIN OPENSSH PRIVATE KEY-----...`) |
| `SERVER_PORT` | Port SSH server (default `22`) |

### 7.2 Workflow `.github/workflows/deploy.yml`

Pipeline ini memastikan:
1. **Quality Gate**: Menjalankan linting dan **176 unit tests** di lingkungan Ubuntu Runner. Jika ada logika absensi, autentikasi, atau enkripsi yang gagal, proses deployment **langsung dibatalkan secara otomatis**.
2. **Build & Zero-Downtime Reload**: Jika seluruh test lolos, kode di server akan di-pull, dependensi diperbarui, Prisma di-generate, aplikasi di-build, dan service di-reload tanpa memutus koneksi pengguna.

Berikut isi workflow teruji yang dapat disesuaikan untuk Docker maupun PM2:

```yaml
name: Production Quality Gate & Deployment

on:
  push:
    branches:
      - main
      - master

jobs:
  # Tahap 1: Quality Gate & Automated Testing
  test:
    name: Run Automated Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install Dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run 176 Unit Tests
        run: npm run test

  # Tahap 2: Deployment ke Server Produksi
  deploy:
    name: Build & Zero Downtime Deploy
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy via SSH ke Server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SERVER_PORT || 22 }}
          script_stop: true
          script: |
            cd /opt/student-apps
            echo "🚀 Menarik pembaruan kode terbaru..."
            git pull origin main

            # Jika menggunakan Docker Compose:
            if [ -f "docker-compose.production.yml" ]; then
              echo "🐳 Rebuilding Docker Container..."
              docker compose -f docker-compose.production.yml build app socket
              docker compose -f docker-compose.production.yml up -d --no-deps app socket
              docker compose -f docker-compose.production.yml exec app npx prisma db push --skip-generate
            else
              # Jika menggunakan PM2 Native:
              echo "⚙️ Memperbarui aplikasi via PM2..."
              npm ci
              npx prisma generate
              npx prisma db push --skip-generate
              npm run build
              pm2 reload ecosystem.config.cjs
              pm2 save
            fi

            echo "✅ Deployment selesai tanpa kendala!"
```

---

## 8. Tahap 7: Validasi Kesiapan & Pengujian Beban (Go-Live Smoke Test)

### 8.1 Pemeriksaan Endpoint Health Check

Setelah aplikasi berjalan, lakukan verifikasi integritas endpoint:

```bash
# 1. Periksa Health Check Aplikasi Next.js & Database
curl -I https://sisfo.alazhar-palembang.sch.id/api/health
```

Respon HTTP 200 JSON yang diharapkan:
```json
{
  "status": "ok",
  "uptimeSeconds": 124,
  "environment": "production",
  "memory": { "rssMB": 125.4, "heapUsedMB": 68.2 },
  "database": { "status": "connected", "latencyMs": 4 },
  "cache": { "activeEntries": 12 }
}
```

```bash
# 2. Periksa Endpoint WebSocket Server
curl http://localhost:3001/health
```

Respon yang diharapkan:
```json
{
  "status": "ok",
  "service": "socket-io-realtime",
  "activeConnections": 0,
  "authenticatedUsers": 0
}
```

### 8.2 Pengujian Beban Simulasi 100 - 1.500 Virtual Users

Proyek telah dilengkapi engine stress test berbasis native Node.js di [`scripts/run-load-test.ts`](file:///c:/ruang-kerja-alazhar/student-app/scripts/run-load-test.ts).

Jalankan simulasi 100 pengguna serentak dengan 1.000 total request:

```bash
npx tsx scripts/run-load-test.ts https://sisfo.alazhar-palembang.sch.id 100 1000
```

Atau jika server Anda telah terpasang **k6**, jalankan skrip load testing di [`test/load/smoke-test.js`](file:///c:/ruang-kerja-alazhar/student-app/test/load/smoke-test.js):

```bash
k6 run test/load/smoke-test.js
```

**Target Ambang Batas (SLA Kualitas)**:
- Rata-rata response time: `< 500 ms`
- 95th Percentile (P95): `< 2.000 ms`
- Error rate: `< 1%`
- Memory leakage: `0%` (konstan setelah garbage collection)

---

## 9. Tahap 8: Pencadangan Otomatis (Backup) & Disaster Recovery

### 9.1 Otomasi Backup MySQL dengan Cron

Skrip pencadangan otomatis telah disiapkan di [`scripts/backup-db.sh`](file:///c:/ruang-kerja-alazhar/student-app/scripts/backup-db.sh). Skrip ini melakukan dump database MySQL, mengompresinya dengan gzip, dan menghapus arsip yang lebih lama dari 30 hari.

Pasang crontab di server produksi agar backup berjalan setiap 6 jam:

```bash
# Buka crontab editor
sudo crontab -e

# Tambahkan baris berikut di akhir berkas:
0 */6 * * * /opt/student-apps/scripts/backup-db.sh >> /var/log/backup-db.log 2>&1
```

### 9.2 Prosedur Restore Database Darurat

Jika terjadi kesalahan data atau database rusak:

```bash
# 1. Cari berkas cadangan terbaru di /backups/mysql/
ls -lh /backups/mysql/

# 2. Ekstrak dan masukkan file sql.gz ke MySQL
gunzip < /backups/mysql/backup_sisfo_alazhar_20261029_120000.sql.gz | mysql -u sisfo_user -p sisfo_alazhar

# 3. Restart kontainer / proses aplikasi
docker compose -f docker-compose.production.yml restart app
# atau jika PM2:
# pm2 restart student-apps
```

### 9.3 Backup Berkas Media & Dokumen Upload

Folder direktori upload berkas berada di `public/uploads/` (atau volume `sisfo_uploads` di Docker).

Untuk mem-backup seluruh file tugas dan foto profil siswa/guru:

```bash
# Backup mingguan ke direktori terpisah
tar -czvf /backups/uploads_$(date +%Y%m%d).tar.gz /opt/student-apps/public/uploads/
```

---

## 10. Tahap 9: Monitoring, Alerting & Runbook Troubleshooting

### 10.1 Pemantauan Server & Uptime Kuma

Disarankan memasang alat monitoring ringan **Uptime Kuma** (bisa dipasang via Docker) atau menggunakan layanan gratis seperti **Better Stack / Uptimerobot**:
1. Pasang monitor HTTP GET ke `https://sisfo.alazhar-palembang.sch.id/api/health` dengan interval setiap 60 detik.
2. Atur notifikasi otomatis via Bot Telegram atau WhatsApp jika status check mengembalikan HTTP 500/503 atau server down lebih dari 2 menit berturut-turut.

### 10.2 Matriks Penanganan Insiden Cepat (Troubleshooting)

| Gejala Masalah | Kemungkinan Penyebab | Tindakan Perbaikan Cepat |
|---|---|---|
| **Health Check `degraded`** | Koneksi MySQL timeout / terputus | Periksa service database: `docker compose logs db --tail=50` atau `sudo systemctl status mysql`. |
| **Response Time Melambat (> 3s)** | Memory pressure / Slow query MySQL | Cek log query lambat di `/var/log/mysql/slow-query.log`. Bersihkan cache dengan me-restart Redis. |
| **User Gagal Upload Berkas (> 10MB)** | Terbentur limit body Nginx | Pastikan `client_max_body_size 35M;` ada di `nginx.conf` dan reload Nginx. |
| **Socket Chat Sering Putus / Reconnecting** | Reverse proxy tidak melakukan HTTP Upgrade | Pastikan konfigurasi Nginx menyertakan `proxy_set_header Upgrade $http_upgrade;` dan `Connection "upgrade";`. |
| **User Tiba-Tiba Ter-logout Massal** | Nilai `AUTH_SECRET` berubah / restart acak | Pastikan `AUTH_SECRET` di `.env.production` bersifat statis permanen dan tidak digenerate ulang saat proses restart. |
| **Error `pool connections limit reached`** | Koneksi Prisma habis akibat lonjakan beban | Pastikan parameter `DB_CONNECTION_LIMIT=30` disetel di `.env` dan MySQL `max_connections = 300`. |

---

## 11. Cheatsheet Perintah Operasional Administrator

Simpan daftar perintah penting ini untuk pemeliharaan harian server:

### Mengelola Service Docker:
```bash
# Cek status seluruh service
docker compose -f docker-compose.production.yml ps

# Melihat log real-time aplikasi Next.js
docker compose -f docker-compose.production.yml logs -f app

# Melihat log real-time server Socket.IO
docker compose -f docker-compose.production.yml logs -f socket

# Restart aplikasi Next.js saja (misal setelah ubah config)
docker compose -f docker-compose.production.yml restart app

# Stop seluruh layanan
docker compose -f docker-compose.production.yml down
```

### Mengelola Service PM2:
```bash
# Melihat daftar proses dan penggunaan RAM/CPU
pm2 status

# Melihat log real-time
pm2 logs

# Restart tanpa downtime (Zero-Downtime Reload)
pm2 reload ecosystem.config.cjs

# Restart total proses
pm2 restart all
```

### Perintah Database & Migrasi:
```bash
# Push perubahan skema Prisma
npx prisma db push --skip-generate

# Backup database manual seketika
./scripts/backup-db.sh

# Cek kuota penyimpanan disk server
df -h
```

---

> **Kesimpulan**: Dengan mengikuti seluruh tahapan di atas, sistem **Student Apps Al-Azhar Cairo Palembang** akan ter-deploy dengan standar keamanan tinggi, arsitektur handal, pemantauan otomatis, dan kemampuan menangani lebih dari **1.500 pengguna aktif harian** secara stabil dan responsif.
