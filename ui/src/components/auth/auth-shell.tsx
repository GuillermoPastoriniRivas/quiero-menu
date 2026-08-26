import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Logo } from '@/components/ui/logo';

const BENEFITS = [
  [
    'notifications_active',
    'Suena cuando entra un pedido',
    'Aunque el local esté lleno y el celular en el bolsillo.',
  ],
  [
    'receipt_long',
    'Te llegan armados y completos',
    'Nombre, dirección, forma de pago y total. Sin comandas al papel.',
  ],
  [
    'insights',
    'Sabés qué se vende y a qué hora',
    'Tus platos más pedidos y tus horas pico, sin planillas.',
  ],
] as const;

function BrandOrbs() {
  return (
    <>
      <div aria-hidden className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div
        aria-hidden
        className="animate-orb pointer-events-none absolute -top-24 right-[10%] h-80 w-80 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-orb pointer-events-none absolute bottom-1/4 -left-20 h-72 w-72 rounded-full bg-[#ff9a3c]/15 blur-3xl"
        style={{ animationDelay: '-8s' }}
      />
    </>
  );
}

export function LiveCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-ambient-lg backdrop-blur ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-[family-name:var(--font-heading)] text-sm font-extrabold text-white">
          Pizzería Napoli
        </p>
        <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success-container/80 px-2.5 py-0.5 text-[11px] font-bold text-on-success-container">
          En vivo
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ['Pedidos', '14'],
          ['Vendido', '$186.400'],
          ['Ticket', '$13.314'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-black/20 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
            <p className="font-[family-name:var(--font-heading)] text-sm font-extrabold text-white sm:text-base">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-2 hidden items-center justify-between gap-3 rounded-2xl bg-black/20 px-3 py-2 sm:flex">
        <p className="min-w-0 truncate text-xs text-white/70">
          <span className="font-extrabold text-white">#1043</span> · Sofía R. · 2× Pizza Margherita ·
          1× Gaseosa
        </p>
        <span className="shrink-0 rounded-full bg-primary/25 px-2 py-0.5 text-[10px] font-bold text-primary-fixed-dim">
          Nuevo
        </span>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="landing-dark relative hidden overflow-hidden lg:flex lg:flex-col">
      <BrandOrbs />

      <div className="relative flex items-center justify-between p-6">
        <div className="inline-flex rounded-2xl bg-surface-container-lowest/95 px-4 py-2 shadow-ambient-lg backdrop-blur">
          <Logo size="md" href="/" />
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/80 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-success" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Tu local, en vivo
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-6 pb-6">
        <p className="font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-[0.2em] text-primary-fixed-dim">
          Tu panel
        </p>
        <h2 className="mt-3 max-w-md font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-[1.05] tracking-tight text-white text-balance">
          Cada pedido, armado y completo.
        </h2>
        <p className="mt-2 max-w-md leading-relaxed text-white/65">
          Entrá y mirá todo lo que vendió hoy mientras vos te ocupás del horno.
        </p>

        <ul className="mt-6 space-y-3.5">
          {BENEFITS.map(([icon, title, text]) => (
            <li key={title} className="flex max-w-md gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-primary-fixed-dim backdrop-blur">
                <MaterialIcon name={icon} size="sm" />
              </span>
              <span>
                <span className="block font-[family-name:var(--font-heading)] font-bold text-white">
                  {title}
                </span>
                <span className="block text-sm text-white/60">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <LiveCard className="mt-6 max-w-md" />
      </div>

      <div className="relative px-6 pb-5">
        <div aria-hidden className="landing-hairline h-px w-full opacity-60" />
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-white/60">¿Todavía no tenés tu menú?</p>
          <Link
            href="/onboarding"
            className="group flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white transition-colors hover:border-primary/50 hover:bg-white/[0.1]"
          >
            Probalo gratis
            <MaterialIcon
              name="arrow_forward"
              size="xs"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </aside>
  );
}

/** Banda de marca para mobile: oscura y corta, solo logo + pill en vivo + headline. */
function MobileBand() {
  return (
    <div className="landing-dark relative overflow-hidden pb-6 lg:hidden">
      <BrandOrbs />

      <div className="relative flex items-center justify-between px-5 py-3">
        <div className="inline-flex rounded-xl bg-surface-container-lowest/95 px-3 py-1 shadow-ambient-lg backdrop-blur">
          <Logo size="sm" href="/" />
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-bold text-white/80 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-success" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          En vivo
        </span>
      </div>

      <div className="relative px-5 pt-1.5">
        <h2 className="max-w-xs font-[family-name:var(--font-heading)] text-[1.35rem] font-extrabold leading-[1.12] tracking-tight text-white text-balance">
          Cada pedido, armado y completo.
        </h2>
      </div>
    </div>
  );
}

interface AuthShellProps {
  badgeIcon: string;
  title: string;
  subtitle: string;
  swapText: string;
  swapLabel: string;
  swapHref: string;
  children: React.ReactNode;
}

export function AuthShell({
  badgeIcon,
  title,
  subtitle,
  swapText,
  swapLabel,
  swapHref,
  children,
}: AuthShellProps) {
  return (
    <div className="grid h-dvh overflow-hidden lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <div className="hero-in relative flex h-full min-h-0 flex-col overflow-hidden">
        <MobileBand />

        {/* La línea de swap vive en el flujo, bajo la banda oscura: nunca colisiona con el logo */}
        <div className="px-5 pt-4 text-center text-sm text-on-surface-variant sm:text-left sm:px-8 lg:hidden">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5">
            {swapText}
            <Link
              href={swapHref}
              className="rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              {swapLabel}
            </Link>
          </span>
        </div>

        <header className="sticky top-0 z-40 hidden h-14 items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-6 backdrop-blur lg:flex">
          <p className="font-[family-name:var(--font-heading)] text-sm font-bold text-on-surface-variant">
            Bienvenido de vuelta
          </p>
          <p className="whitespace-nowrap text-sm text-on-surface-variant">
            {swapText}{' '}
            <Link href={swapHref} className="font-semibold text-primary hover:underline">
              {swapLabel}
            </Link>
          </p>
        </header>

        <main className="flex min-h-0 flex-grow overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="m-auto w-full max-w-[26rem]">
            <div className="gradient-cta mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25">
              <MaterialIcon name={badgeIcon} size="xl" fill />
            </div>

            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{subtitle}</p>

            {children}

            <div className="mt-6 flex items-center justify-center gap-5 border-t border-outline-variant/30 pt-4 text-xs text-on-surface-variant">
              <Link href="/terms" className="transition-colors hover:text-primary">
                Términos
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-primary">
                Privacidad
              </Link>
              <Link href="/status" className="transition-colors hover:text-primary">
                Estado del servicio
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
      <MaterialIcon name="error" size="sm" className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

type IconInputProps = React.ComponentProps<typeof Input> & {
  icon: string;
  rightSlot?: React.ReactNode;
};

export function IconInput({ icon, rightSlot, className, ...inputProps }: IconInputProps) {
  return (
    <div className="relative">
      <MaterialIcon
        name={icon}
        size="sm"
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-outline"
      />
      <Input {...inputProps} className={`pl-10 pr-4 ${rightSlot ? 'pr-11' : ''} ${className ?? ''}`} />
      {rightSlot}
    </div>
  );
}
