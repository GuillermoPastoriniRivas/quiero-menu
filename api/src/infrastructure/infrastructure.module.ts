import { Module } from '@nestjs/common';
import { PersistenceModule } from './persistence/persistence.module.js';
import { AuthInfraModule } from './auth/auth-infra.module.js';
import { WebSocketInfraModule } from './websocket/websocket.module.js';
import { AiModule } from './ai/ai.module.js';

@Module({
  imports: [PersistenceModule, AuthInfraModule, WebSocketInfraModule, AiModule],
  exports: [PersistenceModule, AuthInfraModule, WebSocketInfraModule, AiModule],
})
export class InfrastructureModule {}
