'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { AdminCreateRestaurantResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MaterialIcon } from '@/components/ui/material-icon';
import { RESTAURANT_CATEGORIES } from '@/lib/restaurant-categories';

const deriveSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function generatePassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes]
    .map((b) => alphabet[b % alphabet.length])
    .join('');
}

export default function AdminNuevoLocalPage() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generatePassword);
  const [showPassword, setShowPassword] = useState(true);
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [city, setCity] = useState('Concepción del Uruguay');
  const [category, setCategory] = useState('');
  const [sendEmails, setSendEmails] = useState(true);
  const [isInventory, setIsInventory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveSlug =
    slugTouched && slug ? slug : deriveSlug(restaurantName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isInventory) {
        // Alta de inventario: sin dueño ni emails. El local queda
        // reclamable (claimed=false) hasta que el dueño pida la cuenta.
        const created = await api.post<{ restaurantId: string; slug: string }>(
          '/admin/restaurants/unclaimed',
          {
            restaurantName,
            restaurantSlug: effectiveSlug,
            city: city || undefined,
            category: category || undefined,
            currency: 'ARS',
            timezone: 'America/Argentina/Buenos_Aires',
          },
        );
        router.push(`/admin/locales/${created.restaurantId}`);
        return;
      }
      const created = await api.post<AdminCreateRestaurantResponse>(
        '/admin/restaurants',
        {
          ownerName,
          email,
          password,
          restaurantName,
          restaurantSlug: effectiveSlug,
          city: city || undefined,
          category: category || undefined,
          currency: 'ARS',
          timezone: 'America/Argentina/Buenos_Aires',
          sendOwnerEmails: sendEmails,
        },
      );
      router.push(`/admin/locales/${created.restaurantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el local');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/locales"
        className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-4"
      >
        <MaterialIcon name="arrow_back" size="sm" />
        Locales
      </Link>

      <h1 className="text-2xl font-bold text-on-surface mb-1">
        Nuevo local
      </h1>
      <p className="text-sm text-on-surface-variant mb-6">
        Alta manual de una cuenta. Compartile la contraseña al dueño por un canal
        seguro; va a poder cambiarla después.
      </p>

      <div className="bg-white rounded-2xl border border-outline-variant/40 p-6 flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="font-semibold text-on-surface text-sm">Inventario (sin dueño)</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Para cargar el directorio: el local queda reclamable hasta que el
            dueño pida la cuenta
          </p>
        </div>
        <Switch checked={isInventory} onCheckedChange={setIsInventory} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!isInventory && (
        <div className="bg-white rounded-2xl border border-outline-variant/40 p-6 space-y-4">
          <h2 className="font-bold text-on-surface text-sm uppercase tracking-wide text-on-surface-variant">
            Dueño
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ownerName" className="text-xs font-bold text-on-surface-variant ml-1">
                Nombre del dueño
              </Label>
              <Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-on-surface-variant ml-1">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-on-surface-variant ml-1">
              Contraseña temporal (generada)
            </Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="font-mono"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPassword(!showPassword)}>
                <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPassword(generatePassword())}>
                <MaterialIcon name="casino" size="sm" />
              </Button>
            </div>
          </div>
        </div>
        )}

        <div className="bg-white rounded-2xl border border-outline-variant/40 p-6 space-y-4">
          <h2 className="font-bold text-on-surface text-sm uppercase tracking-wide text-on-surface-variant">
            Restaurante
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="restaurantName" className="text-xs font-bold text-on-surface-variant ml-1">
              Nombre del local
            </Label>
            <Input
              id="restaurantName"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="La Famosa Pizzeria"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug" className="text-xs font-bold text-on-surface-variant ml-1">
              URL pública
            </Label>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-on-surface-variant">quiero.menu/</span>
              <Input
                id="slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase());
                  setSlugTouched(true);
                }}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs font-bold text-on-surface-variant ml-1">
              Ciudad
            </Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-bold text-on-surface-variant ml-1">
              Rubro
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-xl border-none bg-surface-container-low px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <option value="">Sin clasificar</option>
              {RESTAURANT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!isInventory && (
        <div className="bg-white rounded-2xl border border-outline-variant/40 p-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-on-surface text-sm">Enviar emails de bienvenida</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Welcome + verificación de email al dueño
            </p>
          </div>
          <Switch checked={sendEmails} onCheckedChange={setSendEmails} />
        </div>
        )}

        <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Creando...' : isInventory ? 'Crear local' : 'Crear cuenta'}
        </Button>
      </form>
    </div>
  );
}
