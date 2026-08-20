import { Module } from '@nestjs/common';
import { WebPushService } from './web-push.service.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: 'PushServicePort',
      useClass: WebPushService,
    },
  ],
  exports: ['PushServicePort'],
})
export class PushModule {}
