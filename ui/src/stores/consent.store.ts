'use client';

import { create } from 'zustand';

export type ConsentStatus = 'granted' | 'denied' | 'unknown';

const CONSENT_KEY = 'qm:cookie-consent';

function readConsent(): ConsentStatus {
  if (typeof window === 'undefined') return 'unknown';
  const raw = localStorage.getItem(CONSENT_KEY);
  return raw === 'granted' ? 'granted' : raw === 'denied' ? 'denied' : 'unknown';
}

interface ConsentState {
  status: ConsentStatus;
  hydrate: () => void;
  setConsent: (status: 'granted' | 'denied') => void;
}

export const useConsentStore = create<ConsentState>((set) => ({
  status: 'unknown',
  hydrate: () => set({ status: readConsent() }),
  setConsent: (status) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONSENT_KEY, status);
    }
    set({ status });
  },
}));