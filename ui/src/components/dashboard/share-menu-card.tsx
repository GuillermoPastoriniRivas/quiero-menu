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
/**
 * Acceso directo, desde el Inicio, a las dos cosas que más se usan para difundir:
 * la URL pública (editable) y el QR (se muestra a pedido).
 */
export function ShareMenuCard() {
  const { restaurant, update } = useRestaurantStore();
  const [slugDraft, setSlugDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
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
      setEditing(false);
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

  const download = async () => {
    const ok = await downloadQrPng(qrRef.current, `menu-qr-${restaurant?.slug || 'code'}.png`);
    if (!ok) return;
    trackOwner('qr_downloaded');
    useActivationStore.getState().markShared();
  };

  return (
    <section aria-labelledby="share-menu-heading" className="min-w-0 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MaterialIcon name="share" size="sm" />
        </span>
        <div className="min-w-0">
          <h2 id="share-menu-heading" className="text-sm font-bold text-on-surface">Tu menú público</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">Compartilo con tus clientes.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-surface-container-low p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-on-surface-variant">Tu dirección</p>
            <button type="button" disabled={!restaurant || saving} aria-expanded={editing} aria-controls="share-slug-editor" onClick={() => { setSlugDraft(null); setEditing((value) => !value); }} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-50">
              <MaterialIcon name={editing ? 'close' : 'edit'} size="xs" />
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>
          {editing ? (
            <form id="share-slug-editor" onSubmit={(event) => { event.preventDefault(); void saveSlug(); }} className="mt-1 space-y-2">
              <label htmlFor="share-slug" className="block text-xs text-on-surface-variant">quiero.menu/</label>
              <Input id="share-slug" value={slug} onChange={(event) => setSlugDraft(event.target.value)} placeholder="mi-restaurante" autoFocus disabled={saving} className="h-11 w-full min-w-0 bg-surface-container-lowest" />
              <Button type="submit" disabled={saving || !dirty || !slug.trim()} className="h-11 w-full">{saving ? 'Guardando…' : 'Guardar dirección'}</Button>
            </form>
          ) : (
            <p className="break-all text-sm leading-relaxed text-on-surface"><span className="text-on-surface-variant">quiero.menu/</span><span className="font-bold">{currentSlug || '…'}</span></p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={copy} disabled={!restaurant} className="h-11 min-w-36 flex-1 px-3 font-bold">
            <MaterialIcon name="content_copy" size="sm" />
            Copiar link
          </Button>
          <Button variant="outline" disabled={!restaurant} aria-expanded={showQr} aria-controls="share-menu-qr" onClick={() => setShowQr((v) => !v)} className="h-11 min-w-36 flex-1 px-3 font-bold">
            <MaterialIcon name="qr_code_2" size="sm" />
            {showQr ? 'Ocultar QR' : 'Ver QR'}
          </Button>
        </div>

        {restaurant && (
          <a
            href={`/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/40 px-4 text-sm font-bold text-on-surface transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <MaterialIcon name="visibility" size="sm" />
            Ver mi menú
            <MaterialIcon name="arrow_outward" size="sm" className="text-outline" />
          </a>
        )}

        {showQr && (
          <div id="share-menu-qr" className="flex flex-col items-center gap-3 rounded-2xl border border-outline-variant/25 bg-white p-3">
            <div ref={qrRef}>
              <BrandedQr value={menuUrl} size={160} logoUrl={restaurant?.logoUrl} />
            </div>
            <Button onClick={download} variant="outline" className="h-11 w-full font-bold">
              <MaterialIcon name="download" size="sm" />
              Descargar QR
            </Button>
            <Link
              href="/publicar/imprimir"
              onClick={() => useActivationStore.getState().markShared()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/40 px-4 text-sm font-bold text-on-surface transition-colors hover:border-primary/40"
            >
              <MaterialIcon name="print" size="sm" />
              Imprimir
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
