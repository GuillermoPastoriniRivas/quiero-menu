'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { MaterialIcon } from '@/components/ui/material-icon';
import { componentIssue, type EditorCategory, type EditorItem, type PromoComponent } from './editor-model';

const selectClass = 'h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm';
export function PromoComponentsDialog({ item, categories, onClose, onSave }: {
  item: EditorItem;
  categories: EditorCategory[];
  onClose: () => void;
  onSave: (components: PromoComponent[]) => Promise<void>;
}) {
  const [slots, setSlots] = useState<PromoComponent[]>(() => (item.components ?? []).map((s) => ({ ...s, choices: s.choices.map((c) => ({ ...c })) })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const catalog = categories.filter((c) => !c.isOptionSource).flatMap((c) => c.items)
    .filter((p) => p.id !== item.id && p.restaurantId === item.restaurantId && p.isOrderable !== false && !p.components?.length);
  const offers = catalog.flatMap<{ menuItemId: string; variantId: string | null; label: string }>((p) => p.variants.length
    ? p.variants.map((v) => ({ menuItemId: p.id, variantId: v.id, label: `${p.name} · ${v.name || 'Presentación sin nombre'}${!p.isAvailable || v.isAvailable === false ? ' · agotado' : ''}${!p.isVisible ? ' · oculto' : ''}` }))
    : [{ menuItemId: p.id, variantId: null, label: `${p.name}${!p.isAvailable ? ' · agotado' : ''}${!p.isVisible ? ' · oculto' : ''}` }]);
  const issue = componentIssue(slots, item, categories);
  const patch = (slotId: string, changes: Partial<PromoComponent>) => setSlots((current) => current.map((s) => s.slotId === slotId ? { ...s, ...changes } : s));
  const save = async () => {
    if (lock.current || issue) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await onSave(slots.map((s, index) => ({ ...s, name: s.name.trim(), displayOrder: index })));
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar. Conservamos los componentes.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !lock.current) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>Qué incluye {item.name}</DialogTitle><DialogDescription>Componentes fijos o elecciones independientes. Dos bebidas pueden elegir el mismo producto, con sus propios tamaños y extras.</DialogDescription></DialogHeader>
      <p className="rounded-xl bg-primary/5 p-3 text-sm">El precio de la promo se configura en el producto o su presentación. Acá solo se suman los <strong>precios extra explícitos</strong>, no los precios de venta de los productos incluidos.</p>
      <div className="space-y-4">
        {slots.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay componentes. Una promo cerrada puede seguir siendo un producto simple.</p>}
        {slots.map((slot, slotIndex) => <fieldset key={slot.slotId} disabled={busy} className="min-w-0 space-y-3 rounded-2xl border p-3 sm:p-4 disabled:opacity-60">
          <legend className="px-1 text-sm font-bold">Componente {slotIndex + 1}</legend>
          <div className="flex gap-2"><Input aria-label={`Nombre del componente ${slotIndex + 1}`} value={slot.name} onChange={(e) => patch(slot.slotId, { name: e.target.value })} placeholder="Bebida 1, bebida 2, medialunas…" /><Button type="button" variant="ghost" size="icon-sm" aria-label={`Quitar componente ${slotIndex + 1}`} onClick={() => setSlots((current) => current.filter((s) => s.slotId !== slot.slotId))}><MaterialIcon name="delete" size="sm" /></Button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">Cantidad incluida<Input type="number" min="1" step="1" value={slot.quantity || ''} onChange={(e) => patch(slot.slotId, { quantity: Number(e.target.value) })} /></label>
            <label className="space-y-1 text-sm">Se ofrece en<select className={selectClass} value={slot.parentVariantId ?? ''} onChange={(e) => patch(slot.slotId, { parentVariantId: e.target.value || null })}><option value="">Todas las presentaciones de la promo</option>{item.variants.map((v) => <option key={v.id} value={v.id}>{v.name || 'Presentación sin nombre'}</option>)}</select></label>
          </div>
          <p className="text-xs text-muted-foreground">Una elección = componente fijo. Varias = el cliente elige. Para dos bebidas personalizadas por separado, creá Bebida 1 y Bebida 2 con cantidad 1.</p>
          {slot.choices.map((choice, index) => {
            const key = JSON.stringify([choice.menuItemId, choice.variantId]);
            const known = offers.some((o) => JSON.stringify([o.menuItemId, o.variantId]) === key);
            return <div key={index} className="space-y-2 rounded-xl bg-muted/50 p-3">
              <label className="block space-y-1 text-sm">Producto y presentación<select aria-label={`Elección ${index + 1} de ${slot.name}`} className={selectClass} value={key} onChange={(e) => {
                const offer = offers.find((o) => JSON.stringify([o.menuItemId, o.variantId]) === e.target.value);
                if (offer) patch(slot.slotId, { choices: slot.choices.map((c, i) => i === index ? { menuItemId: offer.menuItemId, variantId: offer.variantId, priceDelta: c.priceDelta } : c) });
              }}>{!known && <option value={key}>Elegí un producto válido (referencia pendiente)</option>}{offers.map((offer) => <option key={JSON.stringify([offer.menuItemId, offer.variantId])} value={JSON.stringify([offer.menuItemId, offer.variantId])}>{offer.label}</option>)}</select></label>
              <div className="flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-xs">Precio extra por unidad<MoneyInput value={String(choice.priceDelta)} onChange={(value) => patch(slot.slotId, { choices: slot.choices.map((c, i) => i === index ? { ...c, priceDelta: Number(value || '0') } : c) })} aria-label={`Extra de elección ${index + 1} de ${slot.name}`} className="w-24" /></label><Button type="button" size="sm" variant="ghost" onClick={() => patch(slot.slotId, { choices: slot.choices.filter((_, i) => i !== index) })}>Quitar elección</Button></div>
            </div>;
          })}
          <Button type="button" variant="outline" size="sm" disabled={!offers.length} onClick={() => {
            const offer = offers.find((o) => !slot.choices.some((c) => c.menuItemId === o.menuItemId && c.variantId === o.variantId));
            if (offer) patch(slot.slotId, { choices: [...slot.choices, { menuItemId: offer.menuItemId, variantId: offer.variantId, priceDelta: 0 }] });
          }}>Agregar elección del catálogo</Button>
        </fieldset>)}
        <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => setSlots((current) => [...current, { slotId: crypto.randomUUID(), name: '', quantity: 1, parentVariantId: null, displayOrder: current.length, choices: [] }])}><MaterialIcon name="add" size="sm" />Agregar componente</Button>
        {!offers.length && <p className="text-sm text-muted-foreground">Primero cargá los productos que incluye la promo. No se permiten promos dentro de promos ni listas de sabores como productos.</p>}
        {(issue || error) && <p role="alert" className="text-sm text-destructive">{issue || error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="button" disabled={busy || !!issue} onClick={save}>{busy ? 'Guardando…' : 'Guardar componentes'}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}
