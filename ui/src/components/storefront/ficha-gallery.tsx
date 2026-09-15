"use client";

import { useState } from "react";

type GalleryImage = { url: string; source: "s3" | "external"; alt?: string };

/**
 * Galería de fotos de la ficha de inventario. Las imágenes vienen "pre-
 * validadas": las s3 son nuestras y las external pasaron un check 200 +
 * Content-Type image/* cuando el equipo/scraper las cargó. Igual, si una
 * imagen cae después de insertarse (link muerto, hotlink bloqueado), la
 * entrada se oculta sola con onError en vez de romper la galería.
 */
export function FichaGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const [visible, setVisible] = useState(() => new Set(images.map((_, i) => i)));
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (visible.size === 0) return null;

  const layout = visible.size % 3;
  const items = images
    .map((img, i) => ({ img, i }))
    .filter(({ i }) => visible.has(i));

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {items.map(({ img, i }) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(i)}
            className={`group relative overflow-hidden rounded-2xl bg-surface-container ${
              i === 0 ? "col-span-2" : ""
            } ${layout === 1 && i !== 0 ? "aspect-square" : "aspect-[3/2]"}
              cursor-zoom-in`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt || name}
              loading="lazy"
              onError={() =>
                setVisible((prev) => {
                  const next = new Set(prev);
                  next.delete(i);
                  return next;
                })
              }
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>
      {lightbox !== null && visible.has(lightbox) ? (
        <button
          type="button"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/80 p-4 backdrop-blur-sm"
          aria-label="Cerrar imagen"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightbox].url}
            alt={images[lightbox].alt || name}
            className="mx-auto max-h-full w-auto rounded-2xl object-contain"
          />
        </button>
      ) : null}
    </>
  );
}
