'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { StorefrontView } from '@/components/storefront/storefront-view';
import { ImageUpload } from '@/components/ui/image-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { StorefrontData } from '@/types';

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api') + '/v1';

const DEFAULT_COLOR = '#E8532C';

const PRESET_COLORS = [
  { name: 'Naranja', value: '#E8532C' },
  { name: 'Rojo', value: '#D62828' },
  { name: 'Rosa', value: '#C2185B' },
  { name: 'Violeta', value: '#6A2C91' },
  { name: 'Azul', value: '#1565C0' },
  { name: 'Celeste', value: '#0288D1' },
  { name: 'Verde', value: '#2E7D32' },
  { name: 'Teal', value: '#00695C' },
  { name: 'Negro', value: '#26201F' },
];

interface Draft {
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
}

export default function AparienciaPage() {
  const { restaurant, fetch: fetchRestaurant, update } = useRestaurantStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [published, setPublished] = useState<Draft | null>(null);
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  useEffect(() => {
    if (!restaurant) return;
    const current: Draft = {
      logoUrl: restaurant.logoUrl,
      bannerUrl: restaurant.bannerUrl,
      primaryColor: restaurant.theme?.primaryColor ?? DEFAULT_COLOR,
    };
    setDraft(current);
    setPublished(current);
  }, [restaurant]);

  const slug = restaurant?.slug ?? '';

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setPreviewFailed(false);
    setStorefront(null);
    fetch(`${API_URL}/storefront/${encodeURIComponent(slug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((value: StorefrontData | null) => {
        if (cancelled) return;
        if (value) {
          setStorefront(value);
        } else {
          setPreviewFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setPreviewFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, retryKey]);

  const dirty = useMemo(() => {
    if (!draft || !published) return false;
    return (
      draft.logoUrl !== published.logoUrl ||
      draft.bannerUrl !== published.bannerUrl ||
      draft.primaryColor !== published.primaryColor
    );
  }, [draft, published]);

  const previewData = useMemo<StorefrontData | null>(() => {
    if (!storefront || !draft) return null;
    return {
      ...storefront,
      restaurant: {
        ...storefront.restaurant,
        logoUrl: draft.logoUrl,
        bannerUrl: draft.bannerUrl,
        theme: { primaryColor: draft.primaryColor },
      },
    };
  }, [storefront, draft]);

  const setField = (patch: Partial<Draft>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const handlePublish = async () => {
    if (!draft || saving) return;
    setSaving(true);
    try {
      await update({
        logoUrl: draft.logoUrl,
        bannerUrl: draft.bannerUrl,
        theme: { primaryColor: draft.primaryColor },
      });
      setPublished(draft);
      toast.success('Cambios publicados. Tu menú ya se ve así para tus clientes.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al publicar los cambios';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!published) return;
    setDraft(published);
    toast.info('Cambios descartados');
  };

  if (!restaurant || !draft) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>
            Apariencia
          </h1>
          <p className="text-on-surface-variant text-lg">
            Personalizá cómo se ve tu menú público. Todo lo que cambies se muestra acá abajo antes de publicarlo.
          </p>
        </div>
        {dirty && (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleDiscard} disabled={saving}>
              <MaterialIcon name="undo" size="sm" className="mr-1" />
              Descartar
            </Button>
            <Button onClick={handlePublish} disabled={saving} className="gradient-cta text-white">
              <MaterialIcon name="publish" size="sm" className="mr-1" />
              {saving ? 'Publicando...' : 'Publicar cambios'}
            </Button>
          </div>
        )}
      </div>

      {dirty && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <MaterialIcon name="visibility" size="sm" />
          <span>
            Tenés cambios sin publicar. Tus clientes siguen viendo la versión anterior hasta que publiques.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Banner</CardTitle>
              <CardDescription>
                La imagen grande de arriba del menú. Acá la ves sobre la portada, tal como la verán tus clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ImageUpload
                value={draft.bannerUrl}
                onChange={(url) => setField({ bannerUrl: url })}
                type="banner"
                label="Banner"
                aspectRatio="banner"
              />
              {draft.bannerUrl !== published?.bannerUrl && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <MaterialIcon name="edit_note" size="xs" />
                  Banner nuevo, sin publicar
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>Se muestra junto al nombre del restaurante en el costado (escritorio).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ImageUpload
                value={draft.logoUrl}
                onChange={(url) => setField({ logoUrl: url })}
                type="logo"
                label="Logo"
                aspectRatio="square"
              />
              {draft.logoUrl !== published?.logoUrl && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <MaterialIcon name="edit_note" size="xs" />
                  Logo nuevo, sin publicar
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color de botones</CardTitle>
              <CardDescription>
                Se aplica a las acciones del menú: categorías, agregar al carrito, ver carrito y confirmar pedido.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    title={color.name}
                    aria-label={`Color ${color.name}`}
                    onClick={() => setField({ primaryColor: color.value })}
                    className={cn(
                      'h-9 w-full rounded-lg border-2 transition-transform active:scale-95',
                      draft.primaryColor.toLowerCase() === color.value.toLowerCase()
                        ? 'border-on-surface scale-105'
                        : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="custom-color" className="text-sm">Color personalizado</Label>
                <input
                  id="custom-color"
                  type="color"
                  value={draft.primaryColor}
                  onChange={(e) => setField({ primaryColor: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                />
                <span className="font-mono text-xs text-on-surface-variant">
                  {draft.primaryColor.toUpperCase()}
                </span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Así se ve un botón</Label>
                <button
                  type="button"
                  className="w-full gradient-cta text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-primary/20"
                  style={{ '--primary': draft.primaryColor } as CSSProperties}
                >
                  Agregar $12.000
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white">
            <div className="flex items-center gap-2 border-b border-outline-variant/10 bg-surface-container-low px-4 py-2.5">
              <MaterialIcon name="visibility" size="sm" className="text-on-surface-variant" />
              <span className="text-xs font-semibold text-on-surface">Vista previa</span>
              <span className="ml-auto truncate text-xs text-on-surface-variant">
                quiero.menu/{restaurant.slug}
              </span>
            </div>
            <div className="h-[75vh] overflow-y-auto overscroll-contain">
              {previewData ? (
                <StorefrontView data={previewData} slug={slug} trackView={false} />
              ) : previewFailed ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-on-surface-variant">
                  <MaterialIcon name="error_outline" size="lg" className="text-on-surface-variant/50" />
                  No se pudo cargar tu menú para la vista previa.
                  <button
                    type="button"
                    className="text-primary font-semibold hover:underline"
                    onClick={() => setRetryKey((k) => k + 1)}
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                  Cargando tu menú...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}