# Backup y restore de MongoDB

La base de quiero-menu corre en **MongoDB Atlas** (cluster M0 sin backups automáticos),
así que el backup es responsabilidad de la app: dump diario desde el EC2 a S3.

## Arquitectura

```
cron (diario 03:00 UTC, EC2)
  └─ infra/scripts/backup-mongo.sh
       ├─ mongodump --archive --gzip  (dump completo)
       ├─ mongorestore --dryRun       (verifica que el archive se lee y parsea OK)
       ├─ aws s3 cp → s3://quiero-menu-backups/daily/<stamp>.archive.gz
       ├─ prune: borra dumps de más de 14 días
       └─ fallo → SNS → email de la alerta (topic quiero-menu-alerts)
```

- Retención en S3: 30 días (lifecycle en `infra/terraform/backup.tf`), con versionado habilitado.
- El bucket y los permisos IAM del EC2 se crean con `terraform apply`.
- El script NO contiene credenciales: usa el instance profile del EC2 y lee `MONGODB_URI`
  del `.env` (SSM). Se puede pasar `MONGODB_URI` y `BACKUP_BUCKET` como argumentos.

## Instalación en el servidor (una vez)

```bash
# Tools de MongoDB (mongodump/mongorestore) para Ubuntu 24.04
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt-get update
sudo apt-get install -y mongodb-database-tools

# Script (vive en el repo, desplegado en /home/ubuntu/shared)
sudo cp /home/ubuntu/shared/backup-mongo.sh /usr/local/bin/backup-mongo.sh
sudo chmod +x /usr/local/bin/backup-mongo.sh

# Cron diario (03:00 UTC = 22:00 Colombia)
echo "0 3 * * * ubuntu /usr/local/bin/backup-mongo.sh >> /var/log/backup-mongo.log 2>&1" | sudo tee /etc/cron.d/quiero-menu-backup
```

> El workflow de deploy (`.github/workflows/deploy-shared.yml`) copia todo el repo a
> `/home/ubuntu/shared`; el script se actualiza solo en cada deploy.

## Prueba manual

```bash
sudo -u ubuntu /usr/local/bin/backup-mongo.sh
tail -n 5 /var/log/backup-mongo.log
aws s3 ls s3://quiero-menu-backups/daily/
```

Un backup exitoso loguea `[backup] OK <stamp>`; un fallo publica a SNS (llega al email de
`alerts_email` en terraform) y deja una línea `ERROR` en el log.

## Restore

### Prerequisitos
- Un cluster Atlas de destino (el mismo u uno nuevo) y su `MONGODB_URI`.
- `mongorestore` en la máquina desde la que se restaura.

### Procedimiento (con pérdida de datos controlada — `--drop`)

```bash
# 1) Descargar el dump más reciente
LATEST=$(aws s3 ls s3://quiero-menu-backups/daily/ | sort | tail -n 1 | awk '{print $4}')
aws s3 cp "s3://quiero-menu-backups/daily/${LATEST}" ./restore.archive.gz

# 2) Verificar antes de tocar nada
mongorestore --archive=./restore.archive.gz --gzip --dryRun

# 3) Restaurar (borra colecciones existentes y las reemplaza)
mongorestore --uri="$MONGODB_URI" --archive=./restore.archive.gz --gzip --drop

# 4) Validar: login de un usuario, revisar una orden y el menú de un restaurante.
```

### Restore en caso de desastre (cluster nuevo)

1. Crear cluster Atlas nuevo (mismo tier/región).
2. `MONGODB_URI_NUEVO="mongodb+srv://..."` y correr el paso 3 del procedimiento.
3. Actualizar el parámetro `MONGODB_URI` en SSM (`/quiero-menu/api`) y aplicar:
   ```bash
   # en el EC2
   cd /home/ubuntu/shared && ./hydrate-env.sh
   cd quiero-menu && docker compose up -d api
   ```
4. Verificar `/api/health/ready` (debe responder `{"status":"ok","db":"up"}`).

### Restore puntual (una colección)

```bash
mongorestore --uri="$MONGODB_URI" --archive=./restore.archive.gz --gzip \
  --nsInclude='quiero-menu.orders'
```

## Verificación periódica (recomendada, cada 1-3 meses)

1. Levantar un cluster Atlas de prueba gratuito.
2. Correr el procedimiento de restore completo con el último dump.
3. Hacer login y abrir un menú real.
4. Destruir el cluster de prueba.