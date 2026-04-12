'use client';

import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Configura tu menu con IA</h1>
        <p className="text-muted-foreground">
          Subi una o dos fotos de tu menu y la IA extraera los platos, precios y categorias automaticamente.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
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
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <svg
          className="mb-3 h-10 w-10 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm font-medium">Arrastra tus fotos aqui o haz click</p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG o WebP (max 2 imagenes, 10MB c/u)</p>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-3">
          {images.map((file, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`Menu ${i + 1}`}
                className="h-32 w-32 rounded-lg object-cover border"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(i);
                }}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Additional text */}
      <div className="space-y-2">
        <Label>Texto adicional (opcional)</Label>
        <Textarea
          value={additionalText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Ej: Tambien vendemos desayunos los fines de semana, la moneda es pesos colombianos..."
          rows={3}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {fromMenu ? 'Volver al menu' : 'Configurar manualmente'}
        </button>
        <Button onClick={onAnalyze} disabled={images.length === 0} size="lg">
          Analizar con IA
        </Button>
      </div>
    </div>
  );
}
