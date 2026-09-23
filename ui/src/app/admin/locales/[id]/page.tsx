'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { browserPathParam } from '@/lib/static-route-param';
import { backupSessionForImpersonation } from '@/lib/admin-session';
import type { AdminRestaurantDetail, LoginResponse } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatDate } from '@/lib/format';
import { RESTAURANT_CATEGORIES } from '@/lib/restaurant-categories';
import { InvitationPanel } from '@/components/admin/invitation-panel';

const NOT_FOUND_FALLBACK = 'unknown';

type GalleryImage = { url: string; source: 's3' | 'external'; alt?: string };

/** Serializa la galería al formato editable (s3:URL y `URL | alt` por línea). */
function galleryToText(images: GalleryImage[]): string {
  return images
    .map((img) => {
      const prefix = img.source === 's3' ? 's3:' : '';
      return img.alt ? `${prefix}${img.url} | ${img.alt}` : `${prefix}${img.url}`;
    })
    .join('\n');
}

/**
 * Galería lista para el PATCH, o undefined si la entrada no es parseable
 * (mejor no tocar el campo que mandar basura al PATCH).
 */
function parseGallery(text: string): GalleryImage[] | undefined {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const images: GalleryImage[] = [];
  for (const line of lines) {
    const source = line.toLowerCase().startsWith('s3:') ? 's3' : 'external';
    const [urlPart, ...altParts] = line
      .replace(/^s3:/i, '')
      .split('|')
      .map((p) => p.trim());
    if (!urlPart) return undefined;
    try {
      new URL(urlPart);
    } catch {
      return undefined;
    }
    const alt = altParts.join(' | ').trim();
    images.push({ url: urlPart, source: source as GalleryImage['source'], ...(alt ? { alt: alt.slice(0, 120) } : {}) });
  }
  return images;
}


