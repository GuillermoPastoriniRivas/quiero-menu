import type {
  PaymentMethodsConfig,
  PhotoGalleryImage,
} from '../entities/restaurant.entity.js';
import { toWhatsAppNumber } from './whatsapp-number.js';

export const READINESS_STEPS = [
  'menu',
  'whatsapp',
  'hours',
  'look',
  'location',
  'payments',
  'shared',
  'firstOrder',
] as const;

export type ReadinessStep = (typeof READINESS_STEPS)[number];

export const LISTING_STEPS: readonly ReadinessStep[] = [
  'menu',
  'whatsapp',
  'hours',
  'look',
  'location',
];

export const ACTIVATION_STEPS: readonly ReadinessStep[] = READINESS_STEPS;

export interface ReadinessRestaurant {
  phone: string;
  logoUrl: string;
  bannerUrl: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  paymentMethods: PaymentMethodsConfig;
  photoGallery?: PhotoGalleryImage[];
  activation?: { sharedAt?: Date | null } | null;
}

export interface ReadinessInput {
  restaurant: ReadinessRestaurant;
  menuItems: number;
  openDays: number;
  orders: number;
}

export type ReadinessChecks = Record<ReadinessStep, boolean>;

export interface ReadinessSummary {
  done: number;
  total: number;
  percent: number;
  missing: ReadinessStep[];
  next: ReadinessStep | null;
}

export function paymentsReady(
  methods: PaymentMethodsConfig | null | undefined,
): boolean {
  if (!methods) return false;
  const anyEnabled =
    methods.cashEnabled || methods.cardEnabled || methods.transferEnabled;
  if (!anyEnabled) return false;
  if (!methods.transferEnabled) return true;
  return Boolean(methods.transferAlias?.trim() || methods.transferCbu?.trim());
}

export function evaluateReadiness(input: ReadinessInput): ReadinessChecks {
  const r = input.restaurant;
  const hasGallery = (r.photoGallery?.length ?? 0) > 0;
  return {
    menu: input.menuItems > 0,
    whatsapp: toWhatsAppNumber(r.phone) !== null,
    hours: input.openDays > 0,
    look: Boolean(r.logoUrl) && (Boolean(r.bannerUrl) || hasGallery),
    location: Boolean(r.address?.trim()) && r.coordinates !== null,
    payments: paymentsReady(r.paymentMethods),
    shared: Boolean(r.activation?.sharedAt),
    firstOrder: input.orders > 0,
  };
}

export function summarizeReadiness(
  checks: ReadinessChecks,
  steps: readonly ReadinessStep[],
): ReadinessSummary {
  const missing = steps.filter((step) => !checks[step]);
  const done = steps.length - missing.length;
  return {
    done,
    total: steps.length,
    percent: steps.length === 0 ? 100 : Math.round((done / steps.length) * 100),
    missing,
    next: missing[0] ?? null,
  };
}

export function countOpenDays(
  hours: {
    dayOfWeek: number;
    isClosed: boolean;
    opensAt: string;
    closesAt: string;
  }[],
): number {
  const days = new Set<number>();
  for (const h of hours) {
    if (!h.isClosed && h.opensAt && h.closesAt) days.add(h.dayOfWeek);
  }
  return days.size;
}
