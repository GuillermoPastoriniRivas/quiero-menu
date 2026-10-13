'use client';

import type { CartItem } from '@/stores/cart.store';
import type { DeliveryType, SelectedOption, SelectedOptionInput, OrderComponentInput } from '@/types';
import { activeComponentSlots, componentSelectionIssues, componentSnapshots, optionSelections, productOptionGroups, productUnitPrice, selectedOptionSnapshots, selectionIssues } from '@/lib/menu-options';
import type { ProductWithOptions } from '@/lib/menu-options';

export interface LastOrder {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryType: DeliveryType;
  paymentMethod: string;
  savedAt: string;
}

const keyFor = (slug: string) => `quiero-menu:last-order:${slug}`;

function restoreSelections(options: SelectedOption[], groups: ReturnType<typeof productOptionGroups>): SelectedOptionInput[] {
  return options.map(o => {
    const optionId = o.sourceItemId ?? o.optionId;
    const matches = groups.filter(g => (!o.groupName || g.name === o.groupName) && g.options.some(option => (option.sourceItemId ?? option.id) === optionId));
    return { groupId: o.groupId ?? (matches.length === 1 ? matches[0].groupId : ''), optionId, quantity: o.quantity ?? 1 };
  });
}

/** Recupera la configuración completa o la rechaza; nunca quita extras silenciosamente. */
export function rebuildCartItem(saved: CartItem, catalog: ProductWithOptions[]): CartItem | null {
  const current = catalog.find(i => i.id === saved.menuItemId && i.isAvailable && i.isVisible && i.isOrderable !== false);
  if (!current || !Number.isSafeInteger(saved.quantity) || saved.quantity < 1) return null;
  const variant = current.variants.find(v => v.id === saved.variantId && v.isAvailable !== false);
  if (current.variants.length ? !variant : saved.variantId != null) return null;
  const groups = productOptionGroups(current, variant?.id ?? null);
  const selections: SelectedOptionInput[] = saved.selectedOptions
    ? restoreSelections(saved.selectedOptions, groups)
    : optionSelections(groups, saved.selectedOptionIds ?? []);
  if (!saved.selectedOptions && selections.length !== (saved.selectedOptionIds ?? []).length) return null;
  const components: OrderComponentInput[] = (saved.components ?? []).map(c => {
    const child = catalog.find(i => i.id === c.menuItemId);
    return { slotId: c.slotId, menuItemId: c.menuItemId, variantId: c.variantId,
      selectedOptions: restoreSelections(c.selectedOptions ?? [], child ? productOptionGroups(child, c.variantId) : []) };
  });
  const slots = activeComponentSlots(current, variant?.id ?? null);
  if (selectionIssues(groups, selections).length || componentSelectionIssues(slots, components, catalog).length) return null;
  const options = selectedOptionSnapshots(groups, selections);
  const price = productUnitPrice(current, variant?.id ?? null, selections, components, catalog);
  if (!Number.isFinite(price)) return null;
  return { menuItemId: current.id, menuItemName: current.name, variantId: variant?.id, variantName: variant?.name,
    quantity: saved.quantity, unitPrice: price, selectedOptions: options, selectedOptionIds: [], selectedOptionNames: options.map(o => o.name),
    components: componentSnapshots(slots, components, catalog), notes: saved.notes ?? '' };
}

export function restoreOrderItems(saved: CartItem[], catalog: ProductWithOptions[]): { items: CartItem[]; rejected: number } {
  const items = saved.map(item => rebuildCartItem(item, catalog)).filter((item): item is CartItem => item !== null);
  return { items, rejected: saved.length - items.length };
}

export function saveLastOrder(slug: string, data: LastOrder): void {
  try {
    localStorage.setItem(keyFor(slug), JSON.stringify(data));
  } catch {
    // storage lleno o bloqueado: ignorar
  }
}

export function getLastOrder(slug: string): LastOrder | null {
  try {
    const raw = localStorage.getItem(keyFor(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastOrder;
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastOrder(slug: string): void {
  try {
    localStorage.removeItem(keyFor(slug));
  } catch {
    // ignorar
  }
}
