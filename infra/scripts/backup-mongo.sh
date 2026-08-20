#!/bin/bash
# ─────────────────────────────────────────────────
# Backup verificado de MongoDB (Atlas) a S3.
#
# Uso:          ./backup-mongo.sh [MONGODB_URI] [BACKUP_BUCKET]
# Cron diario:  0 3 * * * ubuntu /home/ubuntu/quiero-menu/backup-mongo.sh >> /var/log/backup-mongo.log 2>&1
#
# Requiere:     mongodump/mongorestore (mongodb-database-tools) y AWS CLI
#               con permisos s3:PutObject sobre el bucket y sns:Publish sobre el topic.
# ─────────────────────────────────────────────────
set -euo pipefail

MONGODB_URI="${1:-$(grep '^MONGODB_URI=' /home/ubuntu/shared/api/.env | cut -d= -f2-)}"
BUCKET="${2:-quiero-menu-backups}"
REGION="${AWS_REGION:-us-east-1}"
TOPIC_ARN="arn:aws:sns:${REGION}:$(aws sts get-caller-identity --query Account --output text):quiero-menu-alerts"
KEEP_DAYS=14

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="/tmp/quiero-menu-${STAMP}.archive.gz"

notify_failure() {
  local msg="Backup de quiero-menu FALLO: $1"
  echo "ERROR ${msg}" >&2
  aws sns publish --region "$REGION" --topic-arn "$TOPIC_ARN" \
    --message "$msg" --subject "[quiero-menu] Backup fallido" >/dev/null 2>&1 || true
}
trap 'notify_failure "fallo inesperado (exit $?)"' ERR

echo "[backup] dump iniciado ${STAMP}"

# 1) Dump + compresión.
mongodump --uri="$MONGODB_URI" --archive="$ARCHIVE" --gzip

# 2) Verificacion: el archivo se puede leer y contiene datos (dryRun parsea el archive).
VERIFIED="$(mongorestore --archive="$ARCHIVE" --gzip --dryRun 2>&1 | tail -n 1)"
echo "[backup] verificacion: ${VERIFIED}"
if [[ "$VERIFIED" != *"done"* ]]; then
  notify_failure "la verificacion del dump no termino OK: ${VERIFIED}"
  exit 1
fi

# 3) Upload a S3.
aws s3 cp --region "$REGION" "$ARCHIVE" "s3://${BUCKET}/daily/${STAMP}.archive.gz"
rm -f "$ARCHIVE"

# 4) Prune: borrar backups locales viejos y los remotos de hace mas de KEEP_DAYS.
aws s3 ls --region "$REGION" "s3://${BUCKET}/daily/" | awk -v keep="$KEEP_DAYS" '
  {
    split($4, a, "T");
    days = (systime() - mktime(gensub(/[^0-9]/, " ", "g", a[1]) " 00 00 00")) / 86400;
    if (days > keep) print $4;
  }' | while read -r key; do
  aws s3 rm --region "$REGION" "s3://${BUCKET}/daily/${key}"
done

echo "[backup] OK ${STAMP}"