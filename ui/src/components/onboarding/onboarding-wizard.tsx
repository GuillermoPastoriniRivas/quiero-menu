'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { countItems, safeCategory, useOnboardingStore, type OnboardingStep } from '@/stores/onboarding.store';
import { RESTAURANT_CATEGORIES } from '@/lib/restaurant-categories';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Photo } from '@/components/ui/photo';
import { MenuReview } from '@/components/onboarding/menu-review';
import { cn } from '@/lib/utils';
import type { ActivationStatus, BulkImportResult } from '@/types';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

type Mode = 'guest-photo' | 'guest-manual' | 'import';

const FLOWS: Record<Mode, { steps: OnboardingStep[]; labels: string[] }> = {
  'guest-photo': { steps: ['carta', 'revisar', 'cuenta', 'listo'], labels: ['Tu carta', 'Revisá', 'Tu cuenta', 'Listo'] },
  'guest-manual': { steps: ['local', 'cuenta', 'listo'], labels: ['Tu local', 'Tu cuenta', 'Listo'] },
  import: { steps: ['carta', 'revisar', 'listo'], labels: ['Tu carta', 'Revisá', 'Listo'] },
};

const STEP_ALIAS: Partial<Record<OnboardingStep, OnboardingStep>> = { leyendo: 'carta', creando: 'cuenta' };

const deriveSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

function useObjectUrls(files: File[]): string[] {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  return urls;
}

function Progress({ mode, step }: { mode: Mode; step: OnboardingStep }) {
  const flow = FLOWS[mode];
  const current = flow.steps.indexOf(STEP_ALIAS[step] ?? step);
  return (
    <ol className="flex items-center gap-1.5" aria-label="Progreso">
      {flow.labels.map((label, i) => (
        <li key={label} className="flex items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              i < current ? 'w-6 bg-primary' : i === current ? 'w-10 bg-primary' : 'w-6 bg-outline-variant/50',
            )}
            title={label}
          />
        </li>
      ))}
      <span className="ml-1 hidden text-xs font-bold text-on-surface-variant sm:inline">
        {flow.labels[Math.max(0, current)]}
      </span>
    </ol>
  );
}

function StepHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="space-y-2 text-center">
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <MaterialIcon name="auto_awesome" size="xs" />
          {eyebrow}
        </span>
      )}
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface text-balance sm:text-4xl">
        {title}
      </h1>
      {subtitle && <p className="mx-auto max-w-md text-on-surface-variant text-balance">{subtitle}</p>}
    </div>
  );
}

function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
      <MaterialIcon name="error" size="sm" className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function StickyActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant/30 bg-surface/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
      <div className="mx-auto flex max-w-2xl items-center gap-3">{children}</div>
    </div>
  );
}

