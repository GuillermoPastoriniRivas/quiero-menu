import type { AuditLogEntry } from '../../../domain/entities/audit-log.entity.js';
import type { RestaurantInsightsQuery } from '../../ports/restaurant-insights.port.js';

export interface AdminActivityEntry {
  id: string;
  event: string;
  createdAt: Date;
  count: number;
  actor: { name: string; email: string } | null;
  restaurant: { id: string; name: string; slug: string } | null;
  metadata: Record<string, unknown> | null;
}

const GROUP_WINDOW_MS = 30 * 60_000;

export function collapseEntries(
  entries: AuditLogEntry[],
): (AuditLogEntry & { count: number })[] {
  const out: (AuditLogEntry & { count: number })[] = [];
  for (const entry of entries) {
    const last = out[out.length - 1];
    if (
      last &&
      last.event === entry.event &&
      last.actorUserId === entry.actorUserId &&
      last.restaurantId === entry.restaurantId &&
      last.createdAt.getTime() - entry.createdAt.getTime() <= GROUP_WINDOW_MS
    ) {
      last.count += 1;
      continue;
    }
    out.push({ ...entry, count: 1 });
  }
  return out;
}

export async function describeActivity(
  insights: RestaurantInsightsQuery,
  entries: AuditLogEntry[],
  restaurantsById: Map<string, { id: string; name: string; slug: string }>,
  limit: number,
): Promise<AdminActivityEntry[]> {
  const collapsed = collapseEntries(entries).slice(0, limit);
  const actorIds = [
    ...new Set(
      collapsed
        .map((e) => e.actorUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const actors = await insights.users(actorIds);
  return collapsed.map((entry) => ({
    id: entry.id,
    event: entry.event,
    createdAt: entry.createdAt,
    count: entry.count,
    actor: entry.actorUserId ? (actors.get(entry.actorUserId) ?? null) : null,
    restaurant: entry.restaurantId
      ? (restaurantsById.get(entry.restaurantId) ?? null)
      : null,
    metadata: entry.metadata,
  }));
}

export class ListAdminActivityUseCase {
  constructor(private readonly insights: RestaurantInsightsQuery) {}

  async execute(limit: number): Promise<AdminActivityEntry[]> {
    const entries = await this.insights.timeline(
      null,
      Math.min(limit * 4, 200),
    );
    const restaurantIds = [
      ...new Set(
        entries
          .map((e) => e.restaurantId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const restaurants = await this.insights.restaurantLabels(restaurantIds);
    return describeActivity(this.insights, entries, restaurants, limit);
  }
}
