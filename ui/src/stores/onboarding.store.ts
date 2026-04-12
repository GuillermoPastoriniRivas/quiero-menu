'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { MenuVisionOutput, BulkImportResult } from '@/types';

type Step = 'upload' | 'analyzing' | 'preview' | 'importing' | 'done';

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
  aiResult: null,
  importResult: null,
  error: null,

  setImages: (files) => set({ images: files, error: null }),
  setText: (text) => set({ additionalText: text }),
  updateResult: (result) => set({ aiResult: result }),

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

      const result = await api.postFormData<MenuVisionOutput>('/onboarding/analyze', formData);
      set({ aiResult: result, step: 'preview' });
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
    } catch (e: any) {
      set({ error: e.message || 'Error al importar el menu', step: 'preview' });
    }
  },

  reset: () => set({
    step: 'upload',
    images: [],
    additionalText: '',
    aiResult: null,
    importResult: null,
    error: null,
  }),
}));
