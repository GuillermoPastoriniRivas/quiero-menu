"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type { ActivationStatus } from "@/types";

interface ActivationState {
  status: ActivationStatus | null;
  loading: boolean;
  fetch: () => Promise<void>;
  markShared: () => void;
  reset: () => void;
}

export const useActivationStore = create<ActivationState>((set, get) => ({
  status: null,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const status = await api.get<ActivationStatus>("/restaurants/current/activation");
      set({ status });
    } catch {
      set({ status: null });
    } finally {
      set({ loading: false });
    }
  },

  markShared: () => {
    const current = get().status;
    if (current?.checks.shared) return;
    api
      .post<{ sharedAt: string }>("/restaurants/current/activation/shared", {})
      .then(() => get().fetch())
      .catch(() => {});
  },

  reset: () => set({ status: null, loading: false }),
}));
