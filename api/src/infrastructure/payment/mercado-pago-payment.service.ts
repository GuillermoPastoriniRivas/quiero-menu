import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'node:crypto';
import {
  PaymentProviderPort,
  CreateCheckoutParams,
  CreateCheckoutResult,
  WebhookEvent,
  WebhookEventType,
  WebhookSignatureContext,
} from '../../application/ports/payment-provider.port.js';
import { PlanTier } from '../../domain/enums/plan-tier.enum.js';
import { PaymentProvider } from '../../domain/enums/payment-provider.enum.js';

const MP_API_BASE = 'https://api.mercadopago.com';

interface MercadoPagoNotification {
  type?: string;
  action?: string;
  data?: { id: string | number };
}

interface Preapproval {
  id?: string;
  status?: string;
  external_reference?: string;
  payer_id?: number;
  preapproval_plan_id?: string;
  next_payment_date?: string;
  init_point?: string;
}

interface PreapprovalPlan {
  id?: string;
  status?: string;
  external_reference?: string;
  init_point?: string;
}

interface AuthorizedPayment {
  preapproval_id?: string;
  status?: string;
  next_payment_date?: string;
}

interface Payment {
  status?: string;
  preapproval_id?: string;
  external_reference?: string;
}

@Injectable()
export class MercadoPagoPaymentService implements PaymentProviderPort {
  private readonly logger = new Logger(MercadoPagoPaymentService.name);

  private readonly accessToken: string;
  private readonly webhookSecret: string;
  private readonly amount: number;
  private readonly currency: string;
  private readonly trialDays: number;
  private readonly planCache = new Map<
    string,
    { id: string; initPoint: string }
  >();

  constructor(private readonly config: ConfigService) {
    this.accessToken = this.config.get<string>('mercadoPago.accessToken', '');
    this.webhookSecret = this.config.get<string>(
      'mercadoPago.webhookSecret',
      '',
    );
    this.amount = this.config.get<number>('mercadoPago.amount', 1000);
    this.currency = this.config.get<string>('mercadoPago.currency', 'ARS');
    this.trialDays = this.config.get<number>('mercadoPago.trialDays', 30);
  }

  async createCheckout(
    params: CreateCheckoutParams,
  ): Promise<CreateCheckoutResult> {
    const plan = await this.ensurePlan(params.tenantId);

    return { checkoutUrl: plan.initPoint };
  }

  async cancelSubscription(externalSubscriptionId: string): Promise<void> {
    await this.request(
      `/preapproval/${encodeURIComponent(externalSubscriptionId)}`,
      'PUT',
      {
        status: 'canceled',
      },
    );
  }

  getCustomerPortalUrl(): Promise<string | null> {
    return Promise.resolve(null);
  }

