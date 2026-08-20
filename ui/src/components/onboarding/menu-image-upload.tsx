'use client';

import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { OnboardingSteps } from '@/components/onboarding/onboarding-steps';
import { cn } from '@/lib/utils';

interface MenuImageUploadProps {
  images: File[];
  additionalText: string;
  onImagesChange: (files: File[]) => void;
  onTextChange: (text: string) => void;
  onAnalyze: () => void;
  onSkip: () => void;
  error: string | null;
  fromMenu?: boolean;
}

export function MenuImageUpload({
  images,
  additionalText,
  onImagesChange,
  onTextChange,
  onAnalyze,
  onSkip,
  error,
  fromMenu,
}: MenuImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const files = Array.from(fileList).filter((f) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
      );
      const combined = [...images, ...files].slice(0, 2);
      onImagesChange(combined);
    },
    [images, onImagesChange],
  );

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 gradient-cta text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm shadow-primary/25">
          <MaterialIcon name="auto_awesome" size="xs" />
          CON IA
        </span>
        <h1
          className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Subi una foto de tu menu
        </h1>
        <p className="text-on-surface-variant max-w-md mx-auto">
          La IA extrae platos, precios y categorias en segundos. Sin tipear nada.
        </p>
      </div>

      <OnboardingSteps current={0} />

      {/* Drop zone */}
      <div
        className={cn(
          'relative rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden',
          dragOver
            ? 'border-primary bg-primary/5 scale-[1.01] shadow-ambient'
            : 'border-primary/30 bg-white hover:border-primary/60 hover:shadow-ambient',
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="relative flex flex-col items-center justify-center p-10 md:p-14 text-center">
          <div className="w-16 h-16 gradient-cta rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 mb-4">
            <MaterialIcon name="add_a_photo" size="lg" className="text-white" />
          </div>
          <p className="text-base font-bold text-on-surface">
            Arrastra tus fotos o hace click
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
            JPG, PNG o WebP · max 2 imagenes · 10MB c/u
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5 rounded-full px-5 pointer-events-none"
          >
            <MaterialIcon name="upload_file" size="sm" />
            Elegir archivos
          </Button>
        </div>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-4 justify-center">
          {images.map((file, i) => (
            <div key={i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview con blob: URL local; next/image no soporta blob */}
              <img
                src={URL.createObjectURL(file)}
                alt={`Menu ${i + 1}`}
                className="h-28 w-28 rounded-2xl object-cover border border-outline-variant/40 shadow-md"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(i);
                }}
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white shadow-md border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-destructive hover:border-destructive/40 transition-colors"
              >
                <MaterialIcon name="close" size="xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Additional text */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant ml-1">
          Texto adicional (opcional)
        </Label>
        <Textarea
          value={additionalText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Ej: Tambien vendemos desayunos los fines de semana, la moneda es pesos argentinos..."
          rows={3}
          className="rounded-2xl bg-white"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-error-container/40 text-on-error-container px-4 py-3 text-sm">
          <MaterialIcon name="error" size="sm" className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <MaterialIcon name="arrow_back" size="xs" />
          {fromMenu ? 'Volver al menu' : 'Configurar manualmente'}
        </button>
        <Button
          onClick={onAnalyze}
          disabled={images.length === 0}
          size="lg"
          className="w-full sm:w-auto rounded-2xl px-8"
        >
          <MaterialIcon name="auto_awesome" size="sm" />
          Analizar con IA
        </Button>
      </div>
    </div>
  );
}