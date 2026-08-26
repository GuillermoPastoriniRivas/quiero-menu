'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/logo';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#funciones', label: 'Funciones' },
  { href: '#precios', label: 'Precios' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled || open
          ? 'border-b border-outline-variant/40 bg-surface-container-lowest shadow-ambient'
          : 'border-b border-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo size="md" href="/" />

        <div className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-[family-name:var(--font-heading)] text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            aria-label="Entrar a mi panel"
            className="flex h-10 items-center gap-1.5 rounded-xl px-3 font-[family-name:var(--font-heading)] text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
          >
            <span className="sm:hidden">
              <MaterialIcon name="login" size="sm" />
            </span>
            <span className="hidden sm:inline">Entrar</span>
          </Link>
          <Link
            href="/signup"
            className="gradient-cta hidden rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.03] sm:inline-block"
          >
            Crear mi menú gratis
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface lg:hidden"
          >
            <MaterialIcon name={open ? 'close' : 'menu'} size="md" />
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-outline-variant/30 bg-surface px-5 pb-6 pt-4 lg:hidden">
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-outline-variant/25 py-3.5 font-[family-name:var(--font-heading)] text-base font-semibold text-on-surface"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="border-b border-outline-variant/25 py-3.5 font-[family-name:var(--font-heading)] text-base font-semibold text-on-surface"
            >
              Entrar a mi panel
            </Link>
          </div>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="gradient-cta mt-5 block rounded-2xl py-4 text-center text-base font-bold text-white"
          >
            Crear mi menú gratis
          </Link>
        </div>
      )}
    </header>
  );
}
