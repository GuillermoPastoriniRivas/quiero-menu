'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Logo } from '@/components/ui/logo';

type VerifyState =
  | { kind: 'verifying' }
  | { kind: 'success' }
  | { kind: 'invalid' }
  | { kind: 'expired' }
  | { kind: 'check' };

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [state, setState] = useState<VerifyState>({ kind: 'verifying' });
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!token) {
      setState({ kind: 'check' });
      return;
    }
    let cancelled = false;
    api
      .post('/auth/verify-email', { token })
      .then(() => {
        if (!cancelled) setState({ kind: 'success' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : '';
        if (msg.toLowerCase().includes('expired')) {
          setState({ kind: 'expired' });
        } else {
          setState({ kind: 'invalid' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    setResendError('');
    try {
      await api.post('/auth/resend-verification');
      setResent(true);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        setResendError(
          'Tu sesion expiro. Inicia sesion para poder reenviar el email.',
        );
      } else {
        setResendError('Ocurrio un error. Intenta de nuevo.');
      }
    } finally {
      setResending(false);
    }
  };

  const icon =
    state.kind === 'success' || state.kind === 'check'
      ? 'mark_email_read'
      : 'link_off';
  const iconBg =
    state.kind === 'success' || state.kind === 'check'
      ? 'bg-primary/10'
      : 'bg-error-container/30';
  const iconColor =
    state.kind === 'success' || state.kind === 'check'
      ? 'text-primary'
      : 'text-on-error-container';

  const title =
    state.kind === 'success'
      ? 'Email verificado'
      : state.kind === 'expired'
        ? 'Enlace expirado'
        : state.kind === 'check'
          ? 'Revisa tu email'
          : 'Enlace invalido';

  const description =
    state.kind === 'success'
      ? 'Tu email fue verificado correctamente. Ya podes empezar a usar tu menu.'
      : state.kind === 'expired'
        ? 'El enlace de verificacion expiro. Podes solicitar uno nuevo.'
        : state.kind === 'check'
          ? 'Enviamos un enlace de verificacion a tu email. Si no lo recibiste, podes reenviarlo.'
          : 'El enlace de verificacion no es valido. Podes solicitar uno nuevo.';

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 bg-surface">
        <div className="flex items-center gap-2">
          <Logo size="md" href="/" />
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-ambient-lg p-8 lg:p-12 text-center">
          {state.kind === 'verifying' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MaterialIcon
                  name="hourglass_top"
                  size="lg"
                  className="text-primary animate-spin"
                />
              </div>
              <h1
                className="text-2xl font-bold text-on-surface mb-2"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Verificando tu email...
              </h1>
            </>
          ) : (
            <>
              <div
                className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-6`}
              >
                <MaterialIcon
                  name={icon}
                  size="lg"
                  className={iconColor}
                />
              </div>
              <h1
                className="text-2xl font-bold text-on-surface mb-2"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {title}
              </h1>
              <p className="text-on-surface-variant text-sm mb-6">
                {description}
              </p>

              {state.kind === 'success' ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                >
                  Ir a mi panel
                </Button>
              ) : (
                <>
                  {resent ? (
                    <div className="mb-4 bg-primary/10 text-primary px-4 py-3 rounded-xl text-sm font-semibold">
                      Email reenviado. Revisa tu casilla.
                    </div>
                  ) : (
                    <>
                      {resendError && (
                        <div className="mb-4 bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
                          {resendError}
                        </div>
                      )}
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleResend}
                        disabled={resending}
                      >
                        {resending ? 'Enviando...' : 'Reenviar email'}
                      </Button>
                      <Link
                        href="/login"
                        className="block text-center text-sm text-on-surface-variant pt-4"
                      >
                        <span className="text-primary font-semibold hover:underline">
                          Iniciar sesion
                        </span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}