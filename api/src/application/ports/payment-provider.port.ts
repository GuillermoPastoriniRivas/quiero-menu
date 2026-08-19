import { PlanTier } from '../../domain/enums/plan-tier.enum.js';
import { PaymentProvider } from '../../domain/enums/payment-provider.enum.js';

export interface CreateCheckoutParams {
  tenantId: string;
  plan: PlanTier;
  customerEmail: string;
  successUrl: string;
}

export interface CreateCheckoutResult {
  checkoutUrl: string;
}

export type WebhookEventType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'payment_success'
  | 'payment_failed'
  | 'subscription_expired'
  | 'subscription_canceled';

export interface WebhookSignatureContext {
  requestId?: string;
  dataId?: string;
}

export interface WebhookEvent {
  type: WebhookEventType;
  externalSubscriptionId: string;
  externalCustomerId: string;
  tenantId: string | null;
  plan: PlanTier | null;
  status: string;
  currentPeriodEnd: Date | null;
  provider: PaymentProvider;
}

export interface PaymentProviderPort {
  createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult>;
  cancelSubscription(externalSubscriptionId: string): Promise<void>;
  getCustomerPortalUrl(externalCustomerId: string): Promise<string | null>;
  verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
    context?: WebhookSignatureContext,
  ): boolean;
  parseWebhookEvent(payload: unknown): Promise<WebhookEvent>;
}
