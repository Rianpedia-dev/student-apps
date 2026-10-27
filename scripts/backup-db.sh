#!/bin/bash
# ===================================================================
# Automated MySQL Database Backup Script for Student Apps
# Al-Azhar Cairo Palembang — Merujuk ke plan-update-.md Bagian 7.1
# Disarankan dijalankan via cron setiap 6 jam:
# 0 */6 * * * /opt/student-apps/scripts/backup-db.sh >> /var/log/backup.log 2>&1
# ===================================================================

set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/backups/mysql}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_NAME="${DB_CONTAINER:-sisfo_mysql}"
DB_NAME="${MYSQL_DATABASE:-sisfo_alazhar}"
DB_USER="${MYSQL_USER:-root}"
DB_PASSWORD="${DB_ROOT_PASSWORD:-rootpassword}"

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "=========================================="
echo "⏳ [$(date)] Memulai proses pencadangan database ${DB_NAME}..."

# Jika berjalan di lingkungan Docker
if command -v docker &> /dev/null && docker ps | grep -q "$CONTAINER_NAME"; then
  echo "📦 Menjalankan mysqldump melalui container Docker: $CONTAINER_NAME"
  docker exec "$CONTAINER_NAME" mysqldump \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" | gzip > "$BACKUP_FILE"
else
  # Jika berjalan langsung di VPS / native MySQL
  echo "🖥️ Menjalankan native mysqldump pada host"
  mysqldump \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" | gzip > "$BACKUP_FILE"
fi

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Pencadangan selesai: $BACKUP_FILE (Ukuran: $FILE_SIZE)"

# Rotasi backup: hapus arsip yang lebih lama dari RETENTION_DAYS
echo "🧹 Membersihkan cadangan yang lebih lama dari $RETENTION_DAYS hari..."
find "$BACKUP_DIR" -type f -name "backup_${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -exec rm -f {} +

echo "🎉 [$(date)] Selesai seluruh siklus backup."
echo "=========================================="
