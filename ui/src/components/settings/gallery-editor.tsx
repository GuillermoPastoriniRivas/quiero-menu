"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Photo } from "@/components/ui/photo";
import { cn } from "@/lib/utils";
import type { PhotoGalleryImage } from "@/types";

const MAX_PHOTOS = 12;

interface GalleryEditorProps {
  value: PhotoGalleryImage[];
  onChange: (next: PhotoGalleryImage[]) => void;
  disabled?: boolean;
  uploader?: (file: File) => Promise<string>;
}

const defaultUploader = (file: File) => uploadImage(file, "gallery");

export function GalleryEditor({ value, onChange, disabled, uploader = defaultUploader }: GalleryEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const remaining = MAX_PHOTOS - value.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);
    if (accepted.length === 0) return;
    setUploading(accepted.length);
    const uploaded: PhotoGalleryImage[] = [];
    for (const file of accepted) {
      try {
        const url = await uploader(file);
        uploaded.push({ url, source: "s3" });
      } catch {
        toast.error(`No se pudo subir ${file.name}`);
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    }
    if (uploaded.length > 0) onChange([...value, ...uploaded]);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((photo, index) => (
          <figure
            key={`${photo.url}-${index}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low"
          >
            <Photo src={photo.url} alt={photo.alt ?? ""} />
            {index === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                Principal
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Mover antes"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-on-surface disabled:opacity-40"
                >
                  <MaterialIcon name="arrow_back" size="xs" />
                </button>
                <button
                  type="button"
                  disabled={disabled || index === value.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Mover después"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-on-surface disabled:opacity-40"
                >
                  <MaterialIcon name="arrow_forward" size="xs" />
                </button>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label="Quitar foto"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-error"
              >
                <MaterialIcon name="delete_outline" size="xs" />
              </button>
            </div>
          </figure>
        ))}

        {Array.from({ length: uploading }).map((_, i) => (
          <div
            key={`uploading-${i}`}
            className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/5"
          >
            <MaterialIcon name="progress_activity" size="md" className="animate-spin text-primary" />
          </div>
        ))}

        {remaining > uploading && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-outline-variant/50 text-on-surface-variant transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <MaterialIcon name="add_photo_alternate" size="lg" />
            <span className="text-xs font-bold">Agregar fotos</span>
          </button>
        )}
      </div>
      <p className="text-xs text-on-surface-variant">
        Hasta {MAX_PHOTOS} fotos del local, la fachada o tus platos. La primera es la principal.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
