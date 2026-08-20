# Changelog

Todas las fechas en UTC.

## [Unreleased]

### Added
- Cupones de descuento: porcentaje, monto fijo y envío gratis, con compra mínima opcional y vencimiento; gestión en el panel (`/coupons`) y aplicación en el storefront con validación en vivo.
- Descuento y cupón aplicado quedan registrados en cada pedido (visible en comanda, tracking y WhatsApp).
- Clientes (mini-CRM): lista derivada de pedidos por teléfono con pedidos, gastado y último pedido; historial por cliente (`/customers`).
- "Repetir pedido" en el storefront: el cliente vuelve a su último pedido en un toque (guardado local por local).
- Análisis de ventas (`/analytics`): ingresos, pedidos, ticket promedio, conversión vistas→pedidos, cancelados, ventas por día/hora, top productos y estados; rangos de 7/30 días.
- Tracking de vistas del menú por local (contador diario) para medir conversión.
- Indicador de comprobante de pago en la comanda de pedidos (cargado / sin comprobante / paga al retirar).
- Tests unitarios de API (31) con gates de lint/tests en CI (jobs `lint` y `tests` antes de deploy).
- Verificación de email: página `/verify-email` en la UI y endpoint `POST /auth/resend-verification` (autenticado).
- Logout con revocación de refresh token (`POST /auth/logout`).
- Health checks: `/api/v1/health` (liveness) y `/api/v1/health/ready` (readiness con ping a MongoDB).
- Alarmas CloudWatch: métricas de API, nginx 4xx/5xx y EC2, notificadas por SNS a `alerts_email`.
- Error tracking con Sentry en API y UI (captura de 5xx y excepciones no manejadas).
- Backup de MongoDB a S3 con verificación de restore y runbook (`infra/docs/BACKUP_RESTORE.md`).
- Swagger/OpenAPI en `/api/docs` con auth JWT.
- Auditoría de eventos sensibles (login, signup, logout, verify, resend, password reset, checkout, cancel).
- Baja de cuenta y export de datos ARCO: `GET /account/export` y `DELETE /account`.
- Logging estructurado con `LOG_LEVEL` (JSON lines en producción).
- Email entrante para `contact@` (SES inbound → S3 + SNS).
- Página 404 custom y `offline.html` con fallback del service worker.
- Rate limits estrictos en endpoints de auth (login 10/min, signup 5/min, etc.).
- Dependabot y protección de la rama `main` (reviews + checks `lint`/`tests`).
- Analytics cookieless en la landing (GoatCounter, activable por env).
- Versionado de API: `/api/v1`.
- LICENSE MIT, CHANGELOG y página pública `/status`.
- Retry con backoff en envío de emails por SES.

### Changed
- `POST /storefront/:slug/orders` acepta `couponCode` y devuelve el pedido con descuento.
- El total del pedido se calcula como subtotal + envío − descuento (envío gratis anula el costo de envío).
- `POST /auth/resend-verification` requiere sesión autenticada.
- La URL base de la API en la UI apunta a `/api/v1`.

### Fixed
- Errores de lint pre-existentes en páginas de auth de la UI.
- Redacción de datos sensibles en listado de órdenes (`redactedCount`).
- `health/ready` devolvía 503 cuando la base de datos estaba caída.