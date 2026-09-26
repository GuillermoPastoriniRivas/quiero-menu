"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

interface AdminState {
  pendingClaims: number;
  refreshPendingClaims: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  pendingClaims: 0,
  refreshPendingClaims: async () => {
    try {
      const data = await api.get<{ claims: unknown[] }>("/admin/claims?status=pending");
      set({ pendingClaims: data.claims.length });
    } catch {
      set({ pendingClaims: 0 });
    }
  },
}));
