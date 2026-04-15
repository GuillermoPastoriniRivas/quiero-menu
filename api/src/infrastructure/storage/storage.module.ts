import { Module } from '@nestjs/common';
import { S3StorageService } from './s3-storage.service.js';

@Module({
  providers: [
    {
      provide: 'StoragePort',
      useClass: S3StorageService,
    },
  ],
  exports: ['StoragePort'],
})
export class StorageModule {}
