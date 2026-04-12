import { Module } from '@nestjs/common';
import { PersistenceModule } from './persistence/persistence.module.js';
import { AuthInfraModule } from './auth/auth-infra.module.js';
import { WebSocketInfraModule } from './websocket/websocket.module.js';
import { AiModule } from './ai/ai.module.js';
import { PaymentModule } from './payment/payment.module.js';

@Module({
  imports: [PersistenceModule, AuthInfraModule, WebSocketInfraModule, AiModule, PaymentModule],
  exports: [PersistenceModule, AuthInfraModule, WebSocketInfraModule, AiModule, PaymentModule],
})
export class InfrastructureModule {}
