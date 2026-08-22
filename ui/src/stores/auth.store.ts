'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { LoginResponse } from '@/types';

const USER_KEY = 'user';

function persistUser(user: LoginResponse['user']) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

function readCachedUser(): LoginResponse['user'] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginResponse['user'];
  } catch {
    return null;
  }
}

/**
 * Borra la sesión guardada en el dispositivo antes de intentar entrar con otra
 * cuenta. Si no, un intento fallido deja vivos los tokens del usuario anterior
 * y la app termina entrando con esa sesión.
 */
function clearStoredSession(): void {
  api.clearTokens();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
}

interface AuthState {
  user: LoginResponse['user'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  hydrate: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; restaurantName: string; restaurantSlug: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: LoginResponse['user']) => void;
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
    const cached = readCachedUser();
    if (cached) {
      set({ user: cached, isAuthenticated: true, isLoading: false });
      return;
    }
    // Sesión sin usuario cacheado (de antes de persistirlo): rehidratar por API.
    api.get<{ id: string; name: string; email: string; restaurants: { id: string; slug: string; name: string; role: string }[] }>('/auth/me')
      .then((data) => {
        const r = data.restaurants[0];
        const user = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: r?.role ?? '',
          restaurantId: r?.id ?? '',
          restaurantSlug: r?.slug ?? '',
        };
        persistUser(user);
        set({ user, isAuthenticated: true, isLoading: false });
      })
      .catch((err) => {
        // Solo un 401 real invalida la sesión (request ya limpió los tokens y
        // disparó onUnauthorized). Errores de red/API no deben borrar los tokens:
        // la sesión sigue válida y el usuario puede reintentar.
        if (err?.status !== 401) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          return;
        }
        api.clearTokens();
        localStorage.removeItem(USER_KEY);
        set({ isLoading: false, isAuthenticated: false, user: null });
      });
  },

  login: async (email, password) => {
    clearStoredSession();
    const data = await api.post<LoginResponse>('/auth/login', { email, password });
    api.setTokens(data.accessToken, data.refreshToken);
    persistUser(data.user);
    set({ user: data.user, isAuthenticated: true });
  },

  signup: async (input) => {
    clearStoredSession();
    const data = await api.post<LoginResponse>('/auth/signup', input);
    api.setTokens(data.accessToken, data.refreshToken);
    persistUser(data.user);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: () => {
    const refreshToken = api.getRefreshToken();
    if (refreshToken) {
      api
        .post('/auth/logout', { refreshToken })
        .catch(() => {});
    }
    api.clearTokens();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    persistUser(user);
    set({ user });
  },
}));
