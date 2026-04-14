# Quiero.Menu - Guia de Deploy

Guia paso a paso para deployar quiero.menu en AWS desde cero.

**Arquitectura:** EC2 (t3.small) + Docker Compose + Nginx + Let's Encrypt + MongoDB Atlas + SES + S3/CloudFront

**Costo estimado:** ~$15-20/mes

---

## Prerequisitos

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5 instalado
- [AWS CLI](https://aws.amazon.com/cli/) instalado
- Dominio `quiero.menu` comprado (ya lo tenemos)
- Cuenta de MongoDB Atlas con cluster configurado

### Configurar credenciales AWS

Si nunca configuraste AWS CLI en esta maquina:

```bash
aws configure
# AWS Access Key ID: tu-access-key
# AWS Secret Access Key: tu-secret-key
# Default region name: us-east-1
# Default output format: json
```

Verificar que funciona:
```bash
aws sts get-caller-identity
```

Debe mostrar tu Account ID y ARN. Si falla, las credenciales estan mal.

> Las credenciales se guardan en `~/.aws/credentials`. Si ya tenes un profile de otro proyecto (como asis.chat), ya deberia funcionar.

---

## Paso 1: Crear SSH Key Pair en AWS

```bash
aws ec2 create-key-pair \
  --key-name quiero-menu-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/quiero-menu-key.pem

chmod 400 ~/.ssh/quiero-menu-key.pem
```

---

## Paso 2: Configurar Terraform

```bash
cd quiero-menu/infra/terraform

# Crear archivo de variables
cp terraform.tfvars.example terraform.tfvars
```

Editar `terraform.tfvars` con tus valores:
```hcl
aws_region       = "us-east-1"
instance_type    = "t3.small"
key_name         = "quiero-menu-key"
allowed_ssh_cidr = "TU_IP/32"    # o "0.0.0.0/0" para acceso global
app_name         = "quiero-menu"
domain           = "quiero.menu"
```

---

## Paso 3: Aplicar Terraform (en 2 partes)

Terraform se aplica en **2 partes** porque SES necesita verificar el dominio via DNS, pero para eso los nameservers ya tienen que apuntar a Route 53. Si corres todo de una, SES se queda colgado esperando la verificacion indefinidamente.

### Parte A: Crear la infra (sin esperar SES)

```bash
terraform init
terraform plan
terraform apply   # escribir "yes"
```

Si SES verification se queda colgado ("Still creating..."), cancela con **Ctrl+C**. Los recursos ya creados (EC2, Route 53, S3, ECR, etc.) se quedan, no se pierden.

**Anotar los outputs** (los que ya se crearon):
```bash
terraform output route53_nameservers
```

### Parte B: Delegar DNS y completar Terraform

**1.** Ir al registrador donde compraste `quiero.menu` y cambiar los nameservers a los 4 que te dio Terraform:

```
ns-XXXX.awsdns-XX.org
ns-XXXX.awsdns-XX.co.uk
ns-XXXX.awsdns-XX.com
ns-XXXX.awsdns-XX.net
```

**2.** Esperar propagacion DNS (generalmente 5-30 min, puede tardar hasta 48hs):

```bash
dig quiero.menu NS
# Cuando devuelva los nameservers de AWS, estas listo
```

**3.** Volver a correr Terraform para que SES verifique el dominio:

```bash
terraform apply
```

Ahora SES va a encontrar los DNS records y la verificacion va a pasar.

**Anotar todos los outputs:**
```bash
terraform output
```

Te va a dar:
- `public_ip` - IP del servidor
- `route53_nameservers` - Nameservers (ya los configuraste)
- `cloudfront_domain` - Dominio del CDN para imagenes
- `ecr_api_url` / `ecr_ui_url` - URLs de los repos Docker privados
- `ssh_command` - Comando para conectarte por SSH

---

## Paso 4: Verificar DNS

Confirmar que todo resuelve correctamente:

```bash
# Nameservers delegados
dig quiero.menu NS

# A record apunta al EC2
dig quiero.menu A
# Debe devolver la IP del output public_ip

# SES verificado
aws ses get-identity-verification-attributes \
  --identities quiero.menu --region us-east-1
# Debe mostrar "VerificationStatus": "Success"
```

---

## Paso 5: Verificar SES (salir de sandbox)

SES empieza en modo sandbox (solo puede enviar a emails verificados). Para produccion:

1. Ir a AWS Console > SES > Account dashboard
2. Click "Request production access"
3. Completar el formulario explicando el uso (transactional emails para SaaS)
4. AWS suele aprobar en 24hs

Mientras tanto, verificar que el dominio se verifico:
```bash
aws ses get-identity-verification-attributes \
  --identities quiero.menu \
  --region us-east-1
```

Debe mostrar `"VerificationStatus": "Success"`.

---

## Paso 6: Configurar env de produccion en EC2

```bash
# Conectarse al servidor
ssh -i ~/.ssh/quiero-menu-key.pem ubuntu@<PUBLIC_IP>

cd /home/ubuntu/quiero-menu

# Crear directorio para API env
mkdir -p api

# Crear archivo de env
nano api/.env
```

Copiar el contenido de `api/.env.production.example` y completar con valores reales:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
FRONTEND_URL=https://quiero.menu
ALLOWED_ORIGINS=https://quiero.menu,https://www.quiero.menu
OPENAI_API_KEY=sk-proj-...
AWS_SES_REGION=us-east-1
SES_FROM_EMAIL=no-reply@quiero.menu
SES_REPLY_TO_EMAIL=contact@quiero.menu
S3_BUCKET=quiero-menu-images
S3_REGION=us-east-1
CLOUDFRONT_DOMAIN=<output de terraform>
```

Generar secrets seguros:
```bash
# Generar JWT secrets
openssl rand -hex 32  # para JWT_SECRET
openssl rand -hex 32  # para JWT_REFRESH_SECRET
```

---

## Paso 7: Obtener certificado SSL

**Primer certificado** (antes de levantar los containers, puerto 80 debe estar libre):

```bash
# En el EC2
sudo certbot certonly --standalone \
  -d quiero.menu \
  -d www.quiero.menu \
  --agree-tos \
  --email contact@quiero.menu
```

**Renovacion automatica** (despues de que los containers estan corriendo, usa webroot):

Crear el volumen y configurar certbot para usar webroot en las renovaciones:
```bash
# Crear directorio para el webroot challenge
sudo mkdir -p /var/lib/docker/volumes/quiero-menu_certbot-webroot/_data

# Configurar certbot para renovar via webroot (no standalone)
# Editar /etc/letsencrypt/renewal/quiero.menu.conf y cambiar:
#   authenticator = standalone  →  authenticator = webroot
#   webroot_path = /var/lib/docker/volumes/quiero-menu_certbot-webroot/_data

# Agregar hook para recargar nginx despues de renovar
sudo bash -c 'cat > /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh << "HOOK"
#!/bin/bash
docker exec quiero-menu-nginx nginx -s reload
HOOK'
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

Verificar que el timer de renovacion esta activo:
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## Paso 8: Primer deploy manual (via ECR)

**Desde tu maquina local**, buildear y pushear las imagenes a ECR:

```bash
cd quiero-menu

# Obtener tu Account ID de AWS
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"

# Login a ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Buildear las imagenes
docker build -t $ECR_REGISTRY/quiero-menu/api:latest ./api
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://quiero.menu/api \
  -t $ECR_REGISTRY/quiero-menu/ui:latest ./ui

# Push a ECR (solo sube las capas nuevas)
docker push $ECR_REGISTRY/quiero-menu/api:latest
docker push $ECR_REGISTRY/quiero-menu/ui:latest
```

**Copiar configs al servidor** (solo la primera vez):

```bash
scp -i ~/.ssh/quiero-menu-key.pem \
  docker-compose.yml \
  docker-compose.cloudwatch.yml \
  ubuntu@3.214.139.204:/home/ubuntu/quiero-menu/

scp -i ~/.ssh/quiero-menu-key.pem -r \
  infra/nginx/ \
  ubuntu@3.214.139.204:/home/ubuntu/quiero-menu/infra/
```

**En el servidor**, pull y levantar:

```bash
ssh -i ~/.ssh/quiero-menu-key.pem ubuntu@<PUBLIC_IP>
cd /home/ubuntu/quiero-menu

# Obtener Account ID y login a ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Pull imagenes
docker pull $ECR_REGISTRY/quiero-menu/api:latest
docker pull $ECR_REGISTRY/quiero-menu/ui:latest

# Tag para docker-compose
docker tag $ECR_REGISTRY/quiero-menu/api:latest quiero-menu-api:latest
docker tag $ECR_REGISTRY/quiero-menu/ui:latest quiero-menu-ui:latest

# Levantar todo
docker compose up -d

# Verificar
docker compose ps
docker compose logs -f
```

> **Nota sobre el orden SSL/deploy:** El paso 7 (certbot standalone) necesita que el puerto 80 este libre. Asegurate de obtener el certificado SSL ANTES de hacer `docker compose up`. Si ya levantaste los containers, para nginx primero: `docker compose stop nginx`, ejecuta certbot, y despues `docker compose start nginx`.

### Rollback a una version anterior

Si algo sale mal despues de un deploy:

```bash
# Ver imagenes disponibles en ECR
aws ecr list-images --repository-name quiero-menu/api --region us-east-1

# Pull la version anterior usando su tag (git SHA)
docker pull $ECR_REGISTRY/quiero-menu/api:<sha-anterior>
docker tag $ECR_REGISTRY/quiero-menu/api:<sha-anterior> quiero-menu-api:latest

docker pull $ECR_REGISTRY/quiero-menu/ui:<sha-anterior>
docker tag $ECR_REGISTRY/quiero-menu/ui:<sha-anterior> quiero-menu-ui:latest

# Reiniciar
docker compose up -d --no-deps api
docker compose up -d --no-deps ui
```

---

## Paso 9: Configurar GitHub Actions (deploys automaticos)

En tu repo de GitHub, ir a Settings > Secrets and variables > Actions.

Agregar estos secrets:

| Secret | Valor |
|--------|-------|
| `QM_EC2_HOST` | IP publica del EC2 (output de terraform) |
| `QM_EC2_SSH_KEY` | Contenido completo de `~/.ssh/quiero-menu-key.pem` |
| `AWS_ACCOUNT_ID` | Tu AWS Account ID (12 digitos, ej: `123456789012`) |
| `AWS_ACCESS_KEY_ID` | Access key de un IAM user con permisos de ECR push |
| `AWS_SECRET_ACCESS_KEY` | Secret key del mismo IAM user |
| `NEXT_PUBLIC_API_URL` | `https://quiero.menu/api` |

> Podes obtener tu Account ID con: `aws sts get-caller-identity --query Account --output text`

**IMPORTANTE:** El valor de `NEXT_PUBLIC_API_URL` debe ser `https://quiero.menu/api` (con `/api` al final). Sin eso, el frontend no puede comunicarse con el backend.

A partir de ahora, cada push a `main` que modifique archivos en `quiero-menu/` triggerea el deploy automatico con **zero downtime**.

---

## Paso 10: Verificar todo

### Checklist post-deploy:

- [ ] `https://quiero.menu` carga la landing page
- [ ] `https://quiero.menu/api/health` responde OK
- [ ] El registro de usuarios funciona
- [ ] El login funciona
- [ ] WebSocket conecta (kitchen display actualiza en real-time)
- [ ] SES envia emails (verificar en AWS Console > SES > Sending statistics)
- [ ] Las imagenes se suben a S3 y se sirven por CloudFront
- [ ] El deploy automatico funciona (hacer un cambio pequeno, push, verificar)

### Comandos utiles en el servidor:

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio especifico
docker compose logs -f api

# Reiniciar un servicio
docker compose restart api

# Ver estado de los contenedores
docker compose ps

# Renovar SSL manualmente
sudo certbot renew

# Ver espacio en disco
df -h
```

---

## Emails configurados

Con la infra de SES, el sistema puede enviar desde:

- `no-reply@quiero.menu` - Emails transaccionales (verificacion, password reset, notificaciones)
- `contact@quiero.menu` - Email de contacto/soporte (reply-to en emails transaccionales)

Los emails tienen:
- **DKIM** - Firma digital para autenticacion
- **SPF** - Autoriza a SES a enviar en nombre del dominio
- **DMARC** - Politica de quarantine para emails que fallen verificacion
- **Custom MAIL FROM** - `mail.quiero.menu` como dominio de envio

---

## Estructura de archivos en el servidor

```
/home/ubuntu/quiero-menu/
├── api/
│   └── .env                          # Variables de entorno (no en git)
├── infra/
│   └── nginx/
│       └── default.conf              # Config de Nginx
├── docker-compose.yml                # Orquestacion de servicios
├── docker-compose.cloudwatch.yml     # Override para CloudWatch logs
└── (tarballs temporales durante deploy)
```

---

## Troubleshooting

### El sitio no carga
```bash
# Verificar que los contenedores estan corriendo
docker compose ps

# Ver logs para errores
docker compose logs --tail=50
```

### SSL no funciona
```bash
# Verificar que el certificado existe
sudo ls /etc/letsencrypt/live/quiero.menu/

# Si no existe, generarlo de nuevo (parar nginx primero)
docker compose stop nginx
sudo certbot certonly --standalone -d quiero.menu -d www.quiero.menu
docker compose start nginx
```

### Emails no llegan
```bash
# Verificar que SES esta verificado
aws ses get-identity-verification-attributes \
  --identities quiero.menu --region us-east-1

# Verificar que no estamos en sandbox
aws ses get-account --region us-east-1
# Si SendingEnabled es false, hay que pedir production access
```

### La base de datos no conecta
```bash
# Verificar la URI de MongoDB desde el servidor
docker compose exec api node -e "
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('OK'))
    .catch(e => console.error(e.message));
"
```

### CloudFront / imagenes no cargan
```bash
# Verificar que S3 tiene los archivos
aws s3 ls s3://quiero-menu-images/ --region us-east-1

# Verificar que CloudFront esta distribuido
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='quiero-menu image CDN'].{Id:Id,Status:Status,Domain:DomainName}"
```
