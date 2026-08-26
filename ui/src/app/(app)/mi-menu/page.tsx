'use client';

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/lib/api';
import { ImageUpload } from '@/components/ui/image-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { BrandedQr } from '@/components/publicar/branded-qr';
import {
  PREVIEW_DRAFT_MESSAGE,
  isPreviewReadyMessage,
} from '@/lib/storefront-preview';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

type MiMenuTab = 'diseno' | 'compartir';

const TABS: { value: MiMenuTab; label: string; icon: string }[] = [
  { value: 'diseno', label: 'Diseño', icon: 'palette' },
  { value: 'compartir', label: 'Compartir', icon: 'share' },
];

interface Draft {
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
}

function MiMenuPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as MiMenuTab | null;
  const [activeTab, setActiveTab] = useState<MiMenuTab>(
    tabParam === 'compartir' ? 'compartir' : 'diseno',
  );

  const { restaurant, fetch: fetchRestaurant, update } = useRestaurantStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [published, setPublished] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Slug / link público
  const [slug, setSlug] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);

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
    setSlug(restaurant.slug);
  }, [restaurant]);

  const slugLive = restaurant?.slug ?? '';

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (isPreviewReadyMessage(event.data)) setPreviewReady(true);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (!previewReady || !draft) return;
    previewRef.current?.contentWindow?.postMessage(
      { type: PREVIEW_DRAFT_MESSAGE, payload: draft },
      window.location.origin,
    );
  }, [draft, previewReady]);

  const dirty = useMemo(() => {
    if (!draft || !published) return false;
    return (
      draft.logoUrl !== published.logoUrl ||
      draft.bannerUrl !== published.bannerUrl ||
      draft.primaryColor !== published.primaryColor
    );
  }, [draft, published]);

  const menuUrl =
    typeof window !== 'undefined' && restaurant
      ? `${window.location.origin}/${restaurant.slug}`
      : '';

  const handleTabChange = (tab: MiMenuTab) => {
    setActiveTab(tab);
    router.replace(`/mi-menu?tab=${tab}`, { scroll: false });
  };

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

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    toast.success('Link copiado');
  };

  const openMenu = () => {
    window.open(menuUrl, '_blank');
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = `menu-qr-${restaurant?.slug || 'code'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleSaveSlug = async () => {
    const candidate = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!candidate || candidate.length < 2) {
      toast.error('La URL debe tener al menos 2 caracteres');
      return;
    }
    setSavingSlug(true);
    try {
      await update({ slug: candidate });
      setSlug(candidate);
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setUser({ ...user, restaurantSlug: candidate });
      }
      toast.success('URL actualizada');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error('Esa URL ya esta en uso. Proba con otra.');
      } else {
        toast.error(
          e instanceof Error ? e.message : 'Error al actualizar la URL',
        );
      }
    } finally {
      setSavingSlug(false);
    }
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
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>
            Mi menú
          </h1>
          <p className="text-on-surface-variant text-lg">
            Personalizá cómo se ve tu menú público y compartilo con tus clientes.
          </p>
        </div>
        {activeTab === 'diseno' && dirty && (
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

      {activeTab === 'diseno' && dirty && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <MaterialIcon name="visibility" size="sm" />
          <span>
            Tenés cambios sin publicar. Tus clientes siguen viendo la versión anterior hasta que publiques.
          </span>
        </div>
      )}

      <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0">
        <div className="space-y-4 min-w-0">
          {/* Tab switcher */}
          <div className="inline-flex w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                aria-current={activeTab === tab.value}
                className={cn(
                  'inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === tab.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground',
                )}
              >
                <MaterialIcon name={tab.icon} size="xs" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ---------- Tab Diseño ---------- */}
          {activeTab === 'diseno' && (
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
          )}

          {/* ---------- Tab Compartir ---------- */}
          {activeTab === 'compartir' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tu link único</CardTitle>
                  <CardDescription>
                    Envialo por WhatsApp, ponelo en tu bio de Instagram o compartilo en redes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-3">
                    <MaterialIcon name="link" size="md" className="text-primary shrink-0" />
                    <span className="text-base font-bold text-on-surface truncate select-all">
                      {menuUrl.replace(/^https?:\/\//, '')}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={copyLink} className="flex-1 gradient-cta text-white font-bold">
                      <MaterialIcon name="content_copy" size="sm" />
                      Copiar link
                    </Button>
                    <Button onClick={openMenu} variant="outline" className="flex-1 font-bold">
                      <MaterialIcon name="open_in_new" size="sm" />
                      Abrir
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Elegí tu URL</CardTitle>
                  <CardDescription>
                    Personalizá la dirección pública de tu menú.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      quiero.menu/
                    </span>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="mi-restaurante"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleSaveSlug}
                      disabled={
                        savingSlug ||
                        !slug.trim() ||
                        slug.trim() === restaurant?.slug
                      }
                    >
                      {savingSlug ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Código QR</CardTitle>
                  <CardDescription>
                    Imprimilo y ponelo en tu local para que tus clientes escaneen y hagan pedidos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div ref={qrRef} className="flex justify-center py-2">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10">
                      <BrandedQr
                        value={menuUrl}
                        size={200}
                        logoUrl={restaurant.logoUrl}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button onClick={downloadQR} variant="outline" className="font-bold">
                      <MaterialIcon name="download" size="sm" />
                      Descargar QR
                    </Button>
                    <Link
                      href="/publicar/imprimir"
                      className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-background px-4 text-sm font-bold transition-colors hover:bg-muted"
                    >
                      <MaterialIcon name="print" size="sm" />
                      Hoja A4 para imprimir
                    </Link>
                  </div>

                  <p className="text-xs text-on-surface-variant text-center">
                    El QR lleva tu color y tu logo. Imprimilo solo o con la hoja A4, que incluye tus
                    datos de contacto para poner en el local.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Preview persistente */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-outline-variant/20 bg-white">
          <div className="flex items-center gap-2 border-b border-outline-variant/10 bg-surface-container-low px-4 py-2.5">
            <MaterialIcon name="visibility" size="sm" className="text-on-surface-variant" />
            <span className="text-xs font-semibold text-on-surface">Vista previa</span>
            <span className="ml-auto truncate text-xs text-on-surface-variant">
              quiero.menu/{slugLive}
            </span>
          </div>
          {slugLive ? (
            <iframe
              ref={previewRef}
              key={slugLive}
              title="Vista previa de tu menú"
              src={`/${encodeURIComponent(slugLive)}?preview=1`}
              className="block h-[75vh] w-full border-0 bg-white"
            />
          ) : (
            <div className="flex h-[75vh] items-center justify-center text-sm text-on-surface-variant">
              Cargando tu menú...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MiMenuPage() {
  return (
    <Suspense fallback={null}>
      <MiMenuPageInner />
    </Suspense>
  );
}
