'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { browserPathParam } from '@/lib/static-route-param';
import { operateRestaurant } from '@/lib/admin-session';
import { READINESS_STEPS } from '@/lib/readiness';
import { getCategoryDef } from '@/lib/restaurant-categories';
import { formatShortDate } from '@/lib/format';
import { toWhatsAppNumber } from '@/lib/ar-phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaterialIcon } from '@/components/ui/material-icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { WhatsAppIcon } from '@/components/ui/brand-icons';
import { StageBadge, STAGE_META, expiryLabel } from '@/components/admin/stage';
import { RestaurantAvatar } from '@/components/admin/restaurant-row';
import { InvitationPanel } from '@/components/admin/invitation-panel';
import { FichaEditor } from '@/components/admin/ficha-editor';
import { ActivityFeed } from '@/components/admin/activity-feed';
import { useAdminStore } from '@/stores/admin.store';
import { cn } from '@/lib/utils';
import type { AdminRestaurantDetail, ApprovedClaim, ReadinessStep } from '@/types';

const NOT_FOUND = 'unknown';

const PLAN_LABELS: Record<string, string> = { free: 'Gratis', pro: 'Pro' };
const STATUS_LABELS: Record<string, string> = {
  active: 'activa',
  canceled: 'cancelada',
  past_due: 'pago vencido',
  expired: 'vencida',
};

function Card({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MaterialIcon name={icon} size="sm" className="text-on-surface-variant" />
        <h2 className="flex-1 font-[family-name:var(--font-heading)] text-sm font-bold text-on-surface">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-3">
      <p className="flex items-center gap-1 text-[11px] font-bold text-on-surface-variant">
        <MaterialIcon name={icon} size="xs" className="size-3.5" />
        {label}
      </p>
      <p className={cn('mt-1 font-[family-name:var(--font-heading)] text-xl font-extrabold', value === 0 ? 'text-outline' : 'text-on-surface')}>
        {value}
      </p>
    </div>
  );
}

function ClaimCard({
  claim,
  onDone,
}: {
  claim: AdminRestaurantDetail['pendingClaims'][number];
  onDone: (approved?: ApprovedClaim) => void;
}) {
  const [email, setEmail] = useState(claim.email);
  const [working, setWorking] = useState(false);
  const whatsapp = toWhatsAppNumber(claim.phone);

  const approve = async () => {
    setWorking(true);
    try {
      const out = await api.post<ApprovedClaim>(`/admin/claims/${claim.id}/approve`, { email });
      onDone(out);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo aprobar');
      setWorking(false);
    }
  };

  const reject = async () => {
    setWorking(true);
    try {
      await api.post(`/admin/claims/${claim.id}/reject`, {});
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo rechazar');
      setWorking(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div>
        <p className="font-bold text-on-surface">{claim.name}</p>
        <p className="text-xs text-on-surface-variant">
          {claim.phone} · pidió el {formatShortDate(claim.createdAt)}
        </p>
        {claim.message && <p className="mt-1 text-sm italic text-on-surface-variant">“{claim.message}”</p>}
      </div>
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#128C4B] hover:underline"
        >
          <WhatsAppIcon className="size-4" />
          Verificar por WhatsApp
        </a>
      )}
      <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="bg-surface-container-lowest" />
      <div className="flex gap-2">
        <Button size="sm" onClick={approve} disabled={working}>
          <MaterialIcon name="check" size="sm" />
          Aprobar e invitar
        </Button>
        <Button size="sm" variant="ghost" onClick={reject} disabled={working}>
          Rechazar
        </Button>
      </div>
    </div>
  );
}

