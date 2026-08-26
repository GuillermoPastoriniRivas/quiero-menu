import { AuditLogRepository } from '../../../domain/repositories/audit-log.repository.js';

export interface AdminAuditLogItem {
  id: string;
  event: string;
  actorUserId: string | null;
  restaurantId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export class ListAuditLogsUseCase {
  constructor(private readonly auditLogRepo: AuditLogRepository) {}

  async execute(limit: number): Promise<AdminAuditLogItem[]> {
    return this.auditLogRepo.findRecent(limit);
  }
}
