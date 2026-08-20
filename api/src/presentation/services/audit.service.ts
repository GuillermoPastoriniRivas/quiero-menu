import { Inject, Injectable } from '@nestjs/common';
import { AuditLogRepository } from '../../domain/repositories/audit-log.repository.js';

/**
 * Auditoría de eventos sensibles (login, logout, billing, etc.).
 * Fire-and-forget: un fallo de auditoría nunca debe romper la request.
 */
@Injectable()
export class AuditService {
  constructor(
    @Inject('AuditLogRepository')
    private readonly auditLogRepo: AuditLogRepository,
  ) {}

  log(
    event: string,
    actorUserId: string | null = null,
    restaurantId: string | null = null,
    metadata: Record<string, unknown> | null = null,
  ): void {
    this.auditLogRepo
      .append({ event, actorUserId, restaurantId, metadata })
      .catch(() => {});
  }
}