function Detail() {
  const params = useSearchParams();
  const justCreated = params.get('nuevo') === '1';
  const routeParams = useParams<{ id: string }>();
  const id =
    routeParams.id && routeParams.id !== '__dynamic__'
      ? routeParams.id
      : browserPathParam('', NOT_FOUND);
  const [detail, setDetail] = useState<AdminRestaurantDetail | null>(null);
  const [error, setError] = useState('');
  const [operating, setOperating] = useState<string | null>(null);
  const [showFicha, setShowFicha] = useState(false);
  const [featScope, setFeatScope] = useState<'category' | 'home'>('category');
  const [featDays, setFeatDays] = useState('30');
  const [featuring, setFeaturing] = useState(false);
  const refreshPendingClaims = useAdminStore((s) => s.refreshPendingClaims);

  const load = useCallback(async () => {
    try {
      const data = await api.get<AdminRestaurantDetail>(`/admin/restaurants/${id}`);
      setDetail(data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el local');
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    if (id === NOT_FOUND) return;
    api
      .get<AdminRestaurantDetail>(`/admin/restaurants/${id}`)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar el local');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const operate = async (target: string, key: string) => {
    setOperating(key);
    try {
      await operateRestaurant(id, target);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo abrir el local');
      setOperating(null);
    }
  };

  const feature = async () => {
    setFeaturing(true);
    try {
      const out = await api.post<{ slotId: string; endsAt: string }>('/admin/featured', {
        restaurantId: id,
        scope: featScope,
        days: Number(featDays) || 30,
      });
      toast.success(`Destacado hasta el ${formatShortDate(out.endsAt)}`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo destacar');
    } finally {
      setFeaturing(false);
    }
  };

  if (id === NOT_FOUND || (error && !detail)) {
    return (
      <div className="space-y-4">
        <Link href="/admin/locales" className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary">
          <MaterialIcon name="arrow_back" size="sm" />
          Locales
        </Link>
        <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
          {error || 'No encontramos ese local.'}
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-surface-container-high/60" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-surface-container-high/60 lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-surface-container-high/60" />
        </div>
      </div>
    );
  }

  const r = detail.restaurant;
  const category = getCategoryDef(r.category)?.label;
  const listing = detail.readiness.listing;
  const activation = detail.readiness.activation;
  const hasOwner = detail.owner !== null;
  const progress = hasOwner ? activation : listing;
  const planLabel = detail.subscription
    ? `${PLAN_LABELS[detail.subscription.plan] ?? detail.subscription.plan} · ${STATUS_LABELS[detail.subscription.status] ?? detail.subscription.status}`
    : 'Sin suscripción';

  return (
    <div className="space-y-5">
      <Link href="/admin/locales" className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary">
        <MaterialIcon name="arrow_back" size="sm" />
        Locales
      </Link>

      {justCreated && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-success/30 bg-success-container/60 p-4">
          <MaterialIcon name="check_circle" size="md" className="text-success" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-on-surface">Ficha creada</p>
            <p className="text-sm text-on-surface-variant">
              Lo siguiente es la carta: sacale una foto y la IA carga los platos con sus precios.
            </p>
          </div>
          <Button onClick={() => operate('/onboarding?from=menu', 'ai')} disabled={operating !== null}>
            <MaterialIcon name="auto_awesome" size="sm" />
            {operating === 'ai' ? 'Abriendo...' : 'Cargar carta con IA'}
          </Button>
        </div>
      )}

      <header className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <RestaurantAvatar name={r.name} logoUrl={r.logoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold tracking-tight text-on-surface">
                {r.name}
              </h1>
              <StageBadge stage={detail.stage} />
            </div>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {[r.city, r.region, category].filter(Boolean).join(' · ') || 'Sin ciudad ni rubro'}
            </p>
            <a
              href={`/${r.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              quiero.menu/{r.slug}
              <MaterialIcon name="open_in_new" size="xs" />
            </a>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button onClick={() => operate('/dashboard', 'panel')} disabled={operating !== null} className="flex-1 sm:flex-none">
              <MaterialIcon name="edit" size="sm" />
              {operating === 'panel' ? 'Abriendo...' : 'Editar como admin'}
            </Button>
            {!hasOwner && (
              <a
                href="#invitar"
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 px-4 text-sm font-bold text-on-surface hover:border-primary/40 sm:flex-none"
              >
                <MaterialIcon name="link" size="sm" />
                Invitar
              </a>
            )}
          </div>
        </div>
        <p className="mt-4 border-t border-outline-variant/20 pt-3 text-xs text-on-surface-variant">
          {STAGE_META[detail.stage].hint}
          {detail.invitation && ` · invitación ${expiryLabel(detail.invitation.expiresAt)}`}
          {` · cargado el ${formatShortDate(r.createdAt)}`}
        </p>
      </header>

      {detail.flags.ordersWithoutOwner && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <MaterialIcon name="warning" size="md" className="shrink-0" />
          <p>
            <span className="font-bold">Este local toma pedidos y no tiene dueño.</span> Su página muestra el carrito, pero
            ningún panel recibe esos pedidos. Invitá al dueño cuanto antes.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <ProgressRing value={progress.percent} size={56} stroke={5}>
                <span className="text-xs font-extrabold text-on-surface">{progress.percent}%</span>
              </ProgressRing>
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-base font-bold text-on-surface">
                  {hasOwner
                    ? activation.percent === 100
                      ? 'Puesta en marcha completa'
                      : 'Puesta en marcha del dueño'
                    : listing.percent === 100
                      ? 'Ficha completa'
                      : 'Qué le falta a la ficha'}
                </h2>
                <p className="text-sm text-on-surface-variant">
                  {hasOwner
                    ? `El dueño lleva ${activation.done} de ${activation.total} pasos de la puesta en marcha.`
                    : listing.percent === 100
                      ? 'Lista para mostrársela al dueño.'
                      : detail.stage === 'invitado'
                        ? 'Mientras el dueño no entra, podés seguir completándola.'
                        : 'Completala antes de invitar: el dueño tiene que ver su local armado.'}
                </p>
              </div>
            </div>
            <ul className="divide-y divide-outline-variant/20">
              {READINESS_STEPS.filter((s) => hasOwner || ['menu', 'whatsapp', 'hours', 'look', 'location'].includes(s.key)).map(
                (meta) => {
                  const done = detail.readiness.checks[meta.key as ReadinessStep];
                  const canFix = !['shared', 'firstOrder'].includes(meta.key);
                  return (
                    <li key={meta.key} className="flex items-center gap-3 py-2.5">
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                          done ? 'bg-success-container text-success' : 'bg-surface-container-high text-on-surface-variant',
                        )}
                      >
                        <MaterialIcon name={done ? 'check' : meta.icon} size="xs" />
                      </span>
                      <span className={cn('flex-1 text-sm', done ? 'text-on-surface-variant' : 'font-semibold text-on-surface')}>
                        {done ? meta.doneTitle : meta.label}
                        {meta.key === 'menu' && detail.stats.products > 0 && (
                          <span className="font-normal text-on-surface-variant"> · {detail.stats.products} platos</span>
                        )}
                        {meta.key === 'hours' && detail.stats.openDays > 0 && (
                          <span className="font-normal text-on-surface-variant"> · {detail.stats.openDays} días</span>
                        )}
                      </span>
                      {!done && canFix && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={operating !== null}
                          onClick={() =>
                            meta.key === 'menu' && detail.stats.products === 0
                              ? operate('/onboarding?from=menu', meta.key)
                              : operate(meta.href, meta.key)
                          }
                        >
                          {operating === meta.key ? 'Abriendo...' : 'Completar'}
                        </Button>
                      )}
                    </li>
                  );
                },
              )}
            </ul>
          </section>

          {detail.pendingClaims.length > 0 && (
            <Card title="Reclamos pendientes" icon="mark_email_unread">
              <div className="space-y-3">
                {detail.pendingClaims.map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    onDone={(approved) => {
                      if (approved) {
                        toast.success(
                          approved.invitation.emailSent
                            ? `Invitación enviada a ${approved.claimant.email}`
                            : 'Reclamo aprobado. Mandale el link por WhatsApp desde Invitaciones.',
                        );
                      }
                      load();
                      refreshPendingClaims();
                    }}
                  />
                ))}
              </div>
            </Card>
          )}

          <InvitationPanel
            key={`${detail.stage}-${detail.invitation?.id ?? 'none'}`}
            restaurantId={r.id}
            restaurantName={r.name}
            phone={r.phone}
            hasOwner={hasOwner}
            onChanged={load}
          />

          <Card
            title="Datos de la ficha"
            icon="edit_note"
            action={
              <Button variant="ghost" size="sm" onClick={() => setShowFicha((v) => !v)}>
                {showFicha ? 'Cerrar' : 'Editar'}
              </Button>
            }
          >
            {showFicha ? (
              <FichaEditor key={r.updatedAt} restaurant={r} onSaved={load} />
            ) : (
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {[
                  ['Teléfono', r.phone || '—'],
                  ['Dirección', r.address || '—'],
                  ['Ciudad', [r.city, r.region].filter(Boolean).join(', ') || '—'],
                  ['Ubicación', r.coordinates ? 'Marcada en el mapa' : 'Sin marcar'],
                  ['Fotos', `${r.photoGallery.length}`],
                  ['Moneda', r.currency],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-outline-variant/10 py-1.5">
                    <dt className="text-on-surface-variant">{label}</dt>
                    <dd className="truncate text-right font-semibold text-on-surface">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card title="Historial" icon="history">
            <ActivityFeed entries={detail.timeline} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Últimos 30 días" icon="insights">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Visitas" value={detail.demand30d.views} icon="visibility" />
              <Stat label="WhatsApp" value={detail.demand30d.whatsapp} icon="chat" />
              <Stat label="Cómo llegar" value={detail.demand30d.maps} icon="map" />
              <Stat label="Pedidos" value={detail.stats.ordersLast30d} icon="receipt_long" />
            </div>
            <p className="mt-3 text-xs text-on-surface-variant">
              {detail.stats.ordersTotal} {detail.stats.ordersTotal === 1 ? 'pedido' : 'pedidos'} en total ·{' '}
              {detail.stats.categories} {detail.stats.categories === 1 ? 'categoría' : 'categorías'} en la carta
            </p>
          </Card>

          <Card title="Dueño y plan" icon="person">
            {detail.owner ? (
              <div className="space-y-1">
                <p className="font-semibold text-on-surface">{detail.owner.name || 'Sin nombre'}</p>
                <p className="break-all text-sm text-on-surface-variant">{detail.owner.email}</p>
                <p className={cn('text-xs font-bold', detail.owner.emailVerified ? 'text-success' : 'text-on-surface-variant')}>
                  {detail.owner.emailVerified ? 'Email verificado' : 'Email sin verificar'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Todavía no tiene dueño.</p>
            )}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2.5 text-sm">
              <span className="text-on-surface-variant">Plan</span>
              <span className="font-bold text-on-surface">{planLabel}</span>
            </div>
          </Card>

          <Card title="Destacar en el buscador" icon="star">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <select
                value={featScope}
                onChange={(e) => setFeatScope(e.target.value as 'category' | 'home')}
                className="h-10 rounded-xl border-none bg-surface-container-low px-3 text-sm outline-none"
              >
                <option value="category">Arriba de su rubro</option>
                <option value="home">En la portada de la ciudad</option>
              </select>
              <div className="flex items-center gap-1.5">
                <Input value={featDays} onChange={(e) => setFeatDays(e.target.value)} inputMode="numeric" className="h-10 w-16" />
                <span className="text-xs text-on-surface-variant">días</span>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={feature} disabled={featuring} className="mt-3 w-full">
              <MaterialIcon name="star" size="sm" />
              {featuring ? 'Asignando...' : 'Destacar'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminLocalDetailPage() {
  return (
    <Suspense fallback={null}>
      <Detail />
    </Suspense>
  );
}
