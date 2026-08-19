import {
  Controller,
  Post,
  Req,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../decorators/public.decorator.js';
import type { PaymentProviderPort } from '../../application/ports/payment-provider.port.js';
import type { HandlePaymentWebhookUseCase } from '../../application/use-cases/billing/handle-payment-webhook.use-case.js';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

interface MercadoPagoWebhookBody {
  data?: { id?: string | number };
}

@Controller('billing/webhooks')
export class PaymentWebhookController {
  constructor(
    @Inject('PaymentProviderPort')
    private readonly paymentProvider: PaymentProviderPort,
    @Inject('HandlePaymentWebhookUseCase')
    private readonly handleWebhook: HandlePaymentWebhookUseCase,
  ) {}

  @Public()
  @Post('lemon-squeezy')
  async lemonSqueezy(@Req() req: RequestWithRawBody) {
    const signature = req.headers['x-signature'] as string;
    if (!signature) throw new UnauthorizedException('Missing signature.');

    const rawBody = req.rawBody;
    if (!rawBody) throw new UnauthorizedException('Missing raw body.');

    const valid = this.paymentProvider.verifyWebhookSignature(
      rawBody,
      signature,
    );
    if (!valid) throw new UnauthorizedException('Invalid signature.');

    const event = await this.paymentProvider.parseWebhookEvent(req.body);
    await this.handleWebhook.execute(event);

    return { received: true };
  }

  @Public()
  @Post('mercado-pago')
  async mercadoPago(@Req() req: RequestWithRawBody) {
    const signature = req.headers['x-signature'] as string;
    if (!signature) throw new UnauthorizedException('Missing signature.');

    const rawBody = req.rawBody;
    if (!rawBody) throw new UnauthorizedException('Missing raw body.');

    const body = req.body as MercadoPagoWebhookBody | undefined;
    const dataId =
      (req.query['data.id'] as string) ?? String(body?.data?.id ?? '');
    const requestId = req.headers['x-request-id'] as string | undefined;

    const valid = this.paymentProvider.verifyWebhookSignature(
      rawBody,
      signature,
      { dataId, requestId },
    );
    if (!valid) throw new UnauthorizedException('Invalid signature.');

    const event = await this.paymentProvider.parseWebhookEvent(req.body);
    await this.handleWebhook.execute(event);

    return { received: true };
  }
}
