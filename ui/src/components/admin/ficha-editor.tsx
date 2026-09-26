'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { uploadImageForRestaurant } from '@/lib/upload';
import { currentPosition, geocodeAddress, mapsLink, roundCoordinates, type Coordinates } from '@/lib/geocode';
import { formatWhatsAppDisplay, toWhatsAppNumber } from '@/lib/ar-phone';
import { RESTAURANT_CATEGORIES } from '@/lib/restaurant-categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaterialIcon } from '@/components/ui/material-icon';
import { GalleryEditor } from '@/components/settings/gallery-editor';
import { cn } from '@/lib/utils';
import type { AdminRestaurantDetail, PhotoGalleryImage } from '@/types';

const SELECT =
  'h-10 w-full rounded-xl border-none bg-surface-container-low px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

interface FichaState {
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  coordinates: Coordinates | null;
  photoGallery: PhotoGalleryImage[];
}

function fromDetail(r: AdminRestaurantDetail['restaurant']): FichaState {
  return {
    name: r.name,
    category: r.category,
    description: r.description,
    phone: r.phone,
    address: r.address,
    city: r.city,
    region: r.region,
    coordinates: r.coordinates,
    photoGallery: r.photoGallery,
  };
}

export function FichaEditor({
  restaurant,
  onSaved,
}: {
  restaurant: AdminRestaurantDetail['restaurant'];
  onSaved: () => void;
}) {
  const initial = useMemo(() => fromDetail(restaurant), [restaurant]);
  const [form, setForm] = useState<FichaState>(initial);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const set = (patch: Partial<FichaState>) => setForm((f) => ({ ...f, ...patch }));

  const changes = useMemo(() => {
    const patch: Record<string, unknown> = {};
    (Object.keys(form) as (keyof FichaState)[]).forEach((key) => {
      if (JSON.stringify(form[key]) !== JSON.stringify(initial[key])) patch[key] = form[key];
    });
    if ('category' in patch && !form.category) delete patch.category;
    return patch;
  }, [form, initial]);
  const dirty = Object.keys(changes).length > 0;
  const whatsapp = toWhatsAppNumber(form.phone);

  const locate = async (mode: 'address' | 'device') => {
    setLocating(true);
    try {
      const found =
        mode === 'address'
          ? await geocodeAddress([form.address, form.city, form.region, 'Argentina'])
          : await currentPosition();
      if (!found) {
        toast.error('No encontramos la dirección. Probá completarla o usá tu ubicación estando en el local.');
        return;
      }
      set({ coordinates: roundCoordinates(found) });
      toast.success('Ubicación encontrada. Guardá para aplicarla.');
    } catch {
      toast.error(mode === 'address' ? 'No se pudo buscar la dirección.' : 'No se pudo usar tu ubicación.');
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await api.patch(`/admin/restaurants/${restaurant.id}`, changes);
      toast.success('Ficha actualizada');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar la ficha');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-on-surface-variant">Nombre</Label>
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-on-surface-variant">Rubro</Label>
          <select value={form.category} onChange={(e) => set({ category: e.target.value })} className={SELECT}>
            <option value="">Sin clasificar</option>
            {RESTAURANT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-on-surface-variant">Celular con WhatsApp</Label>
          <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" placeholder="343 412-3456" />
          <p className={cn('text-xs', whatsapp ? 'text-success' : form.phone ? 'text-error' : 'text-on-surface-variant')}>
            {whatsapp
              ? `WhatsApp: ${formatWhatsAppDisplay(whatsapp)}`
              : form.phone
                ? 'No es un celular válido: falta el código de área o sobran números.'
                : 'Sin teléfono, el botón de WhatsApp no aparece.'}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-on-surface-variant">Dirección</Label>
          <Input value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="San Martín 123" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-on-surface-variant">Ciudad</Label>
          <Input value={form.city} onChange={(e) => set({ city: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-on-surface-variant">Provincia o departamento</Label>
          <Input value={form.region} onChange={(e) => set({ region: e.target.value })} placeholder="Entre Ríos" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs font-bold text-on-surface-variant">Descripción</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={2}
            maxLength={500}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 text-sm">
          {form.coordinates ? (
            <p className="font-semibold text-on-surface">
              <MaterialIcon name="location_on" size="sm" className="mr-1 inline text-success" />
              {form.coordinates.lat.toFixed(5)}, {form.coordinates.lng.toFixed(5)}{' '}
              <a
                href={mapsLink(form.coordinates)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:underline"
              >
                Ver
              </a>
              <button
                type="button"
                onClick={() => set({ coordinates: null })}
                className="ml-2 text-xs font-bold text-on-surface-variant hover:text-error"
              >
                Quitar
              </button>
            </p>
          ) : (
            <p className="text-on-surface-variant">Sin punto en el mapa: no aparece en “cerca tuyo”.</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => locate('address')} disabled={locating}>
            <MaterialIcon name="search" size="sm" />
            Por dirección
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => locate('device')} disabled={locating}>
            <MaterialIcon name="my_location" size="sm" />
            Estoy ahí
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant">Fotos de la ficha</Label>
        <GalleryEditor
          value={form.photoGallery}
          onChange={(photoGallery) => set({ photoGallery })}
          disabled={saving}
          uploader={(file) => uploadImageForRestaurant(restaurant.id, file, 'gallery')}
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-outline-variant/20 pt-4">
        {dirty && (
          <Button type="button" variant="ghost" onClick={() => setForm(initial)} disabled={saving}>
            Descartar
          </Button>
        )}
        <Button type="button" onClick={save} disabled={!dirty || saving}>
          {saving ? 'Guardando...' : 'Guardar ficha'}
        </Button>
      </div>
    </div>
  );
}
