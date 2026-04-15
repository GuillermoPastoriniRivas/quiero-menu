import { Module } from '@nestjs/common';
import { PersistenceModule } from './persistence/persistence.module.js';
import { AuthInfraModule } from './auth/auth-infra.module.js';
import { WebSocketInfraModule } from './websocket/websocket.module.js';
import { AiModule } from './ai/ai.module.js';
import { PaymentModule } from './payment/payment.module.js';
import { StorageModule } from './storage/storage.module.js';
import { EmailModule } from './email/email.module.js';

@Module({
  imports: [PersistenceModule, AuthInfraModule, WebSocketInfraModule, AiModule, PaymentModule, StorageModule, EmailModule],
  exports: [PersistenceModule, AuthInfraModule, WebSocketInfraModule, AiModule, PaymentModule, StorageModule, EmailModule],
})
export class InfrastructureModule {}
