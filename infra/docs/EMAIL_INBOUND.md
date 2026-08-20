# Email entrante en quiero.menu (SES inbound)

Ago-2026. quiero.menu solo sabía enviar (SES + DKIM/SPF/DMARC + MAIL FROM en `email.tf`); los mails a `contact@quiero.menu` rebotaban porque no había MX de entrada. Ahora hay MX → S3 + SNS.

## Cómo funciona (`infra/terraform/email-inbound.tf`)

1. **MX** de `quiero.menu` → `10 inbound-smtp.us-east-1.amazonaws.com` (reemplaza la ausencia total de MX; el MAIL FROM de `mail.quiero.menu` no se toca).
2. Se **reusa el receipt rule set activo** de la cuenta (`data.aws_ses_active_receipt_rule_set`) y se agrega la regla `quiero-menu-inbound` para los destinatarios de `var.inbound_mail_recipients` (default `contact@quiero.menu`).
   - **Solo puede haber un rule set activo por cuenta y región**: NO crear otro activo, se rompe el inbound de otros proyectos de la cuenta.
3. La regla hace dos cosas:
   - **S3** → bucket `quiero-menu-inbound-mail`, prefijo `inbound/`, retención 30 días. Copia fiel con adjuntos.
   - **SNS** → topic `quiero-menu-inbound-mail` con suscripción email a `var.inbound_mail_forward_to`.

Requisitos que si faltan hacen rebotar el mail sin error visible: la **bucket policy** que deja a `ses.amazonaws.com` escribir (con `aws:Referer = account_id`) y la **topic policy** que lo deja publicar.

## Por qué no un Lambda

La cuenta AWS tiene bloqueada la creación de funciones Lambda (`CreateFunction` → `AccessDeniedException`). El mail llega al buzón envuelto en la notificación SNS (legible, truncado arriba de ~150 KB); para el original está S3.

## Agregar una casilla

Sumarla a `inbound_mail_recipients` en `terraform.tfvars` y aplicar. El destino se cambia en `inbound_mail_forward_to`.

**Cada destinatario nuevo tiene que confirmar la suscripción SNS** desde su buzón (AWS manda un link). Hasta que no se toca, el mail llega a S3 pero no al buzón.

## Verificar que funciona

```
aws ses describe-active-receipt-rule-set --region us-east-1
aws sns list-subscriptions --region us-east-1   # SubscriptionArn == PendingConfirmation ⇒ falta confirmar
aws s3 ls s3://quiero-menu-inbound-mail/inbound/  # el mail crudo
```

Relacionado: [[quiero-menu/plan-nivel-produccion]], [[asis/correo-entrante]]