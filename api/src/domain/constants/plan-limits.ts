import { PlanTier } from '../enums/plan-tier.enum.js';

export interface PlanLimits {
  maxOrdersPerMonth: number;
  showPoweredByFooter: boolean;
  customDomain: boolean;
  priceMonthly: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  [PlanTier.FREE]: {
    maxOrdersPerMonth: 50,
    showPoweredByFooter: true,
    customDomain: false,
    priceMonthly: 0,
  },
  [PlanTier.PRO]: {
    maxOrdersPerMonth: -1,
    showPoweredByFooter: false,
    customDomain: true,
    priceMonthly: 1900,
  },
};
