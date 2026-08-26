import {
  AuditLogEntry,
  CreateAuditLogEntryData,
} from '../entities/audit-log.entity.js';

export interface AuditLogRepository {
  append(data: CreateAuditLogEntryData): Promise<void>;
  findRecent(limit: number): Promise<AuditLogEntry[]>;
}