export default function AdminLocalDetailPage() {
  const id = browserPathParam('', NOT_FOUND_FALLBACK);
  const router = useRouter();
  const [detail, setDetail] = useState<AdminRestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [operating, setOperating] = useState(false);
  const [featScope, setFeatScope] = useState<'category' | 'home'>('category');
  const [featDays, setFeatDays] = useState('30');
  const [featuring, setFeaturing] = useState(false);
  const [featMsg, setFeatMsg] = useState('');
  // Edición de ficha (herramienta de carga y corrección del inventario).
  const [ficha, setFicha] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    region: '',
    country: '',
    category: '',
    phone: '',
    lat: '',
    lng: '',
    gallery: '',
  });
  const [fichaSaving, setFichaSaving] = useState(false);
  const [fichaMsg, setFichaMsg] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const load = useCallback(async () => {
    if (!id || id === NOT_FOUND_FALLBACK) {
      setError('ID de local inválido');
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<AdminRestaurantDetail>(
        `/admin/restaurants/${id}`,
      );
      setDetail(data);
      setFicha({
        name: data.restaurant.name ?? '',
        description: data.restaurant.description ?? '',
        address: data.restaurant.address ?? '',
        city: data.restaurant.city ?? '',
        region: (data.restaurant as { region?: string }).region ?? '',
        country: data.restaurant.country ?? '',
        category: (data.restaurant as { category?: string }).category ?? '',
        phone: data.restaurant.phone ?? '',
        lat: data.restaurant.coordinates?.lat != null
          ? String(data.restaurant.coordinates.lat)
          : '',
        lng: data.restaurant.coordinates?.lng != null
          ? String(data.restaurant.coordinates.lng)
          : '',
        gallery: galleryToText(
          (data.restaurant as { photoGallery?: GalleryImage[] }).photoGallery ??
            [],
        ),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el local');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOperate = async () => {
    if (!detail) return;
    setOperating(true);
    try {
      const session = await api.post<LoginResponse>(
        `/admin/restaurants/${detail.restaurant.id}/operate`,
        {},
      );
      backupSessionForImpersonation();
      api.setTokens(session.accessToken, session.refreshToken);
      useAuthStore.getState().setUser(session.user);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir el local');
      setOperating(false);
    }
  };

  const handleSaveFicha = async () => {
    if (!detail) return;
    setFichaSaving(true);
    setFichaMsg('');
    try {
      const patch: Record<string, unknown> = {};
      if (ficha.name && ficha.name !== detail.restaurant.name) patch.name = ficha.name;
      if (ficha.description !== (detail.restaurant.description ?? '')) patch.description = ficha.description;
      if (ficha.address !== (detail.restaurant.address ?? '')) patch.address = ficha.address;
      if (ficha.city !== (detail.restaurant.city ?? '')) patch.city = ficha.city;
      if (ficha.region !== ((detail.restaurant as { region?: string }).region ?? '')) patch.region = ficha.region;
      if (ficha.country !== (detail.restaurant.country ?? '')) patch.country = ficha.country;
      if (ficha.category !== ((detail.restaurant as { category?: string }).category ?? '')) patch.category = ficha.category;
      if (ficha.phone !== (detail.restaurant.phone ?? '')) patch.phone = ficha.phone;
      const gallery = parseGallery(ficha.gallery);
      if (gallery === undefined) {
        setFichaMsg(
          'La galería tiene una línea inválida (URL mal formada): no se guardó',
        );
        setFichaSaving(false);
        return;
      }
      if (
        gallery !== undefined &&
        JSON.stringify(gallery) !==
          JSON.stringify(
            (detail.restaurant as { photoGallery?: GalleryImage[] }).photoGallery ??
              [],
          )
      ) {
        patch.photoGallery = gallery;
      }
      const nextCoords = parseCoords(ficha.lat, ficha.lng);
      if (
        nextCoords !== undefined &&
        JSON.stringify(nextCoords) !== JSON.stringify(detail.restaurant.coordinates ?? null)
      ) {
        patch.coordinates = nextCoords;
      }
      if (Object.keys(patch).length === 0) {
        setFichaMsg('Sin cambios que guardar');
        return;
      }
      await api.patch(`/admin/restaurants/${detail.restaurant.id}`, patch);
      setFichaMsg('Ficha actualizada: los slugs geo se recalculan la totalidad');
      await load();
    } catch (e) {
      setFichaMsg(e instanceof Error ? e.message : 'No se pudo actualizar');
    } finally {
      setFichaSaving(false);
    }
  };

  const handleGeocode = async () => {
    const q = [ficha.address, ficha.city, ficha.region, ficha.country]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');
    if (!q) {
      setFichaMsg('Cargá la dirección y ciudad para buscar coordenadas');
      return;
    }
    setGeocoding(true);
    setFichaMsg('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } },
      );
      const results = (await res.json()) as { lat: string; lon: string }[];
      if (!results.length) {
        setFichaMsg('No se encontró la dirección; probá completarla mejor o usá tu ubicación');
        return;
      }
      setFicha({ ...ficha, lat: results[0].lat, lng: results[0].lon });
      setFichaMsg('Coordenadas encontradas: guardá la ficha para aplicarlas');
    } catch {
      setFichaMsg('No se pudo contactar el geocodificador');
    } finally {
      setGeocoding(false);
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      setFichaMsg('El navegador no soporta geolocalización');
      return;
    }
    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setFicha((f) => ({
          ...f,
          lat: String(p.coords.latitude),
          lng: String(p.coords.longitude),
        }));
        setGeocoding(false);
        setFichaMsg('Coordenadas tomadas de tu ubicación: guardá la ficha');
      },
      () => {
        setGeocoding(false);
        setFichaMsg('No se pudo usar tu ubicación');
      },
      { timeout: 10_000 },
    );
  };

  const handleFeature = async () => {
    if (!detail) return;
    setFeaturing(true);
    setFeatMsg('');
    try {
      const out = await api.post<{ slotId: string; endsAt: string }>(
        '/admin/featured',
        {
          restaurantId: detail.restaurant.id,
          scope: featScope,
          days: Number(featDays) || 30,
        },
      );
      setFeatMsg(`Destacado hasta el ${formatDate(out.endsAt)}`);
    } catch (e) {
      setFeatMsg(e instanceof Error ? e.message : 'No se pudo destacar');
    } finally {
      setFeaturing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
        {error}
      </div>
    );
  }

  if (!detail) return null;

  const r = detail.restaurant;
  const s = detail.subscription;

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/locales"
        className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-4"
      >
        <MaterialIcon name="arrow_back" size="sm" />
        Locales
      </Link>

      <div className="bg-white rounded-2xl border border-outline-variant/40 p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-on-surface truncate">{r.name}</h1>
              <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant bg-surface-container-high rounded-full px-2 py-0.5">
                {s?.plan ?? '?'}
              </span>
            </div>
            <a
              href={`/${r.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              quiero.menu/{r.slug} ↗
            </a>
            <p className="text-xs text-on-surface-variant mt-2">
              {r.city ? `${r.city}, ` : ''}
              {r.country || '—'} · alta {formatDate(r.createdAt)}
            </p>
          </div>
          <Button onClick={handleOperate} disabled={operating}>
            <MaterialIcon name="edit" size="sm" />
            {operating ? 'Abriendo...' : 'Editar como admin'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      <InvitationPanel
        restaurantId={r.id}
        restaurantName={r.name}
        phone={r.phone ?? ''}
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <InfoCard title="Dueño">
          <p className="font-semibold text-on-surface">{detail.owner?.name || '—'}</p>
          <p className="text-sm text-on-surface-variant">{detail.owner?.email}</p>
          <p className="text-xs mt-1">
            {detail.owner?.emailVerified ? (
              <span className="text-success font-bold">Email verificado</span>
            ) : (
              <span className="text-on-surface-variant">Email sin verificar</span>
            )}
          </p>
        </InfoCard>

        <InfoCard title="Suscripción">
          <p className="font-semibold text-on-surface capitalize">{s?.plan ?? '—'}</p>
          <p className="text-sm text-on-surface-variant capitalize">{s?.status ?? 'sin datos'}</p>
          {s?.canceledAt && (
            <p className="text-xs text-error mt-1">
              Cancelada el {formatDate(s.canceledAt)}
            </p>
          )}
        </InfoCard>

        <InfoCard title="Pedidos">
          <p className="text-2xl font-extrabold text-on-surface">{detail.stats.ordersTotal}</p>
          <p className="text-xs text-on-surface-variant">
            {detail.stats.ordersLast30d} en los últimos 30 días
          </p>
        </InfoCard>

        <InfoCard title="Menú">
          <p className="text-sm text-on-surface">
            {detail.stats.categories} categorías · {detail.stats.products} productos
          </p>
          {detail.stats.categories === 0 && (
            <p className="text-xs text-on-surface-variant mt-1">
              Sin menú cargado todavía
            </p>
          )}
        </InfoCard>
      </div>

      <InfoCard title="Contacto y dominio">
        <dl className="text-sm space-y-1">
          <Row label="Teléfono" value={r.phone || '—'} />
          <Row label="Dirección" value={r.address || '—'} />
          <Row label="Moneda" value={r.currency} />
          <Row label="Timezone" value={r.timezone} />
          <Row label="Dominio custom" value={r.customDomain ?? '—'} />
          <Row label="Estado" value={r.status} />
        </dl>
      </InfoCard>

      <div className="bg-white rounded-2xl border border-outline-variant/40 p-5 mt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
          Ficha pública (Inventario)
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div className="space-y-1">
            <Label className="text-xs text-on-surface-variant">Nombre</Label>
            <Input value={ficha.name} onChange={(e) => setFicha({ ...ficha, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-on-surface-variant">Rubro</Label>
            <select
              value={ficha.category}
              onChange={(e) => setFicha({ ...ficha, category: e.target.value })}
              className="h-10 w-full rounded-xl border-none bg-surface-container-low px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <option value="">Sin clasificar</option>
              {RESTAURANT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-on-surface-variant">Dirección</Label>
            <Input value={ficha.address} onChange={(e) => setFicha({ ...ficha, address: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-on-surface-variant">
              Coordenadas (para el orden por cercanía)
            </Label>
            <div className="flex gap-1.5">
              <Input
                value={ficha.lat}
                onChange={(e) => setFicha({ ...ficha, lat: e.target.value })}
                placeholder="-32.48"
                inputMode="decimal"
                className="flex-1"
              />
              <Input
                value={ficha.lng}
                onChange={(e) => setFicha({ ...ficha, lng: e.target.value })}
                placeholder="-58.23"
                inputMode="decimal"
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleGeocode}
                disabled={geocoding}
                title="Buscar por la dirección"
                className="h-10 shrink-0 rounded-xl bg-primary/10 px-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={handleMyLocation}
                disabled={geocoding}
                title="Usar mi ubicación actual"
                className="h-10 shrink-0 rounded-xl bg-primary/10 px-2 items-center inline-flex text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                <MaterialIcon name="my_location" size="sm" />
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-on-surface-variant">Teléfono</Label>
            <Input value={ficha.phone} onChange={(e) => setFicha({ ...ficha, phone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-on-surface-variant">Ciudad</Label>
            <Input value={ficha.city} onChange={(e) => setFicha({ ...ficha, city: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-on-surface-variant">
              Provincia/departamento ({ficha.region || 'consultar'})
            </Label>
            <Input value={ficha.region} onChange={(e) => setFicha({ ...ficha, region: e.target.value })} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-on-surface-variant">Descripción</Label>
            <textarea
              value={ficha.description}
              onChange={(e) => setFicha({ ...ficha, description: e.target.value })}
              rows={2}
              maxLength={500}
              className="h-20 w-full rounded-xl border-none bg-surface-container-low px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-on-surface-variant">
              Galería de fotos (por línea: URL o s3:URL; alt opcional con ` | texto`)
            </Label>
            <textarea
              value={ficha.gallery}
              onChange={(e) => setFicha({ ...ficha, gallery: e.target.value })}
              rows={3}
              placeholder={
                's3:https://images.quiero.menu/locales/lorso/fachada.jpg\nhttps://fotos.com/blabla.jpg | sala interior'
              }
              className="w-full rounded-xl border-none bg-surface-container-low px-4 py-2 font-mono text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
        </div>
        <Button size="sm" onClick={handleSaveFicha} disabled={fichaSaving}>
          {fichaSaving ? 'Guardando...' : 'Guardar ficha'}
        </Button>
        {fichaMsg && <p className="text-xs text-on-surface-variant mt-2">{fichaMsg}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-amber-400/40 p-5 mt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
          Destacar en el directorio
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-on-surface-variant">
              Lugar
            </Label>
            <select
              value={featScope}
              onChange={(e) =>
                setFeatScope(e.target.value as 'category' | 'home')
              }
              className="h-10 rounded-xl border-none bg-surface-container-low px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <option value="category">Arriba del rubro</option>
              <option value="home">Home de la ciudad</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-on-surface-variant">
              Días
            </Label>
            <Input
              value={featDays}
              onChange={(e) => setFeatDays(e.target.value)}
              inputMode="numeric"
              className="h-10 w-24"
            />
          </div>
          <Button size="sm" onClick={handleFeature} disabled={featuring}>
            <MaterialIcon name="star" size="sm" />
            {featuring ? 'Asignando...' : 'Destacar'}
          </Button>
        </div>
        {featMsg && (
          <p className="text-xs text-on-surface-variant mt-2">{featMsg}</p>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/40 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="font-semibold text-on-surface truncate">{value}</dd>
    </div>
  );
}

/**
 * Coordenadas listas para guardar. undefined = no tocar; null = borrar
 * (los dos campos vacíos); invalida si falta uno no matchea.
 */
function parseCoords(
  lat: string,
  lng: string,
): { lat: number; lng: number } | null | undefined {
  const latTrim = lat.trim();
  const lngTrim = lng.trim();
  if (!latTrim && !lngTrim) return null;
  if (!latTrim || !lngTrim) return undefined;
  const la = Number(latTrim);
  const ln = Number(lngTrim);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return undefined;
  if (Math.abs(la) > 90 || Math.abs(ln) > 180) return undefined;
  return { lat: la, lng: ln };
}