  verifyWebhookSignature(
    _rawBody: Buffer,
    signature: string,
    context?: WebhookSignatureContext,
  ): boolean {
    if (!this.webhookSecret) return false;

    const parts: Record<string, string> = {};
    for (const part of signature.split(',')) {
      const [key, ...rest] = part.split('=');
      if (key) parts[key.trim()] = rest.join('=').trim();
    }

    const ts = parts['ts'];
    const v1 = parts['v1'];
    if (!ts || !v1) return false;

    // Manifest documented in https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
    const manifest = `id:${context?.dataId ?? ''};request-id:${context?.requestId ?? ''};ts:${ts};`;
    const digest = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(manifest)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(v1));
    } catch {
      return false;
    }
  }

  async parseWebhookEvent(payload: unknown): Promise<WebhookEvent> {
    const notification = payload as MercadoPagoNotification;
    const type = notification.type ?? notification.action?.split('.')[0] ?? '';
    const resourceId = String(notification.data?.id ?? '');

    const base: WebhookEvent = {
      type: 'subscription_updated',
      externalSubscriptionId: '',
      externalCustomerId: '',
      tenantId: null,
      plan: null,
      status: '',
      currentPeriodEnd: null,
      provider: PaymentProvider.MERCADO_PAGO,
    };

    if (!resourceId) return base;

    if (type === 'subscription_preapproval') {
      return this.parsePreapproval(resourceId, base);
    }
    if (type === 'subscription_authorized_payment') {
      return this.parseAuthorizedPayment(resourceId, base);
    }
    if (type === 'payment') {
      return this.parsePayment(resourceId, base);
    }

    return base;
  }

  private async parsePreapproval(
    resourceId: string,
    base: WebhookEvent,
  ): Promise<WebhookEvent> {
    const preapproval = await this.request<Preapproval>(
      `/preapproval/${encodeURIComponent(resourceId)}`,
    );

    const status = preapproval.status ?? '';
    let type: WebhookEventType = 'subscription_updated';
    if (status === 'authorized') type = 'subscription_created';
    else if (status === 'canceled') type = 'subscription_canceled';
    else if (status === 'finished' || status === 'expired')
      type = 'subscription_expired';

    return {
      ...base,
      type,
      externalSubscriptionId: resourceId,
      externalCustomerId:
        preapproval.payer_id != null ? String(preapproval.payer_id) : '',
      tenantId:
        preapproval.external_reference ??
        (preapproval.preapproval_plan_id
          ? await this.resolvePlanExternalReference(
              preapproval.preapproval_plan_id,
            )
          : null),
      plan: PlanTier.PRO,
      status,
      currentPeriodEnd: preapproval.next_payment_date
        ? new Date(preapproval.next_payment_date)
        : null,
    };
  }

  private async parseAuthorizedPayment(
    resourceId: string,
    base: WebhookEvent,
  ): Promise<WebhookEvent> {
    const invoice = await this.request<AuthorizedPayment>(
      `/authorized_payments/${encodeURIComponent(resourceId)}`,
    );

    const status = invoice.status ?? '';
    const type: WebhookEventType =
      status === 'approved'
        ? 'payment_success'
        : status === 'rejected'
          ? 'payment_failed'
          : 'subscription_updated';

    return {
      ...base,
      type,
      externalSubscriptionId: invoice.preapproval_id ?? '',
      plan: PlanTier.PRO,
      status,
      currentPeriodEnd: invoice.next_payment_date
        ? new Date(invoice.next_payment_date)
        : null,
    };
  }

  private async parsePayment(
    resourceId: string,
    base: WebhookEvent,
  ): Promise<WebhookEvent> {
    const payment = await this.request<Payment>(
      `/v1/payments/${encodeURIComponent(resourceId)}`,
    );

    const status = payment.status ?? '';
    const type: WebhookEventType =
      status === 'approved'
        ? 'payment_success'
        : status === 'rejected'
          ? 'payment_failed'
          : 'subscription_updated';

    return {
      ...base,
      type,
      externalSubscriptionId: payment.preapproval_id ?? '',
      tenantId: payment.external_reference ?? null,
      plan: PlanTier.PRO,
      status,
    };
  }

  private async ensurePlan(tenantId: string): Promise<{
    id: string;
    initPoint: string;
  }> {
    const cached = this.planCache.get(tenantId);
    if (cached) return cached;

    const plan = await this.request<PreapprovalPlan>(
      '/preapproval_plan',
      'POST',
      {
        reason: 'Quiero Menú Pro',
        external_reference: tenantId,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          free_trial: { frequency: this.trialDays, frequency_type: 'days' },
          transaction_amount: this.amount,
          currency_id: this.currency,
        },
        back_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3001'}/settings?section=billing`,
      },
    );

    if (!plan.id || !plan.init_point) {
      throw new Error('Mercado Pago plan creation missing id or init_point');
    }

    this.planCache.set(tenantId, { id: plan.id, initPoint: plan.init_point });
    this.logger.log(
      `Created Mercado Pago preapproval_plan ${plan.id} for tenant ${tenantId} (ARS ${this.amount}/month, ${this.trialDays} days free)`,
    );
    return { id: plan.id, initPoint: plan.init_point };
  }

  private async resolvePlanExternalReference(
    planId: string,
  ): Promise<string | null> {
    try {
      const plan = await this.request<PreapprovalPlan>(
        `/preapproval_plan/${encodeURIComponent(planId)}`,
      );
      return plan.external_reference ?? null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' = 'GET',
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${MP_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Mercado Pago ${method} ${path} failed (${response.status}): ${errorBody}`,
      );
    }

    return response.json() as Promise<T>;
  }
}
