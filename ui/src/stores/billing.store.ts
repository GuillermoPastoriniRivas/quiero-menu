'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { SubscriptionInfo, BillingRecord } from '@/types';

interface BillingState {
  info: SubscriptionInfo | null;
  history: BillingRecord[];
  isLoading: boolean;

  fetch: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  checkout: () => Promise<string>;
  cancel: () => Promise<void>;
  getPortalUrl: () => Promise<string>;
}

export const useBillingStore = create<BillingState>((set) => ({
  info: null,
  history: [],
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<SubscriptionInfo>('/billing/subscription');
      set({ info: data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHistory: async () => {
    const data = await api.get<BillingRecord[]>('/billing/history');
    set({ history: data });
  },

  checkout: async () => {
    const data = await api.post<{ checkoutUrl: string }>('/billing/checkout');
    return data.checkoutUrl;
  },

  cancel: async () => {
    await api.post('/billing/cancel');
  },

  getPortalUrl: async () => {
    const data = await api.get<{ portalUrl: string }>('/billing/portal');
    return data.portalUrl;
  },
}));
