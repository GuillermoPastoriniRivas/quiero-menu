#!/usr/bin/env bash
# Worker de dominios personalizados (quiero.menu).
# Corre como cron en el host compartido; provisiona y des-provisiona TLS + vhosts
# de los storefronts de usuarios Pro con su propio dominio.
#
# Ciclo con la API (endpoints internos protegidos por x-internal-token):
#   GET  /internal/custom-domains/pending   -> dominios por provisionar
#   GET  /internal/custom-domains/active    -> dominios activos (para des-provisionar)
#   POST /internal/custom-domains/:id/status -> marca provisioning/active/failed
#
# Variables de entorno:
#   QM_API_URL         (def: https://quiero.menu/api/v1)
#   QM_INTERNAL_TOKEN  (requerido) — debe coincidir con INTERNAL_API_TOKEN del API
#   QM_SHARED_DIR      (def: ~/shared) — APP_DIR del host compartido
#   QM_TLS_EMAIL       (def: contact@quiero.menu)
#   QM_UPSTREAM        (def: quiero-menu-api:3000) — servicio del API en la red compartida
#   QM_PUBLIC_IP       (opcional) — IP pública del host; si está, valida que el
#                      dominio resuelva a ella antes de emitir el certificado
#
# Instalación (host compartido):
#   cp custom-domain-worker.sh ~/shared/scripts/
#   chmod +x ~/shared/scripts/custom-domain-worker.sh
#   crontab -e:
#     QM_INTERNAL_TOKEN=... */5 * * * * /home/ubuntu/shared/scripts/custom-domain-worker.sh >> /var/log/custom-domain-worker.log 2>&1
set -euo pipefail

API_URL="${QM_API_URL:-https://quiero.menu/api/v1}"
TOKEN="${QM_INTERNAL_TOKEN:?QM_INTERNAL_TOKEN requerido}"
SHARED="${QM_SHARED_DIR:-$HOME/shared}"
NGINX_ENABLED="$SHARED/nginx-enabled"
CERTBOT_WEBROOT="$SHARED/certbot"
TLS_EMAIL="${QM_TLS_EMAIL:-contact@quiero.menu}"
UPSTREAM="${QM_UPSTREAM:-quiero-menu-api:3000}"
VHOST_PREFIX="99-custom-"
LOCK="$SHARED/.custom-domain-worker.lock"

exec 9>"$LOCK"
flock -n 9 || exit 0

mkdir -p "$NGINX_ENABLED" "$CERTBOT_WEBROOT"

reload_nginx() {
  if docker exec shared-nginx nginx -t >/dev/null 2>&1; then
    docker exec shared-nginx nginx -s reload >/dev/null 2>&1 || true
  fi
}

mark_status() {
  local rid="$1" state="$2" reason="${3:-}"
  local payload
  if [ -n "$reason" ]; then
    # Escapar comillas para JSON
    local safe
    safe=$(printf '%s' "$reason" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
    payload=$(printf '{"state":"%s","failedReason":%s}' "$state" "$safe")
  else
    payload=$(printf '{"state":"%s"}' "$state")
  fi
  curl -sS -X POST "$API_URL/internal/custom-domains/$rid/status" \
    -H "x-internal-token: $TOKEN" -H 'Content-Type: application/json' \
    -d "$payload" >/dev/null 2>&1 || true
}

provision() {
  local rid="$1" domain="$2"
  local vhost="$NGINX_ENABLED/${VHOST_PREFIX}${rid}.conf"

  mark_status "$rid" provisioning

  # DNS: si el dominio todavía no apunta a nosotros, lo dejamos en pending y
  # se reintenta en el próximo ciclo (evita pegarle a Let's Encrypt antes de
  # tiempo). Si QM_PUBLIC_IP está seteado, validamos que la IP coincida.
  if [ -n "${QM_PUBLIC_IP:-}" ]; then
    if ! getent ahostsv4 "$domain" | awk '{print $1}' | grep -qx "$QM_PUBLIC_IP"; then
      echo "pendiente: $domain todavía no apunta a $QM_PUBLIC_IP"
      mark_status "$rid" pending
      return 0
    fi
  elif ! getent hosts "$domain" >/dev/null 2>&1; then
    echo "pendiente: $domain todavía no resuelve"
    mark_status "$rid" pending
    return 0
  fi

  if ! certbot certonly --webroot -w "$CERTBOT_WEBROOT" \
      --non-interactive --agree-tos --keep-until-expiring \
      -m "$TLS_EMAIL" -d "$domain" >/tmp/certbot-customdomain.log 2>&1; then
    mark_status "$rid" failed "No se pudo emitir el certificado SSL. Revisá que el dominio apunte a nuestro servidor."
    return 1
  fi

  cat > "$vhost" <<EOF
# Custom domain vhost — $domain
server {
    listen 80;
    server_name $domain;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $domain;

    ssl_certificate     /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://$UPSTREAM;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /socket.io/ {
        proxy_pass http://$UPSTREAM;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location / {
        root /usr/share/nginx/html/quiero-menu;
        try_files \$uri /quiero-menu/__dynamic__.html;
    }
}
EOF

  reload_nginx
  mark_status "$rid" active
}

# 1) Provisionar dominios pendientes
if pending=$(curl -sS "$API_URL/internal/custom-domains/pending" -H "x-internal-token: $TOKEN"); then
  echo "$pending" | python3 -c '
import json, sys
try:
    rows = json.load(sys.stdin)
except Exception:
    rows = []
for x in rows:
    print(x["restaurantId"] + "\t" + x["domain"])
' | while IFS=$'\t' read -r rid domain; do
    [ -n "$rid" ] || continue
    provision "$rid" "$domain" || true
  done
fi

# 2) Des-provisionar vhosts cuyo dominio ya no está activo (downgrade a free / remoción)
active_domains=""
if active=$(curl -sS "$API_URL/internal/custom-domains/active" -H "x-internal-token: $TOKEN"); then
  active_domains=$(echo "$active" | python3 -c 'import json,sys; print("\n".join(x["domain"] for x in json.load(sys.stdin)))')
fi
changed=0
for vhost in "$NGINX_ENABLED"/${VHOST_PREFIX}*.conf; do
  [ -e "$vhost" ] || continue
  domain=$(grep -m1 'server_name ' "$vhost" | sed -E 's/.*server_name[[:space:]]+([^;]+);.*/\1/' | tr -d '[:space:]')
  if ! printf '%s\n' "$active_domains" | grep -qx "$domain"; then
    rm -f "$vhost"
    certbot delete --cert-name "$domain" --non-interactive >/dev/null 2>&1 || true
    echo "des-provisionado: $domain"
    changed=1
  fi
done
[ "$changed" -eq 1 ] && reload_nginx
