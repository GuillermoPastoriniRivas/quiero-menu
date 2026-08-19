import { Module } from '@nestjs/common';
import { MercadoPagoPaymentService } from './mercado-pago-payment.service.js';

@Module({
  providers: [
    { provide: 'PaymentProviderPort', useClass: MercadoPagoPaymentService },
  ],
  exports: ['PaymentProviderPort'],
})
export class PaymentModule {}
