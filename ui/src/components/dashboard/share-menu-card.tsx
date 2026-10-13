'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { useAuthStore } from '@/stores/auth.store';
import { useActivationStore } from '@/stores/activation.store';
import { BrandedQr } from '@/components/publicar/branded-qr';
import { downloadQrPng } from '@/lib/qr-download';
import { attributedUrl, trackOwner } from '@/lib/behavior';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WhatsAppIcon } from '@/components/ui/brand-icons';

const outlineLink =
  'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant/40 px-4 text-sm font-bold text-on-surface transition-colors hover:border-primary/40';

/**
 * Acceso directo, desde el Inicio, a las dos cosas que más se usan para difundir:
 * la URL pública (editable) y el QR (se muestra a pedido).
 */
export function ShareMenuCard() {
  const { restaurant, update } = useRestaurantStore();
  const [slugDraft, setSlugDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const currentSlug = restaurant?.slug ?? '';
  const slug = slugDraft ?? currentSlug;
  const dirty = slug.trim() !== currentSlug;
  const menuUrl =
    typeof window !== 'undefined' && restaurant ? `${window.location.origin}/${restaurant.slug}` : '';

  const saveSlug = async () => {
    const candidate = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (candidate.length < 2) {
      toast.error('La URL debe tener al menos 2 caracteres');
      return;
    }
    setSaving(true);
    try {
      await update({ slug: candidate });
      setSlugDraft(null);
      const user = useAuthStore.getState().user;
      if (user) useAuthStore.getState().setUser({ ...user, restaurantSlug: candidate });
      toast.success('URL actualizada');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error('Esa URL ya está en uso. Probá con otra.');
      } else {
        toast.error(e instanceof Error ? e.message : 'Error al actualizar la URL');
      }
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(attributedUrl(menuUrl, 'ig'));
      trackOwner('link_shared', { method: 'copy' });
      useActivationStore.getState().markShared();
      toast.success('Link copiado. Pegalo en tu bio o mandalo por WhatsApp.');
    } catch {
      toast.error('No se pudo copiar el link.');
    }
  };

  const shareWhatsApp = restaurant
    ? `https://wa.me/?text=${encodeURIComponent(`Mirá la carta de ${restaurant.name} y hacé tu pedido acá: ${attributedUrl(menuUrl, 'wa')}`)}`
    : '';

  const download = async () => {
    const ok = await downloadQrPng(qrRef.current, `menu-qr-${restaurant?.slug || 'code'}.png`);
    if (!ok) return;
    trackOwner('qr_downloaded');
    useActivationStore.getState().markShared();
  };

  return (
    <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MaterialIcon name="share" size="sm" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface">Tu menú público</p>
          <p className="text-xs text-on-surface-variant">Tu link y el QR para imprimir.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="share-slug" className="text-sm font-semibold text-on-surface">
            Tu dirección
          </label>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-on-surface-variant">quiero.menu/</span>
            <Input
              id="share-slug"
              value={slug}
              onChange={(e) => setSlugDraft(e.target.value)}
              placeholder="mi-restaurante"
              className="h-11 min-w-0 flex-1"
            />
            {dirty && (
              <Button onClick={saveSlug} disabled={saving || !slug.trim()} className="h-11 shrink-0">
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={copy} className="font-bold">
            <MaterialIcon name="content_copy" size="sm" />
            Copiar link
          </Button>
          <a
            href={shareWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => useActivationStore.getState().markShared()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-sm font-bold text-white transition-colors hover:bg-[#1EBE5A]"
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp
          </a>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setShowQr((v) => !v)} className="font-bold">
            <MaterialIcon name="qr_code_2" size="sm" />
            {showQr ? 'Ocultar QR' : 'Ver QR'}
          </Button>
          <Link href="/publicar/imprimir" onClick={() => useActivationStore.getState().markShared()} className={outlineLink}>
            <MaterialIcon name="print" size="sm" />
            Imprimir
          </Link>
        </div>

        {restaurant && (
          <a
            href={`/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            Ver mi menú
            <MaterialIcon name="arrow_outward" size="sm" />
          </a>
        )}

        {showQr && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-outline-variant/25 bg-white p-4">
            <div ref={qrRef}>
              <BrandedQr value={menuUrl} size={160} logoUrl={restaurant?.logoUrl} />
            </div>
            <Button onClick={download} variant="outline" className="w-full font-bold">
              <MaterialIcon name="download" size="sm" />
              Descargar QR
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
