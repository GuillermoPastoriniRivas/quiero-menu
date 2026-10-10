import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { BehaviorPort } from '../../application/ports/behavior.port.js';
import type {
  BehaviorContext,
  BehaviorEvent,
} from '../../domain/entities/behavior-event.entity.js';
import { BehaviorContextSchema } from '../request-dtos/behavior.dto.js';

@Injectable()
export class BehaviorService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(BehaviorService.name);
  private timer?: ReturnType<typeof setInterval>;
  private rolling = false;

  constructor(@Inject('BehaviorPort') readonly repository: BehaviorPort) {}

  context(header: unknown): BehaviorContext | undefined {
    if (typeof header !== 'string' || header.length > 2000) return;
    try {
      const result = BehaviorContextSchema.safeParse(JSON.parse(header));
      return result.success ? result.data : undefined;
    } catch {
      return;
    }
  }

  record(
    event: string,
    data: Partial<Omit<BehaviorEvent, 'event'>> = {},
  ): void {
    const now = new Date();
    this.background(
      this.repository.append([
        {
          eventId: data.eventId ?? randomUUID(),
          event,
          occurredAt: now,
          receivedAt: now,
          audience: data.audience ?? 'owner',
          source: 'server',
          properties: {},
          ...data,
        },
      ]),
    );
  }

  background(task: Promise<unknown>): void {
    void task.catch(() =>
      this.logger.warn(
        'Behavior persistence failed; business operation continues',
      ),
    );
  }

  onApplicationBootstrap(): void {
    // Rebuild from facts, never increment on retry. Startup also catches up after downtime.
    void this.rollup(90);
    this.timer = setInterval(() => void this.rollup(3), 10 * 60_000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async rollup(days: number): Promise<void> {
    if (this.rolling) return;
    this.rolling = true;
    try {
      const since = new Date();
      since.setUTCDate(since.getUTCDate() - days);
      since.setUTCHours(0, 0, 0, 0);
      await this.repository.rebuildDaily(since);
    } catch {
      this.logger.warn('Behavior daily rollup failed; will retry');
    } finally {
      this.rolling = false;
    }
  }
}
