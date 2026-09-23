'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { arPhoneToWhatsApp } from '@/lib/ar-phone';
import { formatDate } from '@/lib/format';
import type { AdminInvitation, CreatedInvitation, InvitationStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { WhatsAppIcon } from '@/components/ui/brand-icons';

const STATUS_LABEL: Record<InvitationStatus, string> = {
  active: 'Activa',
  accepted: 'Aceptada',
  revoked: 'Cancelada',
  expired: 'Vencida',
};

const STATUS_CLASS: Record<InvitationStatus, string> = {
  active: 'bg-primary/10 text-primary',
  accepted: 'bg-green-100 text-green-800',
  revoked: 'bg-surface-container-high text-on-surface-variant',
  expired: 'bg-surface-container-high text-on-surface-variant',
};

function whatsappHref(phone: string, restaurantName: string, url: string): string {
  const text = `Hola! Te armé ${restaurantName} en quiero.menu con el menú, las fotos y los horarios. Entrá con tu cuenta de Google y queda a tu nombre: ${url}`;
  const digits = arPhoneToWhatsApp(phone) ?? phone.replace(/\D/g, '');
  const target = digits.length >= 10 ? digits : '';
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}

export function InvitationPanel({
  restaurantId,
  restaurantName,
  phone,
}: {
  restaurantId: string;
  restaurantName: string;
  phone: string;
}) {
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [email, setEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

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
    load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    setCopied(false);
    try {
      const trimmed = email.trim();
      const out = await api.post<CreatedInvitation>(
        `/admin/restaurants/${restaurantId}/invitations`,
        { email: trimmed, sendEmail: Boolean(trimmed) && sendEmail },
      );
      setCreated(out);
      await load();
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

  const handleRevoke = async (id: string) => {
    setError('');
    try {
      await api.post(`/admin/invitations/${id}/revoke`, {});
      if (created?.id === id) setCreated(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cancelar la invitación');
    }
  };

  const hasActive = invitations.some((i) => i.status === 'active');

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/40 p-6 mb-4">
      <div className="flex items-center gap-2">
        <MaterialIcon name="link" size="sm" className="text-primary" />
        <h2 className="font-bold text-on-surface">Invitar al dueño</h2>
      </div>
      <p className="text-sm text-on-surface-variant mt-1">
        Genera un link de un solo uso que vence en 14 días. El dueño entra con Google y el local
        queda a su nombre, con todo lo que ya cargaste.
        {hasActive && ' Generar uno nuevo cancela el anterior.'}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email" className="text-xs font-bold text-on-surface-variant ml-1">
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
        <Button onClick={handleCreate} disabled={creating}>
          <MaterialIcon name="link" size="sm" />
          {creating ? 'Generando...' : hasActive ? 'Generar link nuevo' : 'Generar link'}
        </Button>
      </div>
      {email.trim() && (
        <label className="mt-2 flex items-center gap-2 text-sm text-on-surface-variant ml-1">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
          />
          Mandarle también el link por email
        </label>
      )}

      {error && (
        <div className="mt-4 bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {created && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-bold text-on-surface-variant">
            Link listo. Copialo ahora: por seguridad no se puede volver a mostrar.
          </p>
          <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-on-surface">
            {created.url}
          </p>
          {created.email && (
            <p className="mt-2 text-xs text-on-surface-variant">
              {created.emailSent
                ? `Enviado por email a ${created.email}.`
                : `Atado a ${created.email}. No se mandó email.`}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <MaterialIcon name={copied ? 'check_circle' : 'content_copy'} size="sm" />
              {copied ? 'Copiado' : 'Copiar link'}
            </Button>
            <a
              href={whatsappHref(phone, restaurantName, created.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:bg-[#1EBE5A] transition-colors"
            >
              <WhatsAppIcon className="size-4" />
              Enviar por WhatsApp
            </a>
          </div>
          {!arPhoneToWhatsApp(phone) && (
            <p className="mt-2 text-xs text-on-surface-variant">
              El local no tiene un celular válido cargado: WhatsApp te va a pedir elegir el contacto.
            </p>
          )}
        </div>
      )}

      {invitations.length > 0 && (
        <ul className="mt-5 divide-y divide-outline-variant/30">
          {invitations.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_CLASS[inv.status]}`}
                  >
                    {STATUS_LABEL[inv.status]}
                  </span>
                  <span className="text-sm text-on-surface truncate">
                    {inv.email ?? 'Link abierto'}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Creada {formatDate(inv.createdAt)}
                  {inv.status === 'active' && ` · vence ${formatDate(inv.expiresAt)}`}
                  {inv.acceptedAt &&
                    ` · aceptada ${formatDate(inv.acceptedAt)}${inv.acceptedByEmail ? ` por ${inv.acceptedByEmail}` : ''}`}
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
      )}
    </div>
  );
}
