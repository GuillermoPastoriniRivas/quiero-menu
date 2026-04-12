import { Controller, Get, Post, Inject, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator.js';
import { Roles } from '../decorators/roles.decorator.js';
import type { GetSubscriptionUseCase } from '../../application/use-cases/billing/get-subscription.use-case.js';
import type { CreateCheckoutUseCase } from '../../application/use-cases/billing/create-checkout.use-case.js';
import type { CancelSubscriptionUseCase } from '../../application/use-cases/billing/cancel-subscription.use-case.js';
import type { GetBillingHistoryUseCase } from '../../application/use-cases/billing/get-billing-history.use-case.js';
import type { PaymentProviderPort } from '../../application/ports/payment-provider.port.js';

@Controller('billing')
export class BillingController {
  constructor(
    @Inject('GetSubscriptionUseCase') private readonly getSubscription: GetSubscriptionUseCase,
    @Inject('CreateCheckoutUseCase') private readonly createCheckout: CreateCheckoutUseCase,
    @Inject('CancelSubscriptionUseCase') private readonly cancelSubscription: CancelSubscriptionUseCase,
    @Inject('GetBillingHistoryUseCase') private readonly getBillingHistory: GetBillingHistoryUseCase,
    @Inject('PaymentProviderPort') private readonly paymentProvider: PaymentProviderPort,
  ) {}

  @Get('subscription')
  async subscription(@CurrentUser() user: RequestUser) {
    return this.getSubscription.execute(user.restaurantId);
  }

  @Post('checkout')
  @Roles('owner')
  async checkout(@CurrentUser() user: RequestUser) {
    const result = await this.createCheckout.execute({
      restaurantId: user.restaurantId,
      userId: user._id,
    });
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.value;
  }

  @Get('portal')
  @Roles('owner')
  async portal(@CurrentUser() user: RequestUser) {
    const sub = await this.getSubscription.execute(user.restaurantId);
    if (!sub.subscription?.externalCustomerId) {
      throw new BadRequestException('No external subscription found.');
    }
    const url = await this.paymentProvider.getCustomerPortalUrl(sub.subscription.externalCustomerId);
    if (!url) throw new BadRequestException('Could not retrieve portal URL.');
    return { portalUrl: url };
  }

  @Post('cancel')
  @Roles('owner')
  async cancel(@CurrentUser() user: RequestUser) {
    const result = await this.cancelSubscription.execute(user.restaurantId);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return { success: true };
  }

  @Get('history')
  async history(@CurrentUser() user: RequestUser) {
    return this.getBillingHistory.execute(user.restaurantId);
  }
}
