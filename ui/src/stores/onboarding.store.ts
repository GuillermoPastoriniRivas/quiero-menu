'use client';

import { create } from 'zustand';
import imageCompression from 'browser-image-compression';
import { api } from '@/lib/api';
import { RESTAURANT_CATEGORIES } from '@/lib/restaurant-categories';
import type { MenuVisionOutput, BulkImportResult } from '@/types';

export type OnboardingStep = 'carta' | 'leyendo' | 'revisar' | 'local' | 'cuenta' | 'creando' | 'listo';

export interface LocalDraft {
  name: string;
  city: string;
  category: string;
}

const MENU_KEY = 'qm-pending-menu';
const LOCAL_KEY = 'qm-pending-local';
const MAX_PHOTOS = 4;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const KNOWN_CATEGORIES = new Set(RESTAURANT_CATEGORIES.map((c) => c.value));

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function safeCategory(value?: string | null): string | undefined {
  return value && KNOWN_CATEGORIES.has(value) ? value : undefined;
}

export function cleanMenu(menu: MenuVisionOutput): MenuVisionOutput {
  const categories = menu.categories
    .map((category) => ({
      ...category,
      name: category.name.trim() || 'Otros',
      items: category.items
        .filter((item) => item.name.trim())
        .map((item) => ({
          ...item,
          name: item.name.trim(),
          basePrice: Number.isFinite(item.basePrice) ? Math.max(0, item.basePrice) : 0,
        })),
    }))
    .filter((category) => category.items.length > 0);
  return {
    ...menu,
    restaurant: { ...menu.restaurant, category: safeCategory(menu.restaurant.category) },
    categories,
  };
}

export function countItems(menu: MenuVisionOutput | null): number {
  return menu ? menu.categories.reduce((sum, c) => sum + c.items.length, 0) : 0;
}

async function prepareImage(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2200,
      fileType: 'image/jpeg',
      initialQuality: 0.85,
      useWebWorker: true,
    });
    return new File([compressed], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    if (ACCEPTED.includes(file.type)) return file;
    throw new Error('Ese formato de foto no lo podemos leer. Probá con una captura de pantalla o una foto JPG.');
  }
}

interface OnboardingState {
  ready: boolean;
  step: OnboardingStep;
  photos: File[];
  note: string;
  menu: MenuVisionOutput | null;
  local: LocalDraft;
  imported: BulkImportResult | null;
  error: string | null;

  go: (step: OnboardingStep) => void;
  addPhotos: (files: FileList | File[]) => Promise<void>;
  removePhoto: (index: number) => void;
  setNote: (note: string) => void;
  setMenu: (menu: MenuVisionOutput) => void;
  setLocal: (patch: Partial<LocalDraft>) => void;
  analyze: () => Promise<void>;
  importMenu: () => Promise<BulkImportResult | null>;
  resume: (mode: 'photo' | 'manual') => void;
  reset: () => void;
}

const EMPTY_LOCAL: LocalDraft = { name: '', city: '', category: '' };

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ready: false,
  step: 'carta',
  photos: [],
  note: '',
  menu: null,
  local: EMPTY_LOCAL,
  imported: null,
  error: null,

  go: (step) => set({ step, error: null }),

  addPhotos: async (files) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/') || f.name.match(/\.(heic|heif)$/i));
    const room = MAX_PHOTOS - get().photos.length;
    if (room <= 0) {
      set({ error: `Hasta ${MAX_PHOTOS} fotos por carta.` });
      return;
    }
    try {
      const prepared = await Promise.all(incoming.slice(0, room).map(prepareImage));
      set((s) => ({ photos: [...s.photos, ...prepared], error: null }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'No pudimos procesar la foto.' });
    }
  },

  removePhoto: (index) => set((s) => ({ photos: s.photos.filter((_, i) => i !== index) })),
  setNote: (note) => set({ note }),

  setMenu: (menu) => {
    set({ menu });
    write(MENU_KEY, menu);
  },

  setLocal: (patch) => {
    const local = { ...get().local, ...patch };
    set({ local });
    write(LOCAL_KEY, local);
  },

  analyze: async () => {
    const { photos, note } = get();
    if (photos.length === 0) return;
    set({ step: 'leyendo', error: null });
    try {
      const form = new FormData();
      for (const photo of photos) form.append('images', photo);
      if (note.trim()) form.append('text', note.trim());
      form.append('currency', 'ARS');
      const result = await api.postFormData<MenuVisionOutput>('/onboarding/analyze', form);
      const menu = { ...result, restaurant: { ...result.restaurant, category: safeCategory(result.restaurant.category) } };
      const local: LocalDraft = {
        name: menu.restaurant.name?.trim() || get().local.name,
        city: menu.restaurant.city?.trim() || get().local.city,
        category: menu.restaurant.category || get().local.category,
      };
      set({ menu, local, step: 'revisar' });
      write(MENU_KEY, menu);
      write(LOCAL_KEY, local);
    } catch (e) {
      set({
        step: 'carta',
        error: e instanceof Error ? e.message : 'No pudimos leer la carta. Probá de nuevo o cargala a mano.',
      });
    }
  },

  importMenu: async () => {
    const { menu, local } = get();
    if (!menu) return null;
    const cleaned = cleanMenu({
      ...menu,
      restaurant: {
        ...menu.restaurant,
        name: local.name.trim() || menu.restaurant.name,
        city: local.city.trim() || menu.restaurant.city,
        category: local.category || menu.restaurant.category,
      },
    });
    if (cleaned.categories.length === 0) return null;
    const res = await api.post<{ success: boolean; counts: BulkImportResult }>('/onboarding/import', cleaned);
    set({ imported: res.counts });
    write(MENU_KEY, null);
    return res.counts;
  },

  resume: (mode) => {
    const menu = read<MenuVisionOutput>(MENU_KEY);
    const local = read<LocalDraft>(LOCAL_KEY) ?? EMPTY_LOCAL;
    if (mode === 'manual') {
      set({ ready: true, step: 'local', menu: null, local, photos: [], imported: null, error: null });
      return;
    }
    set({ ready: true, step: menu ? 'revisar' : 'carta', menu, local, photos: [], imported: null, error: null });
  },

  reset: () => {
    write(MENU_KEY, null);
    write(LOCAL_KEY, null);
    set({ ready: false, step: 'carta', photos: [], note: '', menu: null, local: EMPTY_LOCAL, imported: null, error: null });
  },
}));
