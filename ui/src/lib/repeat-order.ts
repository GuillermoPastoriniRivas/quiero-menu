'use client';

import type { CartItem } from '@/stores/cart.store';
import type { DeliveryType } from '@/types';

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
    if (!parsed.items || parsed.items.length === 0) return null;
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
