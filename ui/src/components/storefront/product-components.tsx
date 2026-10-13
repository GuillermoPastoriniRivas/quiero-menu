"use client";

import { useId } from 'react';
import type { MenuItemComponent, OrderComponentInput } from '@/types';
import { componentChoiceProduct, productOptionGroups } from '@/lib/menu-options';
import type { ProductWithOptions } from '@/lib/menu-options';
import { formatCurrency } from '@/lib/format';
import { ProductOptions } from './product-options';

export function ProductComponents({ slots, selections, onChange, catalog, currency }: {
  slots: MenuItemComponent[];
  selections: OrderComponentInput[];
  onChange: (selections: OrderComponentInput[]) => void;
  catalog: ProductWithOptions[];
  currency: string;
}) {
  const id = useId();
  return <div className="space-y-6">{slots.map(slot => {
    const selected = selections.find(s => s.slotId === slot.slotId);
    const choice = slot.choices.find(c => c.menuItemId === selected?.menuItemId && c.variantId === (selected?.variantId ?? null));
    const child = choice && componentChoiceProduct(choice, catalog);
    return <fieldset key={slot.slotId} className="space-y-3 rounded-xl border border-outline-variant/30 p-4">
      <legend className="px-1 text-sm font-semibold">{slot.name} · {slot.quantity}× <span className="font-normal">Obligatorio</span></legend>
      <div className="space-y-2">{slot.choices.map(c => {
        const item = catalog.find(i => i.id === c.menuItemId);
        const available = !!componentChoiceProduct(c, catalog);
        const variant = item?.variants.find(v => v.id === c.variantId);
        const checked = selected?.menuItemId === c.menuItemId && (selected.variantId ?? null) === c.variantId;
        return <label key={JSON.stringify([c.menuItemId, c.variantId])}
          className={`flex min-h-12 items-center gap-3 rounded-xl bg-surface-container-low p-3 text-sm ${available ? 'cursor-pointer' : 'opacity-50'}`}>
          <input type="radio" name={`${id}-${slot.slotId}`} checked={checked} disabled={!available} className="h-5 w-5 accent-primary"
            onChange={() => { if (!checked) onChange([...selections.filter(s => s.slotId !== slot.slotId), { slotId: slot.slotId, menuItemId: c.menuItemId, variantId: c.variantId, selectedOptions: [] }]); }} />
          <span className="flex-1">{item?.name ?? 'Producto no disponible'}{variant ? ` (${variant.name})` : ''}{!available && <span className="ml-2 text-xs">Agotado</span>}</span>
          <span>{c.priceDelta === 0 ? 'Incluido' : `${c.priceDelta > 0 ? '+' : ''}${formatCurrency(c.priceDelta, currency)} / unidad`}</span>
        </label>;
      })}</div>
      {child && selected && <ProductOptions groups={productOptionGroups(child, choice!.variantId)} selections={selected.selectedOptions ?? []} currency={currency}
        onChange={options => onChange(selections.map(s => s.slotId === slot.slotId ? { ...s, selectedOptions: options } : s))} />}
    </fieldset>;
  })}</div>;
}
