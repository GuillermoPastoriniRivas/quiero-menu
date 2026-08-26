'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { GuestGate } from '@/components/auth/guest-gate';
import { AuthShell, FormError, IconInput } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badgeIcon="storefront"
      title="Ingresá a tu panel"
      subtitle="Mirá los pedidos de hoy y mové los estados para que tu cliente vea todo en vivo."
      swapText="¿No tenés cuenta?"
      swapLabel="Creá una gratis"
      swapHref="/signup"
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        {error && <FormError message={error} />}

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
          <div className="flex items-end justify-between">
            <Label htmlFor="password" className="ml-1 text-xs font-bold text-on-surface-variant">
              Contraseña
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              La olvidé
            </Link>
          </div>
          <IconInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            icon="lock"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
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

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="btn-shimmer mt-1.5 h-11 w-full overflow-hidden rounded-2xl text-base font-bold"
        >
          {loading ? (
            <>
              <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
              Ingresando...
            </>
          ) : (
            <>
              Ingresar
              <MaterialIcon name="arrow_forward" size="sm" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <GuestGate>
      <LoginForm />
    </GuestGate>
  );
}
