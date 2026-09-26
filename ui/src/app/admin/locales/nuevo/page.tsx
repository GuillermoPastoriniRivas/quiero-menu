'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { formatWhatsAppDisplay, toWhatsAppNumber } from '@/lib/ar-phone';
import { RESTAURANT_CATEGORIES } from '@/lib/restaurant-categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';
import type { AdminCreateUnclaimedResponse } from '@/types';

const SELECT =
  'h-11 w-full rounded-xl border-none bg-surface-container-low px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

const LAST_CITY_KEY = 'qm-admin-last-city';

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

function writeLastCity(city: string): void {
  try {
    localStorage.setItem(LAST_CITY_KEY, city);
  } catch {
    return;
  }
}

function readLastCity(): string {
  if (typeof window === 'undefined') return 'Concepción del Uruguay';
  try {
    return localStorage.getItem(LAST_CITY_KEY) || 'Concepción del Uruguay';
  } catch {
    return 'Concepción del Uruguay';
  }
}

export default function AdminNuevoLocalPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState(readLastCity);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveSlug = slugTouched ? slugify(slug) : slugify(name);
  const whatsapp = toWhatsAppNumber(phone);

  const create = async (candidate: string, attempt: number): Promise<AdminCreateUnclaimedResponse> => {
    try {
      return await api.post<AdminCreateUnclaimedResponse>('/admin/restaurants/unclaimed', {
        restaurantName: name.trim(),
        restaurantSlug: candidate,
        city: city.trim() || undefined,
        category: category || undefined,
        currency: 'ARS',
        timezone: 'America/Argentina/Buenos_Aires',
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      });
    } catch (e) {
      const taken = e instanceof ApiError && e.status === 409;
      if (taken && !slugTouched && attempt < 3) {
        const suffix = slugify(city).split('-')[0] || String(attempt + 2);
        return create(attempt === 0 ? `${effectiveSlug}-${suffix}` : `${effectiveSlug}-${attempt + 1}`, attempt + 1);
      }
      throw e;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || effectiveSlug.length < 2) {
      setError('Poné el nombre del local.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const created = await create(effectiveSlug, 0);
      writeLastCity(city.trim());
      router.push(`/admin/locales/${created.restaurantId}?nuevo=1`);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Esa dirección web ya está en uso. Cambiala abajo.'
          : err instanceof Error
            ? err.message
            : 'No se pudo crear el local',
      );
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href="/admin/locales" className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary">
        <MaterialIcon name="arrow_back" size="sm" />
        Locales
      </Link>

      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface">
          Cargar un local
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Con lo mínimo alcanza. Después cargás la carta con una foto y lo invitás al dueño.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="n-name" className="text-xs font-bold text-on-surface-variant">
            Nombre del local
          </Label>
          <Input
            id="n-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="La Esquina Pizzería"
            autoFocus
            required
            className="h-11"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="n-category" className="text-xs font-bold text-on-surface-variant">
              Rubro
            </Label>
            <select id="n-category" value={category} onChange={(e) => setCategory(e.target.value)} className={SELECT}>
              <option value="">Elegí un rubro</option>
              {RESTAURANT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="n-city" className="text-xs font-bold text-on-surface-variant">
              Ciudad
            </Label>
            <Input id="n-city" value={city} onChange={(e) => setCity(e.target.value)} className="h-11" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="n-phone" className="text-xs font-bold text-on-surface-variant">
            WhatsApp del local
          </Label>
          <Input
            id="n-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="3442 55-1234"
            inputMode="tel"
            className="h-11"
          />
          <p className={cn('text-xs', whatsapp ? 'text-success' : phone ? 'text-error' : 'text-on-surface-variant')}>
            {whatsapp
              ? `WhatsApp: ${formatWhatsAppDisplay(whatsapp)}`
              : phone
                ? 'Falta el código de área o sobran números.'
                : 'Lo vas a usar para mandarle la invitación.'}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="n-address" className="text-xs font-bold text-on-surface-variant">
            Dirección
          </Label>
          <Input
            id="n-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="San Martín 123"
            className="h-11"
          />
        </div>

        <div className="rounded-xl bg-surface-container-low px-3 py-2.5">
          <Label htmlFor="n-slug" className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Dirección web
          </Label>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <span className="text-on-surface-variant">quiero.menu/</span>
            <input
              id="n-slug"
              value={slugTouched ? slug : effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="nombre-del-local"
              className="min-w-0 flex-1 bg-transparent font-bold text-on-surface outline-none"
            />
          </div>
        </div>

        {error && <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{error}</div>}

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Creando...' : 'Crear ficha y seguir con la carta'}
          <MaterialIcon name="arrow_forward" size="sm" />
        </Button>
        <p className="text-center text-xs text-on-surface-variant">
          La ficha se publica sin carrito ni pedidos hasta que el dueño la tome.
        </p>
      </form>
    </div>
  );
}
