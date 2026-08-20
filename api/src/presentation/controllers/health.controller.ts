import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../decorators/public.decorator.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(getConnectionToken()) private readonly connection: Connection,
  ) {}

  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async readiness() {
    let dbUp = false;
    try {
      const ping = await Promise.race([
        this.connection.db?.admin().command({ ping: 1 }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('DB ping timeout')), 2000),
        ),
      ]);
      dbUp = ping?.ok === 1;
    } catch {
      dbUp = false;
    }

    if (!dbUp) {
      throw new ServiceUnavailableException({
        status: 'degraded',
        db: 'down',
      });
    }

    return { status: 'ok', db: 'up' };
  }
}
