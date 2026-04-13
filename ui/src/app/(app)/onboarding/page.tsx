'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { MenuImageUpload } from '@/components/onboarding/menu-image-upload';
import { AiMenuPreview } from '@/components/onboarding/ai-menu-preview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromMenu = searchParams.get('from') === 'menu';

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
    reset();
  }, []);

  const handleSkip = () => {
    reset();
    router.push(fromMenu ? '/menu' : '/dashboard');
  };

  if (step === 'upload') {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
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
    );
  }

  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-primary" />
        <p className="text-lg font-medium">Analizando tu menu...</p>
        <p className="text-sm text-muted-foreground">Esto puede tomar hasta 30 segundos</p>
      </div>
    );
  }

  if (step === 'preview' && aiResult) {
    return (
      <AiMenuPreview
        result={aiResult}
        onChange={updateResult}
        onImport={importMenu}
        onBack={() => useOnboardingStore.setState({ step: 'upload' })}
        error={error}
      />
    );
  }

  if (step === 'importing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-primary" />
        <p className="text-lg font-medium">Importando tu menu...</p>
      </div>
    );
  }

  if (step === 'done' && importResult) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <MaterialIcon name="check" size="xl" className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Menu importado</h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{importResult.categories} categorias creadas</p>
              <p>{importResult.items} items creados</p>
              {importResult.variants > 0 && <p>{importResult.variants} variantes creadas</p>}
              {importResult.options > 0 && <p>{importResult.options} opciones creadas</p>}
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                reset();
                router.push(fromMenu ? '/menu' : '/dashboard');
              }}
            >
              {fromMenu ? 'Ir al menu' : 'Ir al dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
