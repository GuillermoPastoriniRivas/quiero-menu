'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import type { Order, OrderItem, PaginatedResponse, OrderStatus } from '@/types';

interface OrderState {
  orders: Order[];
  meta: { total: number; page: number; pages: number } | null;
  isLoading: boolean;

  fetch: (params?: { page?: number; status?: OrderStatus }) => Promise<void>;
  getOrder: (id: string) => Promise<{ order: Order; items: OrderItem[] }>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  connectRealtime: () => void;
  disconnectRealtime: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  meta: null,
  isLoading: false,

  fetch: async (params) => {
    set({ isLoading: true });
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      const data = await api.get<PaginatedResponse<Order>>(`/orders${qs ? `?${qs}` : ''}`);
      set({ orders: data.data, meta: data.meta });
    } finally {
      set({ isLoading: false });
    }
  },

  getOrder: async (id) => {
    return api.get<{ order: Order; items: OrderItem[] }>(`/orders/${id}`);
  },

  updateStatus: async (id, status) => {
    const updated = await api.patch<Order>(`/orders/${id}/status`, { status });
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? updated : o)) }));
  },

  connectRealtime: () => {
    connectSocket();
    const socket = getSocket();
    socket.off('order.updated');
    socket.on('order.updated', (order: Order) => {
      set((s) => {
        const exists = s.orders.some((o) => o.id === order.id);
        return {
          orders: exists
            ? s.orders.map((o) => (o.id === order.id ? order : o))
            : [order, ...s.orders],
        };
      });
    });
  },

  disconnectRealtime: () => {
    const socket = getSocket();
    socket.off('order.updated');
    disconnectSocket();
  },
}));
