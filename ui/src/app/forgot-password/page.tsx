'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Ocurrio un error. Intenta de nuevo.');
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
        <Link href="/login" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
          Iniciar sesion
        </Link>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-ambient-lg p-8 lg:p-12">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MaterialIcon name="mark_email_read" size="lg" className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Revisa tu email</h1>
              <p className="text-on-surface-variant text-sm mb-6">
                Si existe una cuenta con <strong>{email}</strong>, vas a recibir un enlace para restablecer tu contrasena.
              </p>
              <p className="text-on-surface-variant text-xs mb-6">El enlace expira en 30 minutos.</p>
              <Link href="/login" className="text-primary font-semibold text-sm hover:underline">
                Volver al inicio de sesion
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Recupera tu contrasena</h1>
                <p className="text-on-surface-variant text-sm">Ingresa tu email y te enviaremos un enlace para restablecer tu contrasena.</p>
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

                <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </Button>

                <p className="text-center text-sm text-on-surface-variant pt-2">
                  <Link href="/login" className="text-primary font-semibold hover:underline">Volver al inicio de sesion</Link>
                </p>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
