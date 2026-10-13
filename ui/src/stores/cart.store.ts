'use client';

import { create } from 'zustand';
import type { DeliveryType, CouponValidation, SelectedOption, OrderItemComponent, StorefrontOrderItemInput } from '@/types';

export interface CartItem {
  menuItemId: string;
  menuItemName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  selectedOptionIds: string[];
  selectedOptionNames: string[];
  selectedOptions?: SelectedOption[];
  components?: OrderItemComponent[];
  notes: string;
}

const canonicalOptions = (options: SelectedOption[] = []) => options.map(o => [o.groupId ?? '', o.sourceItemId ?? o.optionId, o.quantity ?? 1])
  .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

export function cartItemIdentity(item: CartItem): string {
  const options = item.selectedOptions ? canonicalOptions(item.selectedOptions) : [...item.selectedOptionIds].sort();
  const components = (item.components ?? []).map(c => [c.slotId, c.menuItemId, c.variantId ?? null, c.quantity, canonicalOptions(c.selectedOptions)])
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return JSON.stringify([item.menuItemId, item.variantId ?? null, options, components, item.notes]);
}

export function serializeCartItem(item: CartItem): StorefrontOrderItemInput {
  const options = item.selectedOptions?.filter(o => (o.quantity ?? 1) > 0).map(o => ({ groupId: o.groupId!, optionId: o.sourceItemId ?? o.optionId, quantity: o.quantity ?? 1 }));
  return {
    menuItemId: item.menuItemId, variantId: item.variantId, quantity: item.quantity, notes: item.notes,
    ...(options?.length ? { selectedOptions: options } : !item.selectedOptions && item.selectedOptionIds.length ? { selectedOptionIds: item.selectedOptionIds } : {}),
    ...((item.components ?? []).length ? { components: item.components!.map(c => ({ slotId: c.slotId, menuItemId: c.menuItemId, variantId: c.variantId ?? undefined,
      ...(c.selectedOptions.length ? { selectedOptions: c.selectedOptions.map(o => ({ groupId: o.groupId!, optionId: o.sourceItemId ?? o.optionId, quantity: o.quantity ?? 1 })) } : {}) })) } : {}),
  };
}

interface CartState {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLatitude: number | null;
  customerLongitude: number | null;
  deliveryType: DeliveryType;
  paymentMethod: string;
  receiptUrl: string | null;
  notes: string;
  couponCode: string | null;
  appliedCoupon: CouponValidation | null;

  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  replaceItems: (items: CartItem[]) => void;
  setCustomer: (data: Partial<Pick<CartState, 'customerName' | 'customerPhone' | 'customerAddress'>>) => void;
  setLocation: (lat: number | null, lng: number | null) => void;
  setDelivery: (data: Partial<Pick<CartState, 'deliveryType'>>) => void;
  setPaymentMethod: (method: string) => void;
  setReceiptUrl: (url: string | null) => void;
  setNotes: (notes: string) => void;
  setCoupon: (code: string | null, applied: CouponValidation | null) => void;
  clear: () => void;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  customerLatitude: null,
  customerLongitude: null,
  deliveryType: 'pickup' as DeliveryType,
  paymentMethod: 'efectivo',
  receiptUrl: null,
  notes: '',
  couponCode: null,
  appliedCoupon: null,

  addItem: (item) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.unitPrice)) return;
    set(s => {
      const identity = cartItemIdentity(item);
      const index = s.items.findIndex(i => cartItemIdentity(i) === identity);
      if (index < 0) return { items: [...s.items, item] };
      return { items: s.items.map((current, i) => i === index ? { ...item, quantity: current.quantity + item.quantity } : current) };
    });
  },
  removeItem: (index) => set((s) => ({ items: s.items.filter((_, i) => i !== index) })),
  updateQuantity: (index, quantity) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    set(s => ({ items: s.items.map((item, i) => i === index ? { ...item, quantity } : item) }));
  },
  replaceItems: (items) => set({ items }),
  setCustomer: (data) => set(data),
  setLocation: (lat, lng) => set({ customerLatitude: lat, customerLongitude: lng }),
  setDelivery: (data) => set(data),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setReceiptUrl: (url) => set({ receiptUrl: url }),
  setNotes: (notes) => set({ notes }),
  setCoupon: (code, applied) => set({ couponCode: code, appliedCoupon: applied }),
  clear: () =>
    set({
      items: [],
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customerLatitude: null,
      customerLongitude: null,
      deliveryType: 'pickup' as DeliveryType,
      paymentMethod: 'efectivo',
      receiptUrl: null,
      notes: '',
      couponCode: null,
      appliedCoupon: null,
    }),
  subtotal: () => get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
}));