function PhotoStep({ mode, onManual }: { mode: Mode; onManual: () => void }) {
  const photos = useOnboardingStore((s) => s.photos);
  const note = useOnboardingStore((s) => s.note);
  const error = useOnboardingStore((s) => s.error);
  const addPhotos = useOnboardingStore((s) => s.addPhotos);
  const removePhoto = useOnboardingStore((s) => s.removePhoto);
  const setNote = useOnboardingStore((s) => s.setNote);
  const analyze = useOnboardingStore((s) => s.analyze);
  const [showNote, setShowNote] = useState(Boolean(note));
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const urls = useObjectUrls(photos);

  const handle = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessing(true);
    await addPhotos(files);
    setProcessing(false);
  };

  return (
    <div className="space-y-7">
      <StepHeader
        eyebrow="Con IA"
        title={mode === 'import' ? 'Subí la carta' : 'Sacale una foto a tu carta'}
        subtitle="Leemos los platos y los precios por vos. En menos de un minuto tenés tu menú armado."
      />

      <div
        className={cn(
          'relative overflow-hidden rounded-3xl border-2 border-dashed bg-surface-container-lowest transition-colors',
          photos.length > 0 ? 'border-outline-variant/40 p-4' : 'border-primary/40 p-6 sm:p-10',
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handle(e.dataTransfer.files);
        }}
      >
        {photos.length === 0 ? (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-cta text-white shadow-lg shadow-primary/25">
              <MaterialIcon name="photo_camera" size="xl" />
            </span>
            <p className="mt-4 font-bold text-on-surface">Una foto por página, hasta 4</p>
            <p className="mt-1 text-sm text-on-surface-variant">Con buena luz y de frente, que se lean los precios.</p>
            <div className="mt-6 grid w-full max-w-sm grid-cols-1 gap-2 sm:grid-cols-2">
              <Button size="lg" onClick={() => cameraRef.current?.click()} disabled={processing} className="sm:hidden">
                <MaterialIcon name="photo_camera" size="sm" />
                Sacar foto
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => galleryRef.current?.click()}
                disabled={processing}
                className="sm:col-span-2"
              >
                <MaterialIcon name="add_photo_alternate" size="sm" />
                {processing ? 'Preparando...' : 'Elegir fotos'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {urls.map((url, i) => (
              <figure key={url} className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low">
                <Photo src={url} alt={`Página ${i + 1} de la carta`} />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label="Quitar foto"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-on-surface shadow"
                >
                  <MaterialIcon name="close" size="xs" />
                </button>
              </figure>
            ))}
            {photos.length < 4 && (
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={processing}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-outline-variant/50 text-on-surface-variant transition-colors hover:border-primary/50 hover:text-primary"
              >
                <MaterialIcon name={processing ? 'progress_activity' : 'add_a_photo'} size="lg" className={cn(processing && 'animate-spin')} />
                <span className="text-xs font-bold">Otra página</span>
              </button>
            )}
          </div>
        )}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {showNote ? (
        <div className="space-y-1.5">
          <Label htmlFor="menu-note" className="text-xs font-bold text-on-surface-variant">
            Aclaración para la IA
          </Label>
          <Textarea
            id="menu-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ej: los precios de la segunda página son de la pizza grande"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="mx-auto flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary"
        >
          <MaterialIcon name="edit_note" size="sm" />
          Agregar una aclaración
        </button>
      )}

      <ErrorBox message={error} />

      <StickyActions>
        <Button variant="ghost" onClick={onManual} className="shrink-0">
          {mode === 'import' ? 'Volver' : 'No tengo la carta'}
        </Button>
        <Button size="lg" className="flex-1 sm:ml-auto sm:flex-none" disabled={photos.length === 0 || processing} onClick={analyze}>
          <MaterialIcon name="auto_awesome" size="sm" />
          Leer mi carta
        </Button>
      </StickyActions>
    </div>
  );
}

const READING_MESSAGES = [
  'Mirando las fotos...',
  'Leyendo los nombres de los platos...',
  'Buscando los precios...',
  'Armando las categorías...',
  'Revisando que no falte nada...',
];

function ReadingStep() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => Math.min(i + 1, READING_MESSAGES.length - 1)), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <div className="relative">
        <span className="absolute inset-0 animate-ping-soft rounded-3xl bg-primary/30" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl gradient-cta text-white shadow-xl shadow-primary/30">
          <MaterialIcon name="auto_awesome" size="xl" className="animate-pulse" />
        </span>
      </div>
      <div className="space-y-2">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">Leyendo tu carta</h1>
        <p key={index} className="hero-in text-on-surface-variant">
          {READING_MESSAGES[index]}
        </p>
      </div>
      <div className="h-1.5 w-56 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full w-1/3 rounded-full gradient-cta animate-[progress-slide_1.2s_ease-in-out_infinite]" />
      </div>
      <p className="text-xs text-on-surface-variant">Puede tardar hasta 40 segundos. No cierres esta pantalla.</p>
    </div>
  );
}

