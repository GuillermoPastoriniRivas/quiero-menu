'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAuthStore } from '@/stores/auth.store';
import { MenuImageUpload } from '@/components/onboarding/menu-image-upload';
import { AiMenuPreview } from '@/components/onboarding/ai-menu-preview';
import { OnboardingSteps } from '@/components/onboarding/onboarding-steps';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  );
}

function FlowShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-14">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[320px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative w-full max-w-3xl">{children}</div>
    </div>
  );
}

function StepLoading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <FlowShell>
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="relative">
          <div className="w-20 h-20 gradient-cta rounded-3xl flex items-center justify-center shadow-xl shadow-primary/25">
            <MaterialIcon name={icon} size="xl" className="text-white animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-3xl animate-[pulse-urgent_2s_ease-in-out_infinite]" />
        </div>
        <div className="space-y-2">
          <h1
            className="text-2xl font-extrabold text-on-surface"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {title}
          </h1>
          <p className="text-on-surface-variant max-w-sm mx-auto">{subtitle}</p>
        </div>
        <div className="w-56 h-1.5 rounded-full bg-surface-container-low overflow-hidden">
          <div className="h-full w-1/3 gradient-cta rounded-full animate-[progress-slide_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </FlowShell>
  );
}

function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromMenu = searchParams.get('from') === 'menu';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const {
    step,
    images,
    additionalText,
    aiResult,
    importResult,
    error,
    setImages,
    setText,
    updateResult,
    analyzeMenu,
    importMenu,
    reset,
  } = useOnboardingStore();

  useEffect(() => {
    // Esta pagina es publica; si hay una sesion guardada (ej: viene del panel),
    // hidratarla para ofrecer el flujo de import directo.
    useAuthStore.getState().hydrate();
    reset();
  }, []);

  const handleSkip = () => {
    reset();
    if (isAuthenticated) {
      router.push(fromMenu ? '/menu' : '/dashboard');
    } else {
      router.push('/signup');
    }
  };

  const handleImport = async () => {
    if (isAuthenticated) {
      await importMenu();
    } else {
      router.push('/signup');
    }
  };

  if (step === 'upload') {
    return (
      <FlowShell>
        <div className="w-full max-w-2xl mx-auto">
          <MenuImageUpload
            images={images}
            additionalText={additionalText}
            onImagesChange={setImages}
            onTextChange={setText}
            onAnalyze={analyzeMenu}
            onSkip={handleSkip}
            error={error}
            fromMenu={fromMenu}
          />
        </div>
      </FlowShell>
    );
  }

  if (step === 'analyzing') {
    return (
      <StepLoading
        icon="auto_awesome"
        title="Analizando tu menu"
        subtitle="La IA esta leyendo tu foto y extrayendo platos, precios y categorias. Esto puede tardar hasta 30 segundos."
      />
    );
  }

  if (step === 'preview' && aiResult) {
    return (
      <FlowShell>
        <AiMenuPreview
          result={aiResult}
          onChange={updateResult}
          onImport={handleImport}
          onBack={() => useOnboardingStore.setState({ step: 'upload' })}
          error={error}
          importLabel={isAuthenticated ? 'Importar menu' : 'Crear cuenta y publicar'}
        />
      </FlowShell>
    );
  }

  if (step === 'importing') {
    return (
      <StepLoading
        icon="upload_file"
        title="Importando tu menu"
        subtitle="Estamos creando las categorias y platos en tu cuenta. Un momento..."
      />
    );
  }

  if (step === 'done' && importResult) {
    return (
      <FlowShell>
        <Card className="max-w-lg mx-auto rounded-3xl border-outline-variant/30 shadow-ambient-lg overflow-hidden">
          <div className="gradient-cta px-6 py-10 text-white text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur mb-4">
                <MaterialIcon name="check" size="xl" className="text-white" />
              </div>
              <h2
                className="text-2xl font-extrabold"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Menu publicado
              </h2>
              <p className="text-white/85 text-sm mt-1">Tu menu digital ya esta online</p>
            </div>
          </div>
          <CardContent className="pt-6 pb-7 px-6 space-y-5 text-center">
            <div className="flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-bold">
                <MaterialIcon name="category" size="xs" />
                {importResult.categories} categorias
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-bold">
                <MaterialIcon name="restaurant_menu" size="xs" />
                {importResult.items} platos
              </span>
              {importResult.variants > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-bold">
                  <MaterialIcon name="list_alt" size="xs" />
                  {importResult.variants} variantes
                </span>
              )}
              {importResult.options > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-bold">
                  <MaterialIcon name="checklist" size="xs" />
                  {importResult.options} opciones
                </span>
              )}
            </div>
            <Button
              size="lg"
              className="w-full rounded-2xl"
              onClick={() => {
                reset();
                router.push(fromMenu ? '/menu' : '/dashboard');
              }}
            >
              {fromMenu ? 'Ir al menu' : 'Ir al dashboard'}
              <MaterialIcon name="arrow_forward" size="sm" />
            </Button>
            <p className="text-xs text-on-surface-variant">
              Comparti tu link en Instagram, WhatsApp o con un QR en tu local.
            </p>
          </CardContent>
        </Card>
      </FlowShell>
    );
  }

  return null;
}