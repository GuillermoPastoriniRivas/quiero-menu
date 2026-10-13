import type { StorefrontData } from '@/types';

export type ManualCategory = StorefrontData['categories'][number];
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
export async function savePriceChanges(
  changes: PriceChange[],
  update: (change: PriceChange) => Promise<void>,
): Promise<{ saved: PriceChange[]; failed: { change: PriceChange; message: string }[] }> {
  const saved: PriceChange[] = [];
  const failed: { change: PriceChange; message: string }[] = [];
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