function LocalFields({ withCity = true }: { withCity?: boolean }) {
  const local = useOnboardingStore((s) => s.local);
  const setLocal = useOnboardingStore((s) => s.setLocal);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="local-name" className="text-xs font-bold text-on-surface-variant">
          Nombre del local
        </Label>
        <Input
          id="local-name"
          value={local.name}
          onChange={(e) => setLocal({ name: e.target.value })}
          placeholder="Ej: La Esquina Pizzería"
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="local-category" className="text-xs font-bold text-on-surface-variant">
          Rubro
        </Label>
        <select
          id="local-category"
          value={local.category}
          onChange={(e) => setLocal({ category: e.target.value })}
          className="h-11 w-full rounded-xl border-none bg-surface-container-low px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:text-sm"
        >
          <option value="">Elegí uno</option>
          {RESTAURANT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      {withCity && (
        <div className="space-y-1.5">
          <Label htmlFor="local-city" className="text-xs font-bold text-on-surface-variant">
            Ciudad
          </Label>
          <Input
            id="local-city"
            value={local.city}
            onChange={(e) => setLocal({ city: e.target.value })}
            placeholder="Ej: Concepción del Uruguay"
            className="h-11"
          />
        </div>
      )}
    </div>
  );
}

function ReviewStep({ mode, onContinue }: { mode: Mode; onContinue: () => void }) {
  const menu = useOnboardingStore((s) => s.menu);
  const setMenu = useOnboardingStore((s) => s.setMenu);
  const go = useOnboardingStore((s) => s.go);
  const error = useOnboardingStore((s) => s.error);
  if (!menu) return null;
  const items = countItems(menu);
  const missingPrices = menu.categories.reduce((sum, c) => sum + c.items.filter((i) => !i.basePrice).length, 0);
  const foundHours = (menu.operatingHours?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <StepHeader
        title="Revisá lo que leímos"
        subtitle={`Encontramos ${items} ${items === 1 ? 'plato' : 'platos'} en ${menu.categories.length} ${menu.categories.length === 1 ? 'categoría' : 'categorías'}. Corregí lo que haga falta: después podés cambiar todo.`}
      />

      <div className="flex flex-wrap justify-center gap-2">
        {missingPrices > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            <MaterialIcon name="warning" size="xs" />
            {missingPrices} sin precio
          </span>
        )}
        {foundHours && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-container px-3 py-1 text-xs font-bold text-on-success-container">
            <MaterialIcon name="schedule" size="xs" />
            También encontramos tus horarios
          </span>
        )}
        {menu.restaurant.phone && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-container px-3 py-1 text-xs font-bold text-on-success-container">
            <MaterialIcon name="chat" size="xs" />
            Y tu teléfono
          </span>
        )}
      </div>

      {mode !== 'import' && (
        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
            <MaterialIcon name="storefront" size="sm" className="text-primary" />
            Tu local
          </p>
          <LocalFields />
        </section>
      )}

      <MenuReview menu={menu} onChange={setMenu} />

      <ErrorBox message={error} />

      <StickyActions>
        <Button variant="ghost" onClick={() => go('carta')} className="shrink-0">
          <MaterialIcon name="arrow_back" size="sm" />
          Fotos
        </Button>
        <Button size="lg" className="flex-1 sm:ml-auto sm:flex-none" onClick={onContinue} disabled={items === 0}>
          {mode === 'import' ? 'Cargar estos platos' : 'Continuar'}
          <MaterialIcon name="arrow_forward" size="sm" />
        </Button>
      </StickyActions>
    </div>
  );
}

function ManualLocalStep({ onPhoto }: { onPhoto: () => void }) {
  const local = useOnboardingStore((s) => s.local);
  const go = useOnboardingStore((s) => s.go);
  const ready = local.name.trim().length > 1;
  return (
    <div className="space-y-6">
      <StepHeader title="Contanos de tu local" subtitle="Con esto armamos tu página. La carta la cargás después, cuando quieras." />
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
        <LocalFields />
      </section>
      <button
        type="button"
        onClick={onPhoto}
        className="flex w-full items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
      >
        <MaterialIcon name="photo_camera" size="md" className="text-primary" />
        <span className="flex-1 text-sm">
          <span className="block font-bold text-on-surface">¿Tenés la carta a mano?</span>
          <span className="text-on-surface-variant">Sacale una foto y te cargamos los platos ahora.</span>
        </span>
        <MaterialIcon name="chevron_right" size="sm" className="text-primary" />
      </button>
      <StickyActions>
        <Button size="lg" className="w-full sm:ml-auto sm:w-auto" disabled={!ready} onClick={() => go('cuenta')}>
          Continuar
          <MaterialIcon name="arrow_forward" size="sm" />
        </Button>
      </StickyActions>
    </div>
  );
}

