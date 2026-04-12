'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { MenuCategory, MenuItem, MenuItemVariant, MenuItemOption } from '@/types';

interface MenuState {
  categories: MenuCategory[];
  items: MenuItem[];
  isLoading: boolean;

  fetchCategories: () => Promise<void>;
  createCategory: (data: { name: string; description?: string }) => Promise<MenuCategory>;
  updateCategory: (id: string, data: Partial<MenuCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  createItem: (data: Partial<MenuItem> & { categoryId: string; name: string; basePrice: number }) => Promise<MenuItem>;
  updateItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleAvailability: (id: string) => Promise<void>;

  createVariant: (itemId: string, data: { name: string; priceOverride?: number | null; maxSelections?: number }) => Promise<MenuItemVariant>;
  updateVariant: (id: string, data: Partial<MenuItemVariant>) => Promise<void>;
  deleteVariant: (id: string) => Promise<void>;

  createOption: (itemId: string, data: { name: string; optionGroup: string; priceDelta?: number; variantId?: string | null }) => Promise<MenuItemOption>;
  updateOption: (id: string, data: Partial<MenuItemOption>) => Promise<void>;
  deleteOption: (id: string) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: [],
  items: [],
  isLoading: false,

  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const cats = await api.get<MenuCategory[]>('/menu/categories');
      set({ categories: cats });
    } finally {
      set({ isLoading: false });
    }
  },

  createCategory: async (data) => {
    const cat = await api.post<MenuCategory>('/menu/categories', data);
    set((s) => ({ categories: [...s.categories, cat] }));
    return cat;
  },

  updateCategory: async (id, data) => {
    const updated = await api.patch<MenuCategory>(`/menu/categories/${id}`, data);
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? updated : c)) }));
  },

  deleteCategory: async (id) => {
    await api.delete(`/menu/categories/${id}`);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  createItem: async (data) => {
    const item = await api.post<MenuItem>('/menu/items', data);
    set((s) => ({ items: [...s.items, item] }));
    return item;
  },

  updateItem: async (id, data) => {
    const updated = await api.patch<MenuItem>(`/menu/items/${id}`, data);
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }));
  },

  deleteItem: async (id) => {
    await api.delete(`/menu/items/${id}`);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  toggleAvailability: async (id) => {
    const updated = await api.patch<MenuItem>(`/menu/items/${id}/toggle-availability`);
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }));
  },

  createVariant: async (itemId, data) => {
    return api.post<MenuItemVariant>(`/menu/items/${itemId}/variants`, data);
  },

  updateVariant: async (id, data) => {
    await api.patch(`/menu/variants/${id}`, data);
  },

  deleteVariant: async (id) => {
    await api.delete(`/menu/variants/${id}`);
  },

  createOption: async (itemId, data) => {
    return api.post<MenuItemOption>(`/menu/items/${itemId}/options`, data);
  },

  updateOption: async (id, data) => {
    await api.patch(`/menu/options/${id}`, data);
  },

  deleteOption: async (id) => {
    await api.delete(`/menu/options/${id}`);
  },
}));
