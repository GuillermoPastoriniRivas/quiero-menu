import { Module } from '@nestjs/common';
import { PersistenceModule } from './persistence/persistence.module.js';
import { AuthInfraModule } from './auth/auth-infra.module.js';
import { WebSocketInfraModule } from './websocket/websocket.module.js';

@Module({
  imports: [PersistenceModule, AuthInfraModule, WebSocketInfraModule],
  exports: [PersistenceModule, AuthInfraModule, WebSocketInfraModule],
})
export class InfrastructureModule {}
