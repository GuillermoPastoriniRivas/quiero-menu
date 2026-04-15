'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { uploadImage, type ImageType } from '@/lib/upload';
import { MaterialIcon } from './material-icon';
import { Button } from './button';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  type: ImageType;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'banner' | 'auto';
}

export function ImageUpload({
  value,
  onChange,
  type,
  label,
  className,
  aspectRatio = 'auto',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'banner'
        ? 'aspect-[3/1]'
        : 'aspect-video';

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;

      setError(null);
      setUploading(true);
      setProgress(0);

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      try {
        const publicUrl = await uploadImage(file, type, setProgress);
        onChange(publicUrl);
        setPreview(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al subir imagen');
        setPreview(null);
      } finally {
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
      }
    },
    [type, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    onChange('');
    setPreview(null);
    setError(null);
  }, [onChange]);

  const displayUrl = preview || value;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      {displayUrl ? (
        <div className={cn('relative overflow-hidden rounded-xl border border-border', aspectClass)}>
          <img
            src={displayUrl}
            alt=""
            className="h-full w-full object-cover"
          />

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-3/4 rounded-full bg-white/20 h-2">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!uploading && (
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                onClick={() => inputRef.current?.click()}
              >
                <MaterialIcon name="edit" size="sm" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={handleRemove}
              >
                <MaterialIcon name="close" size="sm" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary/40 hover:bg-muted',
            aspectClass,
          )}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <MaterialIcon name="add_photo_alternate" size="xl" className="text-muted-foreground/60" />
          <span className="mt-1 text-xs text-muted-foreground">
            Arrastra o haz clic para subir
          </span>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
