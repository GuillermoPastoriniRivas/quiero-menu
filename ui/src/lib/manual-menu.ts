import type { EditorCategory } from '@/components/menu/editor-model';

export type ManualCategory = EditorCategory;
export type ManualEntry = { category: ManualCategory; item: ManualCategory['items'][number] };
export type PriceChange = { id: string; name: string; basePrice: number };

export function manualEntries(categories: ManualCategory[]): ManualEntry[] {
  return categories.flatMap((category) => category.items.map((item) => ({ category, item })));
}

// Shared flavors aren't products with missing prices. Sizes have their own prices.
export function canEditBasePrice({ category, item }: ManualEntry): boolean {
  return !category.isOptionSource && item.isOrderable !== false && item.itemType !== 'variant' && item.variants.length === 0;
}

export function priceChanges(entries: ManualEntry[], drafts: Record<string, string>): PriceChange[] {
  return entries.filter(canEditBasePrice).flatMap(({ item }) => {
    const draft = drafts[item.id];
    if (draft === undefined) return [];
    if (!/^\d+$/.test(draft) || !Number.isSafeInteger(Number(draft))) {
      throw new Error(`Revisá el precio de ${item.name}. Usá un número igual o mayor a cero.`);
    }
    const basePrice = Number(draft);
    return basePrice === item.basePrice ? [] : [{ id: item.id, name: item.name, basePrice }];
  });
}

// These endpoints aren't transactional: keep failed drafts and never retry successes.
export async function savePriceChanges<T extends PriceChange>(
  changes: T[],
  update: (change: T) => Promise<void>,
): Promise<{ saved: T[]; failed: { change: T; message: string }[] }> {
  const saved: T[] = [];
  const failed: { change: T; message: string }[] = [];
  for (const change of changes) {
    try {
      await update(change);
      saved.push(change);
    } catch (error) {
      failed.push({ change, message: error instanceof Error ? error.message : 'No se pudo guardar.' });
    }
  }
  return { saved, failed };
}

export type MaintenanceEntry = {
  key: string;
  kind: 'item' | 'variant' | 'option' | 'source';
  id: string;
  name: string;
  context: string;
  categoryId: string;
  itemId: string;
  price: number;
  available: boolean;
  shared: boolean;
  priceEditable?: boolean;
};
/** One authoritative row per price/availability target, without synthetic source options. */
export function maintenanceEntries(categories: ManualCategory[]): MaintenanceEntry[] {
  return categories.flatMap((category) => category.items.flatMap((item) => {
    const shared = Boolean(category.isOptionSource);
    const context = `${category.name}${!category.isVisible || !item.isVisible ? ' · oculto en la carta' : ''}`;
    const base = { categoryId: category.id, itemId: item.id, shared };
    const rows: MaintenanceEntry[] = [];
    if (shared || item.variants.length === 0) rows.push({ ...base, kind: shared ? 'source' : 'item', key: `${shared ? 'source' : 'item'}:${item.id}`, id: item.id, name: item.name, context: shared ? `${context} · adicional compartido` : context, price: item.basePrice, available: item.isAvailable });
    else rows.push({ ...base, kind: 'item', key: `item:${item.id}`, id: item.id, name: item.name, context: `${context} · producto con presentaciones`, price: item.basePrice, available: item.isAvailable, priceEditable: false });
    if (!shared) {
      for (const variant of item.variants) rows.push({ ...base, kind: 'variant', key: `variant:${variant.id}`, id: variant.id, name: variant.name || 'Presentación sin nombre', context: `${item.name} · ${context}${!item.isAvailable ? ' · producto agotado' : ''}`, price: variant.priceOverride ?? item.basePrice, available: variant.isAvailable !== false });
      for (const option of item.options.filter((o) => !o.sourceItemId)) rows.push({ ...base, kind: 'option', key: `option:${option.id}`, id: option.id, name: option.name, context: `${item.name} · ${option.optionGroup} · ${option.variantId ? item.variants.find((v) => v.id === option.variantId)?.name ?? 'Presentación pendiente' : 'todas las presentaciones'}`, price: option.priceDelta, available: option.isAvailable });
    }
    return rows;
  }));
}

export function maintenancePriceChanges(entries: MaintenanceEntry[], drafts: Record<string, string>) {
  return entries.flatMap((entry) => {
    if (entry.priceEditable === false) return [];
    const draft = drafts[entry.key];
    if (draft === undefined) return [];
    if (!/^\d+$/.test(draft) || !Number.isSafeInteger(Number(draft))) throw new Error(`Revisá el precio de ${entry.name}. Usá un entero igual o mayor a cero.`);
    return Number(draft) === entry.price ? [] : [{ id: entry.id, name: entry.name, basePrice: Number(draft), kind: entry.kind, key: entry.key }];
  });
}
