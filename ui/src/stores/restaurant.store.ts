"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type {
  Restaurant,
  OperatingHours,
  RestaurantOperatingHoursData,
} from "@/types";

interface RestaurantState {
  restaurant: Restaurant | null;
  operatingHours: OperatingHours[];
  isOpen: boolean;
  todayHours: OperatingHours | null;
  closesAtLabel: string | null;
  localTime: string | null;
  isLoading: boolean;

  fetch: () => Promise<void>;
  update: (data: Partial<Restaurant>) => Promise<void>;
  updateHours: (
    hours: Omit<OperatingHours, "id" | "restaurantId">[],
  ) => Promise<void>;
  fetchHours: () => Promise<void>;
  setOpenStatus: (open: boolean) => Promise<void>;
  applyOpenStatus: (data: RestaurantOperatingHoursData) => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurant: null,
  operatingHours: [],
  isOpen: false,
  todayHours: null,
  closesAtLabel: null,
  localTime: null,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<Restaurant>("/restaurants/current");
      set({ restaurant: data });
    } finally {
      set({ isLoading: false });
    }
  },

  update: async (data) => {
    const updated = await api.patch<Restaurant>("/restaurants/current", data);
    set({ restaurant: updated });
  },

  updateHours: async (hours) => {
    await api.patch("/restaurants/current/operating-hours", { hours });
    const data = await api.get<RestaurantOperatingHoursData>(
      "/restaurants/current/operating-hours",
    );
    set({
      operatingHours: data.hours,
      isOpen: data.isOpen,
      todayHours: data.todayHours,
      closesAtLabel: data.closesAtLabel,
      localTime: data.localTime,
    });
  },

  fetchHours: async () => {
    const data = await api.get<RestaurantOperatingHoursData>(
      "/restaurants/current/operating-hours",
    );
    set({
      operatingHours: data.hours,
      isOpen: data.isOpen,
      todayHours: data.todayHours,
      closesAtLabel: data.closesAtLabel,
      localTime: data.localTime,
    });
  },

  setOpenStatus: async (open) => {
    const updated = await api.patch<Restaurant>(
      "/restaurants/current/open-status",
      { open },
    );
    set({ restaurant: updated });
    const data = await api.get<RestaurantOperatingHoursData>(
      "/restaurants/current/operating-hours",
    );
    set({
      operatingHours: data.hours,
      isOpen: data.isOpen,
      todayHours: data.todayHours,
      closesAtLabel: data.closesAtLabel,
      localTime: data.localTime,
    });
  },

  applyOpenStatus: (data) => {
    set({
      operatingHours: data.hours,
      isOpen: data.isOpen,
      todayHours: data.todayHours,
      closesAtLabel: data.closesAtLabel,
      localTime: data.localTime,
    });
  },
}));
