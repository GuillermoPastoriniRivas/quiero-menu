'use client';

import { create } from 'zustand';
import type { DeliveryType } from '@/types';

export interface CartItem {
  menuItemId: string;
  menuItemName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  selectedOptionIds: string[];
  selectedOptionNames: string[];
  notes: string;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryType: DeliveryType;
  deliveryZoneId: string;
  paymentMethod: string;
  notes: string;

  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  setCustomer: (data: Partial<Pick<CartState, 'customerName' | 'customerPhone' | 'customerAddress'>>) => void;
  setDelivery: (data: Partial<Pick<CartState, 'deliveryType' | 'deliveryZoneId'>>) => void;
  setPaymentMethod: (method: string) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  deliveryType: 'pickup' as DeliveryType,
  deliveryZoneId: '',
  paymentMethod: 'efectivo',
  notes: '',

  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  removeItem: (index) => set((s) => ({ items: s.items.filter((_, i) => i !== index) })),
  updateQuantity: (index, quantity) =>
    set((s) => ({
      items: s.items.map((item, i) => (i === index ? { ...item, quantity, unitPrice: item.unitPrice } : item)),
    })),
  setCustomer: (data) => set(data),
  setDelivery: (data) => set(data),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setNotes: (notes) => set({ notes }),
  clear: () =>
    set({
      items: [],
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      deliveryType: 'pickup' as DeliveryType,
      deliveryZoneId: '',
      paymentMethod: 'efectivo',
      notes: '',
    }),
  subtotal: () => get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
}));
