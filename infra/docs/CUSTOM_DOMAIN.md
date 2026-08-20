# Dominio personalizado para el storefront (quiero.menu)

Ago-2026. Los usuarios **Pro** pueden servir su storefront en su propio dominio (`menu.mirestaurante.com`) en lugar de `quiero.menu/<slug>`. `quiero.menu/<slug>` sigue funcionando (coexistencia, sin redirect).

## Cómo funciona

1. El owner (Pro) setea su dominio desde el panel → `PUT /restaurants/current/custom-domain`.
   - Backend: valida formato, rechaza dominios propios (`OWN_DOMAINS`), valida suscripción Pro activa, chequea unicidad (índice único parcial en `restaurants.customDomain`) y deja `customDomainStatus.state = pending`.
2. El **worker del host compartido** (`infra/scripts/custom-domain-worker.sh`, vía cron cada 5 min) provisiona:
   - marca `provisioning` → chequea DNS → emite el cert con certbot webroot (HTTP-01) → escribe el vhost en `nginx-enabled/99-custom-<restaurantId>.conf` → recarga `shared-nginx` → marca `active`.
   - Si falla → `failed` con `failedReason` legible (se ve en el panel).
3. El storefront en el dominio custom carga el shell estático y resuelve el tenant por host: `GET /storefront/resolve?host=<dominio>` (solo responde si el estado es `active`). Todo el tráfico es same-origin (el vhost proxy `/api/` y `/socket.io/` al API pasando `Host $host`).
4. Al **bajar a free / cancelar / remover**: el backend limpia `customDomain` + `customDomainStatus` (`cancel-subscription.use-case.ts`, `handle-payment-webhook.use-case.ts`, `DELETE /restaurants/current/custom-domain`) y el worker, comparando los vhosts contra `/internal/custom-domains/active`, borra el vhost y el cert.

## Endpoints internos (worker)

Protegidos por header `x-internal-token` (debe coincidir con `INTERNAL_API_TOKEN`):

- `GET /api/v1/internal/custom-domains/pending` → `[{ restaurantId, domain, requestedAt }]`
- `GET /api/v1/internal/custom-domains/active` → `[{ restaurantId, domain }]`
- `POST /api/v1/internal/custom-domains/:restaurantId/status` body `{ state, failedReason? }`

## Configuración

### API (`api/.env` / SSM)
```env
INTERNAL_API_TOKEN=<secreto compartido con el worker>
OWN_DOMAINS=quiero.menu,www.quiero.menu
```

### Worker en el host compartido
```bash
cp infra/scripts/custom-domain-worker.sh ~/shared/scripts/
chmod +x ~/shared/scripts/custom-domain-worker.sh
crontab -e
#   QM_INTERNAL_TOKEN=<mismo secreto> \
#   */5 * * * * /home/ubuntu/shared/scripts/custom-domain-worker.sh >> /var/log/custom-domain-worker.log 2>&1
```

Env del worker: `QM_API_URL` (def `https://quiero.menu/api/v1`), `QM_SHARED_DIR` (def `~/shared`, contiene `nginx-enabled/`, `certbot/`, `static/`), `QM_TLS_EMAIL`, `QM_UPSTREAM` (def `quiero-menu-api:3000`, nombre del servicio en la red `shared-apps`), `QM_PUBLIC_IP` (opcional: IP pública del host; si está seteada, el worker valida que el dominio resuelva a ella antes de pedir el certificado).

### Nginx compartido
No hace falta tocar el `server` por defecto: cada vhost custom genera su propio `server` en puerto 80 con `location /.well-known/acme-challenge/ { root /var/www/certbot; }` (el dir `./certbot` ya está montado en el contenedor como `/var/www/certbot`) y redirige el resto a HTTPS. El `server` 443 sirve el static UI desde `/usr/share/nginx/html/quiero-menu` (`try_files $uri /quiero-menu/__dynamic__.html`) y proxy `/api/` + `/socket.io/` al API.

### DNS del cliente
El usuario apunta su dominio a nuestro servidor:
- Subdominio: `CNAME menu → quiero.menu` (o A a la IP del host).
- Raíz (apex): `A @ → <IP del host>` (los registradores no permiten CNAME en la raíz).

El cert solo se emite si el dominio ya apunta a nosotros (el challenge HTTP-01 de Let's Encrypt lo valida).

## Gotchas / seguridad

- **Host spoofing**: el endpoint `resolve` es público y solo expone el slug de un storefront activo; el admin autenticado nunca se resuelve por Host.
- **Rate limit LE** (~50 emisiones/semana/dominio): el worker es idempotente; si ya hay cert (`--keep-until-expiring`) no vuelve a emitir. Además, si el dominio **no apunta todavía a nosotros**, el worker lo deja en `pending` (lo reintenta cada ciclo) sin llamar a Let's Encrypt; solo pide el cert cuando el DNS resuelve.
- **Worker colgado**: si un worker muere a mitad de la provisión y el dominio queda en `provisioning`, el API lo devuelve como pendiente de nuevo tras 15 min (`listStaleCustomDomainProvisioning`).
- **Sanitización**: el dominio se valida con regex `[a-z0-9.-]` antes de entrar al `server_name` y al nombre de archivo del vhost (el worker usa `<restaurantId>` como nombre de archivo, nunca el dominio crudo).
- **Índice único parcial**: un dominio solo puede estar en un tenant.
- Al **bajar de plan** el dominio se limpia y el worker des-provisiona; el vhost viejo no queda sirviendo contenido de un free user.
- `Caddy` queda anotado como alternativa futura (TLS automático para cualquier dominio) si el volumen de dominios crece.

## Verificación

```bash
# Estado en el panel (o directo):
curl -s https://quiero.menu/api/v1/internal/custom-domains/pending -H "x-internal-token: $TOKEN"

# En el host:
ls ~/shared/nginx-enabled/ | grep 99-custom-
docker exec shared-nginx nginx -t && docker exec shared-nginx nginx -s reload
curl -sI https://<dominio-custom>/api/v1/health   # esperar 200
```

Relacionado: [[quiero-menu/plan-dominio-personalizado]]
