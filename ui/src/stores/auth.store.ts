'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { LoginResponse } from '@/types';

interface AuthState {
  user: LoginResponse['user'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  hydrate: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; restaurantName: string; restaurantSlug: string }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: () => {
    api.hydrate();
    const token = api.getAccessToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }
    api.get<{ id: string; name: string; email: string; restaurants: { id: string; slug: string; name: string; role: string }[] }>('/auth/me')
      .then((data) => {
        const r = data.restaurants[0];
        set({
          user: { id: data.id, name: data.name, email: data.email, role: r?.role ?? '', restaurantId: r?.id ?? '', restaurantSlug: r?.slug ?? '' },
          isAuthenticated: true,
          isLoading: false,
        });
      })
      .catch(() => {
        api.clearTokens();
        set({ isLoading: false, isAuthenticated: false, user: null });
      });
  },

  login: async (email, password) => {
    const data = await api.post<LoginResponse>('/auth/login', { email, password });
    api.setTokens(data.accessToken, data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
  },

  signup: async (input) => {
    const data = await api.post<LoginResponse>('/auth/signup', input);
    api.setTokens(data.accessToken, data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: () => {
    api.clearTokens();
    set({ user: null, isAuthenticated: false });
  },
}));
