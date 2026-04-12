import { Module } from '@nestjs/common';
import { OpenAiMenuVisionService } from './openai-menu-vision.service.js';

@Module({
  providers: [
    {
      provide: 'MenuVisionPort',
      useClass: OpenAiMenuVisionService,
    },
  ],
  exports: ['MenuVisionPort'],
})
export class AiModule {}
