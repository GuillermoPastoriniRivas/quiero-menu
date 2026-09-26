'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { toWhatsAppNumber } from '@/lib/ar-phone';
import { formatRelativeTime } from '@/lib/format';
import { useAdminStore } from '@/stores/admin.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { WhatsAppIcon } from '@/components/ui/brand-icons';
import { cn } from '@/lib/utils';
import type { ApprovedClaim, StoreClaimListItem, StoreClaimStatus } from '@/types';

const TABS: { value: StoreClaimStatus; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'rejected', label: 'Rechazados' },
];

function samePhone(a?: string | null, b?: string | null): boolean {
  const x = toWhatsAppNumber(a);
  const y = toWhatsAppNumber(b);
  return Boolean(x && y && x === y);
}

function ApprovedResult({ approved, restaurantName }: { approved: ApprovedClaim; restaurantName: string }) {
  const [copied, setCopied] = useState(false);
  const whatsapp = toWhatsAppNumber(approved.claimant.phone);
  const message = `Hola ${approved.claimant.name.split(' ')[0]}! Ya verificamos que ${restaurantName} es tuyo. Entrá con este link y queda a tu nombre: ${approved.invitation.url}`;
  return (
    <div className="space-y-3 rounded-xl border border-success/30 bg-success-container/50 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-on-surface">
        <MaterialIcon name="check_circle" size="sm" className="text-success" />
        Aprobado. {approved.invitation.emailSent ? `Le mandamos la invitación a ${approved.claimant.email}.` : 'Mandale el link.'}
      </p>
      <p className="break-all rounded-lg bg-surface-container-lowest px-3 py-2 font-mono text-xs">{approved.invitation.url}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/${whatsapp ?? ''}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white hover:bg-[#1EBE5A]"
        >
          <WhatsAppIcon className="size-4" />
          Mandar por WhatsApp
        </a>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={async () => {
            await navigator.clipboard.writeText(approved.invitation.url).catch(() => undefined);
            setCopied(true);
          }}
        >
          <MaterialIcon name={copied ? 'check_circle' : 'content_copy'} size="sm" />
          {copied ? 'Copiado' : 'Copiar link'}
        </Button>
      </div>
    </div>
  );
}

function ClaimCard({ claim, onChanged }: { claim: StoreClaimListItem; onChanged: () => void }) {
  const [email, setEmail] = useState(claim.claimant.email);
  const [working, setWorking] = useState(false);
  const [approved, setApproved] = useState<ApprovedClaim | null>(null);
  const phonesMatch = samePhone(claim.restaurant?.phone, claim.claimant.phone);
  const claimantWhatsapp = toWhatsAppNumber(claim.claimant.phone);

  const approve = async () => {
    setWorking(true);
    try {
      const out = await api.post<ApprovedClaim>(`/admin/claims/${claim.id}/approve`, { email });
      setApproved(out);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo aprobar');
    } finally {
      setWorking(false);
    }
  };

  const reject = async () => {
    if (!window.confirm('¿Rechazar este pedido de cuenta?')) return;
    setWorking(true);
    try {
      await api.post(`/admin/claims/${claim.id}/reject`, {});
      toast.success('Reclamo rechazado');
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo rechazar');
      setWorking(false);
    }
  };

  return (
    <article className="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {claim.restaurant ? (
            <Link href={`/admin/locales/${claim.restaurant.id}`} className="font-bold text-on-surface hover:text-primary">
              {claim.restaurant.name}
            </Link>
          ) : (
            <p className="font-bold text-on-surface">Local eliminado</p>
          )}
          <p className="text-xs text-on-surface-variant">
            {claim.restaurant?.city ? `${claim.restaurant.city} · ` : ''}pedido {formatRelativeTime(claim.createdAt)}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
            phonesMatch ? 'bg-success-container text-on-success-container' : 'bg-amber-100 text-amber-900',
          )}
        >
          <MaterialIcon name={phonesMatch ? 'verified' : 'warning'} size="xs" className="size-3" />
          {phonesMatch ? 'El teléfono coincide con el del local' : 'El teléfono no coincide: verificá'}
        </span>
      </div>

      <dl className="grid gap-2 rounded-xl bg-surface-container-low p-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-on-surface-variant">Quién pide</dt>
          <dd className="font-semibold text-on-surface">{claim.claimant.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-variant">Su teléfono</dt>
          <dd className="flex items-center gap-2 font-semibold text-on-surface">
            {claim.claimant.phone}
            {claimantWhatsapp && (
              <a
                href={`https://wa.me/${claimantWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#128C4B]"
                aria-label="Escribir por WhatsApp"
              >
                <WhatsAppIcon className="size-4" />
              </a>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-variant">Teléfono publicado del local</dt>
          <dd className="font-semibold text-on-surface">{claim.restaurant?.phone || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-variant">Email</dt>
          <dd className="truncate font-semibold text-on-surface">{claim.claimant.email}</dd>
        </div>
        {claim.claimant.message && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-on-surface-variant">Mensaje</dt>
            <dd className="italic text-on-surface">“{claim.claimant.message}”</dd>
          </div>
        )}
      </dl>

      {claim.owners.length > 0 && (
        <p className="flex items-center gap-2 rounded-xl bg-error-container/40 px-3 py-2 text-sm font-semibold text-on-error-container">
          <MaterialIcon name="warning" size="sm" />
          Ya tiene dueño: {claim.owners.map((o) => o.email).join(', ')}
        </p>
      )}

      {approved && <ApprovedResult approved={approved} restaurantName={claim.restaurant?.name ?? 'tu local'} />}

      {claim.status === 'pending' && !approved && (
        <div className="space-y-3 border-t border-outline-variant/20 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor={`claim-email-${claim.id}`} className="text-xs font-bold text-on-surface-variant">
              La invitación queda atada a este email
            </Label>
            <Input id={`claim-email-${claim.id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={approve} disabled={working}>
              <MaterialIcon name="check" size="sm" />
              {working ? 'Aprobando...' : 'Aprobar y generar invitación'}
            </Button>
            <Button variant="ghost" onClick={reject} disabled={working}>
              Rechazar
            </Button>
          </div>
          <p className="text-xs text-on-surface-variant">
            Al aprobar le llega un email con el link. El local queda a su nombre cuando entra con Google o crea su
            contraseña desde ese link.
          </p>
        </div>
      )}
    </article>
  );
}

export default function AdminReclamosPage() {
  const [status, setStatus] = useState<StoreClaimStatus>('pending');
  const [claims, setClaims] = useState<StoreClaimListItem[] | null>(null);
  const [version, setVersion] = useState(0);
  const refreshPendingClaims = useAdminStore((s) => s.refreshPendingClaims);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ claims: StoreClaimListItem[] }>(`/admin/claims?status=${status}`)
      .then((data) => {
        if (!cancelled) setClaims(data.claims);
      })
      .catch(() => {
        if (!cancelled) setClaims([]);
      });
    return () => {
      cancelled = true;
    };
  }, [status, version]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface">
          Reclamos
        </h1>
        <p className="text-sm text-on-surface-variant">
          Dueños que pidieron la cuenta de su ficha. Verificá por WhatsApp comparando el teléfono y aprobá.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatus(t.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold transition-colors',
              status === t.value
                ? 'bg-on-surface text-surface'
                : 'bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/30',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {claims === null ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface-container-high/60" />
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-outline-variant/40 px-6 py-14 text-center">
          <MaterialIcon name="mark_email_read" size="xl" className="mx-auto text-outline" />
          <p className="mt-3 font-bold text-on-surface">
            {status === 'pending' ? 'No hay reclamos pendientes' : 'No hay reclamos en esta lista'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onChanged={() => {
                refreshPendingClaims();
                if (status !== 'pending') setVersion((v) => v + 1);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