function AccountStep({ mode, onCreated }: { mode: Mode; onCreated: (info: { email?: string; skippedImport?: boolean }) => void }) {
  const local = useOnboardingStore((s) => s.local);
  const menu = useOnboardingStore((s) => s.menu);
  const go = useOnboardingStore((s) => s.go);
  const importMenu = useOnboardingStore((s) => s.importMenu);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const signup = useAuthStore((s) => s.signup);
  const [showEmail, setShowEmail] = useState(!GOOGLE_CLIENT_ID);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const items = countItems(menu);
  const slug = deriveSlug(local.name) || 'mi-local';

  const finish = async (accountEmail?: string, isGoogle = false) => {
    let skippedImport = false;
    if (menu) {
      const current = isGoogle
        ? await api.get<ActivationStatus>('/restaurants/current/activation').catch(() => null)
        : null;
      if (current && current.details.menuItems > 0) {
        skippedImport = true;
      } else {
        await importMenu().catch(() => {
          toast.error('La cuenta quedó creada, pero no pudimos cargar la carta. Probá de nuevo desde Menú.');
        });
      }
    } else if (local.city || local.category) {
      await api
        .patch('/restaurants/current', {
          ...(local.city ? { city: local.city } : {}),
          ...(safeCategory(local.category) ? { category: local.category } : {}),
        })
        .catch(() => undefined);
    }
    onCreated({ email: accountEmail, skippedImport });
  };

  const handleGoogle = async (credential?: string) => {
    if (!credential) return;
    setError('');
    setBusy(true);
    go('creando');
    try {
      await googleLogin(credential, {
        ...(local.name.trim() ? { name: local.name.trim() } : {}),
        ...(local.city.trim() ? { city: local.city.trim() } : {}),
        ...(safeCategory(local.category) ? { category: local.category } : {}),
      });
      await finish(undefined, true);
    } catch (e) {
      go('cuenta');
      setBusy(false);
      setError(e instanceof Error ? e.message : 'No pudimos crear la cuenta con Google.');
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!local.name.trim()) {
      setError('Poné el nombre de tu local.');
      return;
    }
    setError('');
    setBusy(true);
    go('creando');
    try {
      let candidate = slug;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          await signup({ name, email, password, restaurantName: local.name.trim(), restaurantSlug: candidate });
          break;
        } catch (err) {
          const slugTaken = err instanceof ApiError && err.status === 409 && /slug/i.test(err.message);
          if (!slugTaken || attempt === 3) throw err;
          candidate = `${slug}-${attempt + 2}`;
        }
      }
      await finish(email);
    } catch (err) {
      go('cuenta');
      setBusy(false);
      const emailTaken = err instanceof ApiError && err.status === 409;
      setError(
        emailTaken
          ? 'Ese email ya tiene una cuenta. Ingresá con tu contraseña o con Google.'
          : err instanceof Error
            ? err.message
            : 'No pudimos crear la cuenta.',
      );
    }
  };

  return (
    <div className="space-y-6">
      <StepHeader title="Último paso: tu cuenta" subtitle="Para que el local quede a tu nombre y puedas recibir pedidos." />

      <section className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-cta text-white">
          <MaterialIcon name="storefront" size="md" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-on-surface">{local.name || 'Tu local'}</p>
          <p className="truncate text-xs text-on-surface-variant">
            quiero.menu/{slug}
            {items > 0 && ` · ${items} platos listos`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => go(mode === 'guest-manual' ? 'local' : 'revisar')}
          className="shrink-0 text-xs font-bold text-primary hover:underline"
        >
          Editar
        </button>
      </section>

      {!local.name.trim() && (
        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
          <LocalFields withCity={false} />
        </section>
      )}

      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
        {GOOGLE_CLIENT_ID && (
          <div className={cn('flex justify-center', busy && 'pointer-events-none opacity-60')}>
            <GoogleLogin
              onSuccess={(res) => handleGoogle(res.credential)}
              onError={() => setError('No se pudo continuar con Google.')}
              text="continue_with"
              shape="pill"
              size="large"
              width="320"
            />
          </div>
        )}

        {GOOGLE_CLIENT_ID && !showEmail && (
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            className="mx-auto flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary"
          >
            <MaterialIcon name="mail" size="sm" />
            Prefiero usar mi email
          </button>
        )}

        {showEmail && (
          <form onSubmit={handleEmail} className="space-y-3">
            {GOOGLE_CLIENT_ID && (
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-outline-variant/40" />
                <span className="text-xs font-semibold text-on-surface-variant">o con tu email</span>
                <span className="h-px flex-1 bg-outline-variant/40" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="acc-name" className="text-xs font-bold text-on-surface-variant">
                Tu nombre
              </Label>
              <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-email" className="text-xs font-bold text-on-surface-variant">
                Email
              </Label>
              <Input
                id="acc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-password" className="text-xs font-bold text-on-surface-variant">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="acc-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" />
                </button>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              Crear mi cuenta
            </Button>
          </form>
        )}

        <ErrorBox message={error || null} />

        <p className="text-center text-xs leading-relaxed text-on-surface-variant">
          Al continuar aceptás los{' '}
          <Link href="/terms" className="font-semibold text-primary hover:underline">
            Términos
          </Link>{' '}
          y la{' '}
          <Link href="/privacy" className="font-semibold text-primary hover:underline">
            Política de Privacidad
          </Link>
          . Es gratis y sin tarjeta.
        </p>
      </div>
    </div>
  );
}

function CreatingStep({ mode }: { mode: Mode }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl gradient-cta text-white shadow-lg shadow-primary/25">
        <MaterialIcon name="progress_activity" size="xl" className="animate-spin" />
      </span>
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
        {mode === 'import' ? 'Cargando tus platos' : 'Armando tu local'}
      </h1>
      <p className="text-on-surface-variant">Un segundo, ya casi está.</p>
    </div>
  );
}

