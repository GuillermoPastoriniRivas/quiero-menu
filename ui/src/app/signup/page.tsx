'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { GuestGate } from '@/components/auth/guest-gate';
import { AuthShell, FormError, IconInput } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { ApiError } from '@/lib/api';

const deriveSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuthStore();
  const router = useRouter();

  const pendingMenu = useOnboardingStore((s) => s.aiResult);

  const [restaurantName, setRestaurantName] = useState(
    pendingMenu?.restaurant.name ?? '',
  );

  const autoSlug = deriveSlug(restaurantName) || 'mi-menu';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const baseSlug = deriveSlug(restaurantName) || 'mi-menu';
    try {
      let slug = baseSlug;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          await signup({ name, email, password, restaurantName, restaurantSlug: slug });
          if (pendingMenu) {
            try {
              await useOnboardingStore.getState().importMenu();
            } catch {
              // Si el import falla, el menu se puede cargar despues desde /menu.
            }
          }
          router.push('/verify-email');
          return;
        } catch (err: unknown) {
          lastError = err;
          const slugTaken =
            err instanceof ApiError && err.status === 409 && /slug/i.test(err.message);
          if (slugTaken && attempt < 3) {
            slug = `${baseSlug}-${attempt + 2}`;
            continue;
          }
          break;
        }
      }
      throw lastError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badgeIcon={pendingMenu ? 'rocket_launch' : 'storefront'}
      title={pendingMenu ? 'Publicá tu menú' : 'Creá tu cuenta'}
      subtitle={
        pendingMenu
          ? 'Tu menú ya está listo. Solo falta tu cuenta para publicarlo.'
          : 'Empezás gratis, sin tarjeta, y tenés tu menú publicado en 5 minutos.'
      }
      swapText="¿Ya tenés cuenta?"
      swapLabel="Ingresá"
      swapHref="/login"
    >
      {/* Progreso cuando viene con un menú armado por la IA */}
      {pendingMenu && (
        <div className="mb-7 mt-8">
          <div className="relative mb-5 overflow-hidden rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="gradient-cta flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md shadow-primary/20">
                <MaterialIcon name="check" size="sm" className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-heading)] text-sm font-extrabold text-on-surface">
                  Tu menú ya está listo
                </p>
                <p className="truncate text-xs text-on-surface-variant">
                  {pendingMenu.categories.length} categorías ·{' '}
                  {pendingMenu.categories.reduce((sum, c) => sum + c.items.length, 0)} platos
                </p>
              </div>
              <Link
                href="/onboarding"
                className="shrink-0 text-xs font-bold text-primary transition-colors hover:text-primary-container"
              >
                Editar
              </Link>
            </div>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span className="gradient-cta inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm shadow-primary/25">
              <MaterialIcon name="flag" size="xs" />
              Último paso
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
            <div className="h-full w-full rounded-full bg-primary" />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`${pendingMenu ? '' : 'mt-6'} space-y-3`}>
        {error && <FormError message={error} />}

        <div className="space-y-1.5">
          <Label htmlFor="name" className="ml-1 text-xs font-bold text-on-surface-variant">
            Tu nombre
          </Label>
          <IconInput
            id="name"
            icon="person"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan"
            autoComplete="name"
            required
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="ml-1 text-xs font-bold text-on-surface-variant">
            Email
          </Label>
          <IconInput
            id="email"
            type="email"
            icon="mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@ejemplo.com"
            autoComplete="email"
            required
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="ml-1 text-xs font-bold text-on-surface-variant">
            Contraseña
          </Label>
          <IconInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            icon="lock"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
            className="h-10"
            rightSlot={
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-outline transition-colors hover:text-on-surface"
                onClick={() => setShowPassword(!showPassword)}
              >
                <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" />
              </button>
            }
          />
        </div>

        {pendingMenu ? (
          <div className="space-y-2.5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <MaterialIcon name="storefront" size="sm" className="text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface-variant">Restaurante</p>
                  <p className="truncate text-sm font-bold text-on-surface">
                    {restaurantName || 'Sin nombre'}
                  </p>
                </div>
              </div>
              <Link
                href="/onboarding"
                className="shrink-0 text-xs font-bold text-primary transition-colors hover:text-primary-container"
              >
                Editar
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MaterialIcon name="link" size="xs" className="text-primary" />
              <span className="text-on-surface-variant">quiero.menu/</span>
              <span className="font-bold text-on-surface">{autoSlug}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label
                htmlFor="restaurantName"
                className="ml-1 text-xs font-bold text-on-surface-variant"
              >
                Nombre de tu local
              </Label>
              <IconInput
                id="restaurantName"
                icon="storefront"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="La Famosa Pizzería"
                required
                className="h-10"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2.5 text-sm ring-1 ring-outline-variant/30">
              <MaterialIcon name="link" size="xs" className="shrink-0 text-primary" />
              <span className="truncate text-on-surface-variant">
                quiero.menu/<span className="font-bold text-on-surface">{autoSlug}</span>
              </span>
              <MaterialIcon
                name="info"
                size="xs"
                className="ml-auto shrink-0 text-outline"
              />
            </div>
          </>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="btn-shimmer mt-1.5 h-11 w-full overflow-hidden rounded-2xl text-base font-bold"
        >
          {loading ? (
            <>
              <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
              Creando...
            </>
          ) : (
            <>
              {pendingMenu ? 'Publicar mi menú' : 'Crear mi cuenta gratis'}
              <MaterialIcon name="arrow_forward" size="sm" />
            </>
          )}
        </Button>

        <p className="pt-1 text-center text-xs leading-relaxed text-on-surface-variant">
          Al continuar aceptás los{' '}
          <Link className="font-semibold text-primary hover:underline" href="/terms">
            Términos
          </Link>{' '}
          y la{' '}
          <Link className="font-semibold text-primary hover:underline" href="/privacy">
            Política de Privacidad
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <GuestGate>
      <SignupForm />
    </GuestGate>
  );
}
