'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toWhatsAppNumber, formatWhatsAppDisplay } from '@/lib/ar-phone';
import { formatShortDate } from '@/lib/format';
import type { AdminInvitation, CreatedInvitation, InvitationStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaterialIcon } from '@/components/ui/material-icon';
import { WhatsAppIcon } from '@/components/ui/brand-icons';
import { expiryLabel } from '@/components/admin/stage';
import { cn } from '@/lib/utils';

const STATUS: Record<InvitationStatus, { label: string; className: string }> = {
  active: { label: 'Activa', className: 'bg-tertiary-fixed text-tertiary' },
  accepted: { label: 'Aceptada', className: 'bg-success-container text-on-success-container' },
  revoked: { label: 'Cancelada', className: 'bg-surface-container-high text-on-surface-variant' },
  expired: { label: 'Vencida', className: 'bg-surface-container-high text-on-surface-variant' },
};

function defaultMessage(restaurantName: string, url: string): string {
  return `Hola! Te armé la página de ${restaurantName} en quiero.menu, con la carta, las fotos y los horarios. Entrá acá con tu cuenta de Google y queda a tu nombre: ${url}`;
}

export function InvitationPanel({
  restaurantId,
  restaurantName,
  phone,
  hasOwner,
  onChanged,
}: {
  restaurantId: string;
  restaurantName: string;
  phone: string;
  hasOwner: boolean;
  onChanged?: () => void;
}) {
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [email, setEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(!hasOwner);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ invitations: AdminInvitation[] }>(
        `/admin/restaurants/${restaurantId}/invitations`,
      );
      setInvitations(data.invitations);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las invitaciones');
    }
  }, [restaurantId]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ invitations: AdminInvitation[] }>(`/admin/restaurants/${restaurantId}/invitations`)
      .then((data) => {
        if (!cancelled) setInvitations(data.invitations);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const active = invitations.find((i) => i.status === 'active');
  const whatsapp = toWhatsAppNumber(phone);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    setCopied(false);
    try {
      const trimmed = email.trim();
      const out = await api.post<CreatedInvitation>(`/admin/restaurants/${restaurantId}/invitations`, {
        email: trimmed,
        sendEmail: Boolean(trimmed) && sendEmail,
      });
      setCreated(out);
      setMessage(defaultMessage(restaurantName, out.url));
      await load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la invitación');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
    } catch {
      setError('No se pudo copiar. Seleccioná el link y copialo a mano.');
    }
  };

  const handleShare = async () => {
    if (!created) return;
    if (!navigator.share) {
      handleCopy();
      return;
    }
    try {
      await navigator.share({ text: message });
    } catch {
      return;
    }
  };

  const handleRevoke = async (id: string) => {
    setError('');
    try {
      await api.post(`/admin/invitations/${id}/revoke`, {});
      if (created?.id === id) setCreated(null);
      await load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cancelar la invitación');
    }
  };

  return (
    <section id="invitar" className="scroll-mt-24 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary-fixed text-tertiary">
          <MaterialIcon name="link" size="md" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-[family-name:var(--font-heading)] text-base font-bold text-on-surface">
            {hasOwner ? 'Invitar a otra persona' : 'Invitar al dueño'}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {hasOwner
              ? 'El local ya tiene dueño. Una invitación suma a otra persona como dueña.'
              : 'Link de un solo uso, vence en 14 días. El dueño entra con Google y el local queda a su nombre con todo lo cargado.'}
          </p>
        </div>
        {hasOwner && (
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? 'Cerrar' : 'Abrir'}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-5 space-y-4">
          {active && !created && (
            <div className="rounded-xl border border-tertiary/20 bg-tertiary-fixed/40 px-4 py-3 text-sm text-on-surface">
              <p className="font-semibold">
                Hay una invitación activa{active.email ? ` para ${active.email}` : ''} que {expiryLabel(active.expiresAt)}.
              </p>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Por seguridad el link no se puede volver a mostrar. Si lo perdiste, generá uno nuevo: el anterior deja de
                funcionar.
              </p>
            </div>
          )}

          {!created && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs font-bold text-on-surface-variant">
                  Email del dueño (opcional)
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="Si lo cargás, solo esa cuenta puede aceptar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {email.trim() && (
                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Mandarle también el link por email
                </label>
              )}
              <Button onClick={handleCreate} disabled={creating} className="w-full sm:w-auto">
                <MaterialIcon name="link" size="sm" />
                {creating ? 'Generando...' : active ? 'Generar un link nuevo' : 'Generar link de invitación'}
              </Button>
            </div>
          )}

          {created && (
            <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-on-surface">Link listo · {expiryLabel(created.expiresAt)}</p>
                <button
                  type="button"
                  onClick={() => setCreated(null)}
                  className="text-xs font-bold text-on-surface-variant hover:text-primary"
                >
                  Cerrar
                </button>
              </div>
              <p className="break-all rounded-lg bg-surface-container-lowest px-3 py-2 font-mono text-xs text-on-surface">
                {created.url}
              </p>
              {created.email && (
                <p className="text-xs text-on-surface-variant">
                  {created.emailSent
                    ? `También lo mandamos por email a ${created.email}.`
                    : `Solo ${created.email} puede aceptarla. No se mandó email.`}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="invite-message" className="text-xs font-bold text-on-surface-variant">
                  Mensaje para WhatsApp
                </Label>
                <Textarea
                  id="invite-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="bg-surface-container-lowest text-sm"
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <a
                  href={`https://wa.me/${whatsapp ?? ''}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1EBE5A]"
                >
                  <WhatsAppIcon className="size-4" />
                  {whatsapp ? `Enviar al ${formatWhatsAppDisplay(whatsapp)}` : 'Enviar por WhatsApp'}
                </a>
                <Button variant="outline" onClick={handleCopy}>
                  <MaterialIcon name={copied ? 'check_circle' : 'content_copy'} size="sm" />
                  {copied ? 'Copiado' : 'Copiar link'}
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <MaterialIcon name="share" size="sm" />
                  Otra app
                </Button>
              </div>
              {!whatsapp && (
                <p className="text-xs text-on-surface-variant">
                  El local no tiene un celular válido cargado: WhatsApp te va a pedir elegir el contacto.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{error}</div>
          )}

          {invitations.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Historial</p>
              <ul className="divide-y divide-outline-variant/20">
                {invitations.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-bold',
                            STATUS[inv.status].className,
                          )}
                        >
                          {STATUS[inv.status].label}
                        </span>
                        <span className="truncate text-sm text-on-surface">{inv.email ?? 'Link abierto'}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        Creada el {formatShortDate(inv.createdAt)}
                        {inv.status === 'active' && ` · ${expiryLabel(inv.expiresAt)}`}
                        {inv.acceptedAt &&
                          ` · aceptada el ${formatShortDate(inv.acceptedAt)}${inv.acceptedByEmail ? ` por ${inv.acceptedByEmail}` : ''}`}
                      </p>
                    </div>
                    {inv.status === 'active' && (
                      <Button size="sm" variant="ghost" onClick={() => handleRevoke(inv.id)}>
                        <MaterialIcon name="block" size="sm" />
                        Cancelar
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
