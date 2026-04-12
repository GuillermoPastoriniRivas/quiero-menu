import { Module } from '@nestjs/common';
import { LemonSqueezyPaymentService } from './lemon-squeezy-payment.service.js';

@Module({
  providers: [
    { provide: 'PaymentProviderPort', useClass: LemonSqueezyPaymentService },
  ],
  exports: ['PaymentProviderPort'],
})
export class PaymentModule {}
