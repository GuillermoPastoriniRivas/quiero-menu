'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Restaurant, OperatingHours } from '@/types';

interface RestaurantState {
  restaurant: Restaurant | null;
  isLoading: boolean;

  fetch: () => Promise<void>;
  update: (data: Partial<Restaurant>) => Promise<void>;
  updateHours: (hours: Omit<OperatingHours, 'id' | 'restaurantId'>[]) => Promise<void>;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurant: null,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<Restaurant>('/restaurants/current');
      set({ restaurant: data });
    } finally {
      set({ isLoading: false });
    }
  },

  update: async (data) => {
    const updated = await api.patch<Restaurant>('/restaurants/current', data);
    set({ restaurant: updated });
  },

  updateHours: async (hours) => {
    await api.patch('/restaurants/current/operating-hours', { hours });
  },
}));