function DoneStep({
  mode,
  imported,
  info,
}: {
  mode: Mode;
  imported: BulkImportResult | null;
  info: { email?: string; skippedImport?: boolean };
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const reset = useOnboardingStore((s) => s.reset);
  const local = useOnboardingStore((s) => s.local);
  const [copied, setCopied] = useState(false);
  const slug = user?.restaurantSlug ?? '';
  const url = typeof window !== 'undefined' && slug ? `${window.location.origin}/${slug}` : '';

  if (mode === 'import') {
    return (
      <div className="space-y-6 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-container text-success">
          <MaterialIcon name="check" size="xl" />
        </span>
        <StepHeader
          title="Carta cargada"
          subtitle={
            imported
              ? `Sumamos ${imported.items} platos en ${imported.categories} categorías. Ya se ven en tu menú.`
              : 'Tus platos ya están en tu menú.'
          }
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            onClick={() => {
              reset();
              router.push('/menu');
            }}
          >
            Ver mi carta
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              reset();
              router.push('/dashboard');
            }}
          >
            Ir al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-3xl gradient-cta px-6 py-10 text-center text-white shadow-ambient-lg">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-black/10 blur-2xl" />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <MaterialIcon name="rocket_launch" size="xl" />
          </span>
          <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-extrabold text-balance">
            {local.name || user?.restaurantName || 'Tu local'} ya está online
          </h1>
          <p className="mt-2 text-white/85">
            {imported
              ? `Con ${imported.items} platos cargados. Ahora dejalo listo para recibir pedidos.`
              : 'Ahora cargá la carta y dejalo listo para recibir pedidos.'}
          </p>
        </div>
      </div>

      {url && (
        <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-2 pl-4 shadow-sm">
          <MaterialIcon name="link" size="sm" className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-on-surface">{url.replace(/^https?:\/\//, '')}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={async () => {
              await navigator.clipboard.writeText(url).catch(() => undefined);
              setCopied(true);
            }}
          >
            <MaterialIcon name={copied ? 'check_circle' : 'content_copy'} size="sm" />
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-bold text-primary hover:bg-primary/10"
          >
            Ver
            <MaterialIcon name="open_in_new" size="xs" />
          </a>
        </div>
      )}

      {info.skippedImport && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ya tenías una cuenta con carta cargada, así que no sumamos los platos nuevos para no duplicarlos. Podés
          importarlos desde Menú.
        </p>
      )}
      {info.email && (
        <p className="text-center text-sm text-on-surface-variant">
          Te mandamos un email a <span className="font-semibold text-on-surface">{info.email}</span> para confirmar tu
          cuenta. Mientras tanto ya podés usar todo.
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          reset();
          router.push('/dashboard?nuevo=1');
        }}
      >
        Ir a mi panel
        <MaterialIcon name="arrow_forward" size="sm" />
      </Button>
    </div>
  );
}

