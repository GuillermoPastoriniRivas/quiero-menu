'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { StoreClaimListItem, StoreClaimStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatDate } from '@/lib/format';

const STATUS_TABS: { value: StoreClaimStatus; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'rejected', label: 'Rechazados' },
];

export default function AdminReclamosPage() {
  const [status, setStatus] = useState<StoreClaimStatus>('pending');
  const [claims, setClaims] = useState<StoreClaimListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (s: StoreClaimStatus) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<{ claims: StoreClaimListItem[] }>(
        `/admin/claims?status=${s}`,
      );
      setClaims(data.claims);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(status);
  }, [load, status]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-on-surface mb-1">
        Reclamos de locales
      </h1>
      <p className="text-sm text-on-surface-variant mb-6">
        Dueños que piden la cuenta de un local cargado como inventario.
        Verificá por WhatsApp comparando el teléfono del pedido con el del
        local y aprobá.
      </p>

      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={status === t.value ? 'default' : 'outline'}
            onClick={() => setStatus(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {error && (
        <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <MaterialIcon name="mark_email_read" size="xl" className="mb-2" />
          <p>No hay pedidos {status === 'pending' ? 'pendientes' : status === 'approved' ? 'aprobados' : 'rechazados'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {claims.map((c) => (
            <ClaimCard
              key={c.id}
              claim={c}
              onDone={() => load(status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClaimCard({
  claim,
  onDone,
}: {
  claim: StoreClaimListItem;
  onDone: () => void;
}) {
  const [expanded, setExpanded] = useState(claim.status === 'pending');
  const [ownerName, setOwnerName] = useState(claim.claimant.name);
  const [email, setEmail] = useState(claim.claimant.email);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const approve = async () => {
    setWorking(true);
    setError('');
    try {
      await api.post(`/admin/claims/${claim.id}/approve`, { ownerName, email });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aprobar');
      setWorking(false);
    }
  };

  const reject = async () => {
    if (!window.confirm('¿Rechazar este pedido?')) return;
    setWorking(true);
    setError('');
    try {
      await api.post(`/admin/claims/${claim.id}/reject`, {});
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo rechazar');
      setWorking(false);
    }
  };

  const phonesMatch =
    claim.restaurant?.phone &&
    claim.restaurant.phone.replace(/\D/g, '') ===
      claim.claimant.phone.replace(/\D/g, '');

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/40 p-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 text-left"
      >
        <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <MaterialIcon name="storefront" size="sm" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-bold text-on-surface truncate block">
            {claim.restaurant?.name ?? 'Local eliminado'}
          </span>
          <span className="block text-xs text-on-surface-variant truncate mt-0.5">
            {claim.claimant.name} · {claim.claimant.phone} ·{' '}
            {formatDate(claim.createdAt)}
          </span>
        </span>
        {phonesMatch && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 bg-green-600/10 rounded-full px-2 py-0.5 shrink-0">
            Tel. coincide
          </span>
        )}
        <MaterialIcon
          name={expanded ? 'expand_less' : 'expand_more'}
          size="sm"
          className="text-on-surface-variant shrink-0"
        />
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-3">
          <dl className="text-sm space-y-1">
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Local</dt>
              <dd className="font-semibold text-on-surface text-right">
                {claim.restaurant ? (
                  <Link
                    href={`/admin/locales/${claim.restaurant.id}`}
                    className="text-primary hover:underline"
                  >
                    {claim.restaurant.name} ({claim.restaurant.slug})
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Tel. publicado</dt>
              <dd className="font-semibold text-on-surface">
                {claim.restaurant?.phone || '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Tel. solicitante</dt>
              <dd className="font-semibold text-on-surface">{claim.claimant.phone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Email</dt>
              <dd className="font-semibold text-on-surface truncate">{claim.claimant.email}</dd>
            </div>
            {claim.claimant.message && (
              <div className="pt-1">
                <dt className="text-on-surface-variant text-xs mb-1">Mensaje</dt>
                <dd className="text-sm text-on-surface bg-surface-container-low rounded-xl px-3 py-2">
                  {claim.claimant.message}
                </dd>
              </div>
            )}
            {claim.owners.length > 0 && (
              <div className="pt-1">
                <dt className="text-error text-xs mb-1 font-bold">
                  ⚠ Ya tiene dueño: {claim.owners.map((o) => `${o.name} (${o.email})`).join(', ')}
                </dt>
              </div>
            )}
          </dl>

          {error && (
            <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {claim.status === 'pending' && (
            <div className="rounded-2xl bg-surface-container-low p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-on-surface-variant">
                    Nombre del dueño
                  </Label>
                  <Input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-on-surface-variant">
                    Email de la cuenta
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">
                Al aprobar se crea la cuenta, se vincula como dueña y le llega
                el email para crear su contraseña.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={approve} disabled={working}>
                  <MaterialIcon name="check" size="sm" />
                  {working ? 'Aprobando...' : 'Aprobar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={reject}
                  disabled={working}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
