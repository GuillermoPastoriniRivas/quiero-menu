export interface AuditLogEntry {
  id: string;
  event: string;
  actorUserId: string | null;
  restaurantId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateAuditLogEntryData {
  event: string;
  actorUserId?: string | null;
  restaurantId?: string | null;
  metadata?: Record<string, unknown> | null;
}
