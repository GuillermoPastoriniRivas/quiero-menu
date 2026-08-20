import { CreateAuditLogEntryData } from '../entities/audit-log.entity.js';

export interface AuditLogRepository {
  append(data: CreateAuditLogEntryData): Promise<void>;
}
