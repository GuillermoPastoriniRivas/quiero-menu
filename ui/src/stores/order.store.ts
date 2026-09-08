'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import type { Order, OrderItem, OrderWithRedaction, OrderListResponse, PlanInfo, OrderStatus, OrderFeedbackInfo } from '@/types';

interface OrderState {
  orders: OrderWithRedaction[];
  meta: { total: number; page: number; pages: number } | null;
  planInfo: PlanInfo | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;

  fetch: (params?: { page?: number; status?: OrderStatus }) => Promise<void>;
  loadMore: () => Promise<void>;
  getOrder: (id: string) => Promise<{ order: Order; items: OrderItem[]; redacted: boolean; feedback: OrderFeedbackInfo | null }>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  connectRealtime: () => void;
  disconnectRealtime: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  meta: null,
  planInfo: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,

  fetch: async (params) => {
    set({ isLoading: true });
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      const data = await api.get<OrderListResponse>(`/orders${qs ? `?${qs}` : ''}`);
      set({
        orders: data.data,
        meta: data.meta,
        planInfo: data.planInfo,
        hasMore: data.data.length < data.meta.total,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { meta, hasMore, isLoadingMore } = get();
    if (!hasMore || isLoadingMore || !meta) return;
    set({ isLoadingMore: true });
    try {
      const next = meta.page + 1;
      const data = await api.get<OrderListResponse>(`/orders?page=${next}&limit=50`);
      set((s) => {
        const seen = new Set(s.orders.map((o) => o.id));
        const merged = [...s.orders, ...data.data.filter((o) => !seen.has(o.id))];
        return {
          orders: merged,
          meta: data.meta,
          planInfo: data.planInfo,
          hasMore: merged.length < data.meta.total,
        };
      });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  getOrder: async (id) => {
    return api.get<{
      order: Order;
      items: OrderItem[];
      redacted: boolean;
      feedback: OrderFeedbackInfo | null;
    }>(`/orders/${id}`);
  },

  updateStatus: async (id, status) => {
    const updated = await api.patch<Order>(`/orders/${id}/status`, { status });
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id
          ? { ...o, ...updated, redacted: o.redacted, items: o.items }
          : o,
      ),
    }));
  },

  connectRealtime: () => {
    connectSocket();
    const socket = getSocket();
    socket.off('order.updated');
    socket.on('order.updated', (order: Order) => {
      const orderWithRedaction: OrderWithRedaction = { ...order, redacted: false };
      set((s) => {
        const exists = s.orders.some((o) => o.id === order.id);
        const orders = exists
          ? s.orders.map((o) => (o.id === order.id ? { ...orderWithRedaction, redacted: o.redacted } : o))
          : [orderWithRedaction, ...s.orders];
        return {
          orders,
          hasMore: s.meta ? orders.length < s.meta.total : true,
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
