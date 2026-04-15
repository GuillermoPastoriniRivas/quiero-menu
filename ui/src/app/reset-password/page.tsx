'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('expired')) {
        setError('El enlace expiro. Solicita uno nuevo.');
      } else if (msg.toLowerCase().includes('invalid')) {
        setError('El enlace no es valido. Solicita uno nuevo.');
      } else {
        setError('Ocurrio un error. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 bg-surface">
          <div className="flex items-center gap-2">
            <MaterialIcon name="receipt_long" size="lg" className="text-primary" />
            <span className="font-extrabold text-xl tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>Quiero Menu</span>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-ambient-lg p-8 lg:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-error-container/30 flex items-center justify-center mx-auto mb-6">
              <MaterialIcon name="link_off" size="lg" className="text-on-error-container" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Enlace invalido</h1>
            <p className="text-on-surface-variant text-sm mb-6">Este enlace no contiene un token valido para restablecer tu contrasena.</p>
            <Link href="/forgot-password" className="text-primary font-semibold text-sm hover:underline">Solicitar un nuevo enlace</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 bg-surface">
        <div className="flex items-center gap-2">
          <MaterialIcon name="receipt_long" size="lg" className="text-primary" />
          <span className="font-extrabold text-xl tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>Quiero Menu</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-ambient-lg p-8 lg:p-12">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MaterialIcon name="check_circle" size="lg" className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Contrasena restablecida</h1>
              <p className="text-on-surface-variant text-sm mb-6">Tu contrasena fue actualizada correctamente. Ya podes iniciar sesion.</p>
              <Button className="w-full" size="lg" onClick={() => router.push('/login')}>
                Iniciar sesion
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Nueva contrasena</h1>
                <p className="text-on-surface-variant text-sm">Ingresa tu nueva contrasena.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold text-on-surface-variant ml-1">Nueva contrasena</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-on-surface-variant ml-1">Confirmar contrasena</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
                  {loading ? 'Guardando...' : 'Restablecer contrasena'}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
