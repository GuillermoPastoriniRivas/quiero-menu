'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { MenuVisionOutput, BulkImportResult } from '@/types';

type Step = 'upload' | 'analyzing' | 'preview' | 'importing' | 'done';

const STORAGE_KEY = 'qm-pending-menu';

function loadPendingMenu(): MenuVisionOutput | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePendingMenu(result: MenuVisionOutput | null) {
  if (typeof window === 'undefined') return;
  try {
    if (result) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage puede fallar en modo privado; el estado en memoria sigue vivo.
  }
}

interface OnboardingState {
  step: Step;
  images: File[];
  additionalText: string;
  aiResult: MenuVisionOutput | null;
  importResult: BulkImportResult | null;
  error: string | null;

  setImages: (files: File[]) => void;
  setText: (text: string) => void;
  updateResult: (result: MenuVisionOutput) => void;
  analyzeMenu: () => Promise<void>;
  importMenu: () => Promise<void>;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  step: 'upload',
  images: [],
  additionalText: '',
  aiResult: loadPendingMenu(),
  importResult: null,
  error: null,

  setImages: (files) => set({ images: files, error: null }),
  setText: (text) => set({ additionalText: text }),
  updateResult: (result) => {
    set({ aiResult: result });
    savePendingMenu(result);
  },

  analyzeMenu: async () => {
    const { images, additionalText } = get();
    set({ step: 'analyzing', error: null });

    try {
      const formData = new FormData();
      for (const img of images) {
        formData.append('images', img);
      }
      if (additionalText.trim()) {
        formData.append('text', additionalText.trim());
      }
      formData.append('currency', 'ARS');

      const result = await api.postFormData<MenuVisionOutput>('/onboarding/analyze', formData);
      set({ aiResult: result, step: 'preview' });
      savePendingMenu(result);
    } catch (e: any) {
      set({ error: e.message || 'Error al analizar el menu', step: 'upload' });
    }
  },

  importMenu: async () => {
    const { aiResult } = get();
    if (!aiResult) return;

    set({ step: 'importing', error: null });

    try {
      const res = await api.post<{ success: boolean; counts: BulkImportResult }>('/onboarding/import', aiResult);
      set({ importResult: res.counts, step: 'done' });
      savePendingMenu(null);
    } catch (e: any) {
      set({ error: e.message || 'Error al importar el menu', step: 'preview' });
    }
  },

  reset: () => {
    savePendingMenu(null);
    set({
      step: 'upload',
      images: [],
      additionalText: '',
      aiResult: null,
      importResult: null,
      error: null,
    });
  },
}));