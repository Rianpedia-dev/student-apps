# 📘 Production Operations & Disaster Recovery Runbook
## Student Apps — Al-Azhar Cairo Palembang

> **Target Kapasitas**: 1.500+ Pengguna Aktif Bersamaan (Siswa, Guru, Admin)  
> **Arsitektur**: Next.js 16 (App Router) + Prisma 7 + MySQL/MariaDB 8.0 + Socket.IO + Redis 7 + Nginx

---

## 1. ⚙️ Konfigurasi Environment Produksi

Pastikan berkas `.env.production` sudah dibuat di server berdasarkan `.env.production.example`.

### Checklist Wajib Pre-Flight:
- [ ] `NODE_ENV="production"`
- [ ] `AUTH_SECRET`: String acak kriptografis minimal 64 karakter (generate dengan `openssl rand -base64 48`).
- [ ] `ENABLE_DEMO_MODE="false"`: Mematikan semua bypass akun demo di kode.
- [ ] `RATE_LIMIT_ENABLED="true"`: Mengaktifkan perlindungan sliding-window rate limit.
- [ ] `DATABASE_URL`: Mengarah ke database produksi dengan password kuat.
- [ ] `DB_CONNECTION_LIMIT=30`: Batas connection pool Prisma per instance.
- [ ] `SOCKET_CORS_ORIGIN`: Domain production (misal `https://sisfo.alazhar-palembang.sch.id`).
- [ ] `REDIS_URL`: `redis://127.0.0.1:6379` untuk distributed cache & rate limit.

---

## 2. 🚀 Panduan Deployment

### Opsi A: Deployment via Docker Compose (Rekomendasi)
```bash
# 1. Clone atau pull branch main
git pull origin main

# 2. Build dan jalankan seluruh stack
docker compose -f docker-compose.production.yml up -d --build

# 3. Jalankan migrasi schema Prisma
docker compose -f docker-compose.production.yml exec app npx prisma db push --skip-generate

# 4. Verifikasi status container
docker compose -f docker-compose.production.yml ps
```

### Opsi B: Deployment via PM2 (Windows Server / Bare Metal)
```powershell
# 1. Masuk ke direktori aplikasi
cd C:\apps\sisfo-alazhar-sd

# 2. Install dependencies & build
npm ci
npx prisma generate
npm run build

# 3. Jalankan / reload dengan PM2 (Zero Downtime)
pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs
pm2 save
```

---

## 3. 🔒 Prosedur Migrasi Password Legacy (P0 Security)

Aplikasi telah dilengkapi skrip otomatis untuk membersihkan kolom `password1` (plaintext) dan memastikan semua password tersimpan dengan hash Bcrypt (salt rounds 12).

```bash
# Jalankan skrip migrasi password
npx tsx scripts/migrate-passwords.ts
```

*Catatan: Aplikasi juga memiliki fitur "Transparent Lazy Migration" saat login, di mana setiap user legacy yang login otomatis di-upgrade ke hash Bcrypt dan kolom plaintext-nya langsung dikosongkan.*

---

## 4. 💾 Backup & Disaster Recovery

### Jadwal Backup Otomatis
Pencadangan berjalan setiap 6 jam via crontab:
```bash
0 */6 * * * /opt/student-apps/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

### Prosedur Manual Backup Database
```bash
./scripts/backup-db.sh
```

### Prosedur Restore Database (Recovery)
```bash
# 1. Ekstrak dan masukkan file sql.gz ke MySQL
gunzip < /backups/mysql/backup_sisfo_alazhar_YYYYMMDD_HHMMSS.sql.gz | mysql -u root -p sisfo_alazhar

# 2. Restart layanan Next.js
docker compose -f docker-compose.production.yml restart app
```

---

## 5. 🩺 Monitoring & Health Checks

### Endpoint Pemeriksaan
- **Health Check App**: `GET https://domain.sch.id/api/health`
  - Mengembalikan status database, latensi query, memori (RSS, Heap), uptime, dan status cache.
- **Health Check Socket**: `GET http://localhost:3001/health`
  - Mengembalikan jumlah user online aktif dan socket connections.

### Penanganan Insiden (Troubleshooting)

| Gejala | Penyebab Umum | Tindakan Cepat |
|---|---|---|
| Health check status `degraded` | Database disconnect / timeout | Periksa service MySQL: `docker logs sisfo_mysql` |
| Response time lambat (>2s) | Memory pressure / Slow queries | Cek cache hit rate dan slow log: `/var/log/mysql/slow-query.log` |
| User mengeluh tidak bisa upload | Ukuran body melebihi batas | Pastikan limit Nginx `client_max_body_size 35M;` aktif |
| Sesi logout tiba-tiba | Nilai `AUTH_SECRET` berubah | Pastikan `AUTH_SECRET` konstan dan tidak di-regenerate saat restart |