function Wizard({ entry }: { entry: 'photo' | 'manual' }) {
  const router = useRouter();
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const step = useOnboardingStore((s) => s.step);
  const go = useOnboardingStore((s) => s.go);
  const resume = useOnboardingStore((s) => s.resume);
  const importMenu = useOnboardingStore((s) => s.importMenu);
  const imported = useOnboardingStore((s) => s.imported);
  const [mode, setMode] = useState<Mode | null>(null);
  const [info, setInfo] = useState<{ email?: string; skippedImport?: boolean }>({});
  const [importError, setImportError] = useState<string | null>(null);
  const ready = useOnboardingStore((s) => s.ready);
  const resumed = useRef(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isLoading && mode === null) {
    setMode(isAuthenticated ? 'import' : entry === 'manual' ? 'guest-manual' : 'guest-photo');
  }

  useEffect(() => {
    if (mode === null || resumed.current) return;
    resumed.current = true;
    resume(mode === 'guest-manual' ? 'manual' : 'photo');
  }, [mode, resume]);

  const backHref = isAuthenticated ? '/menu' : '/';

  const switchToManual = () => {
    if (mode === 'import') {
      router.push('/menu');
      return;
    }
    setMode('guest-manual');
    go('local');
  };

  const switchToPhoto = () => {
    setMode('guest-photo');
    go('carta');
  };

  const continueFromReview = async () => {
    if (mode !== 'import') {
      go('cuenta');
      return;
    }
    setImportError(null);
    go('creando');
    try {
      await importMenu();
      go('listo');
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'No pudimos cargar la carta.');
      go('revisar');
    }
  };

  if (mode === null || !ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface">
      <div aria-hidden className="landing-aurora pointer-events-none fixed inset-x-0 top-0 h-[60vh] opacity-70" />
      <header className="sticky top-0 z-40 border-b border-outline-variant/20 bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Logo size="sm" href={backHref} />
          <Progress mode={mode} step={step} />
          {isAuthenticated ? (
            <Link href="/menu" className="text-sm font-semibold text-on-surface-variant hover:text-primary">
              Salir
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-on-surface-variant hover:text-primary">
              Ingresar
            </Link>
          )}
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 pb-32 pt-8 sm:pb-16 sm:pt-12">
        {step === 'carta' && <PhotoStep mode={mode} onManual={switchToManual} />}
        {step === 'leyendo' && <ReadingStep />}
        {step === 'revisar' && (
          <>
            <ReviewStep mode={mode} onContinue={continueFromReview} />
            {importError && <ErrorBox message={importError} />}
          </>
        )}
        {step === 'local' && <ManualLocalStep onPhoto={switchToPhoto} />}
        {step === 'cuenta' && (
          <AccountStep
            mode={mode}
            onCreated={(result) => {
              setInfo(result);
              go('listo');
            }}
          />
        )}
        {step === 'creando' && <CreatingStep mode={mode} />}
        {step === 'listo' && <DoneStep mode={mode} imported={imported} info={info} />}
      </main>
    </div>
  );
}

export function OnboardingWizard({ entry = 'photo' }: { entry?: 'photo' | 'manual' }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || 'unset'}>
      <Wizard entry={entry} />
    </GoogleOAuthProvider>
  );
}
