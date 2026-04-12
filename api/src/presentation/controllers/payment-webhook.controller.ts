import { Controller, Post, Req, Inject, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../decorators/public.decorator.js';
import type { PaymentProviderPort } from '../../application/ports/payment-provider.port.js';
import type { HandlePaymentWebhookUseCase } from '../../application/use-cases/billing/handle-payment-webhook.use-case.js';

@Controller('billing/webhooks')
export class PaymentWebhookController {
  constructor(
    @Inject('PaymentProviderPort') private readonly paymentProvider: PaymentProviderPort,
    @Inject('HandlePaymentWebhookUseCase') private readonly handleWebhook: HandlePaymentWebhookUseCase,
  ) {}

  @Public()
  @Post('lemon-squeezy')
  async lemonSqueezy(@Req() req: Request) {
    const signature = req.headers['x-signature'] as string;
    if (!signature) throw new UnauthorizedException('Missing signature.');

    const rawBody = (req as any).rawBody as Buffer;
    if (!rawBody) throw new UnauthorizedException('Missing raw body.');

    const valid = this.paymentProvider.verifyWebhookSignature(rawBody, signature);
    if (!valid) throw new UnauthorizedException('Invalid signature.');

    const event = this.paymentProvider.parseWebhookEvent(req.body);
    await this.handleWebhook.execute(event);

    return { received: true };
  }
}
