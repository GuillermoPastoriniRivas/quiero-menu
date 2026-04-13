'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function LoginPage() {
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
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 bg-surface">
        <div className="flex items-center gap-2">
          <MaterialIcon name="receipt_long" size="lg" className="text-primary" />
          <span className="font-extrabold text-xl tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>Quiero Menu</span>
        </div>
        <Link href="/signup" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
          Registrate
        </Link>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-ambient-lg p-8 lg:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Bienvenido de vuelta</h1>
            <p className="text-on-surface-variant text-sm">Ingresa a tu cuenta para gestionar tu restaurante</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-on-surface-variant ml-1">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ejemplo.com" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-on-surface-variant ml-1">Contrasena</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" />
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>

            <p className="text-center text-sm text-on-surface-variant pt-2">
              No tenes cuenta?{' '}
              <Link href="/signup" className="text-primary font-semibold hover:underline">Registrate</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
