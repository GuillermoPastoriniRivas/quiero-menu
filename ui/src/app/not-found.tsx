import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 bg-surface">
        <Logo size="md" href="/" />
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-ambient-lg p-8 lg:p-12 text-center">
          <p className="text-6xl font-bold text-primary mb-4">404</p>
          <h1 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Pagina no encontrada
          </h1>
          <p className="text-on-surface-variant text-sm mb-8">
            La pagina que buscas no existe o fue movida.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary hover:bg-primary/90 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}