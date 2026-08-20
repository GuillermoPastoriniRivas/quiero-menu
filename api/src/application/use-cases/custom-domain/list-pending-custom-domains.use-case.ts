import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';

export interface PendingCustomDomain {
  restaurantId: string;
  domain: string;
  requestedAt?: Date;
}

const STALE_PROVISIONING_MS = 15 * 60 * 1000;

export class ListPendingCustomDomainsUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(): Promise<PendingCustomDomain[]> {
    const [pending, stale] = await Promise.all([
      this.restaurantRepo.listByCustomDomainState('pending'),
      // Si un worker murió a mitad de la provisión, el dominio quedaría en
      // 'provisioning' para siempre: lo reintentamos tras 15 min.
      this.restaurantRepo.listStaleCustomDomainProvisioning(
        new Date(Date.now() - STALE_PROVISIONING_MS),
      ),
    ]);

    const seen = new Set<string>();
    const rows: PendingCustomDomain[] = [];
    for (const r of [...pending, ...stale]) {
      if (seen.has(r.id) || !r.customDomain) continue;
      seen.add(r.id);
      rows.push({
        restaurantId: r.id,
        domain: r.customDomain,
        requestedAt: r.customDomainStatus?.requestedAt,
      });
    }
    return rows;
  }
}
