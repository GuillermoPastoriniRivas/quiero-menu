import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';

export interface ActiveCustomDomain {
  restaurantId: string;
  domain: string;
}

export class ListActiveCustomDomainsUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(): Promise<ActiveCustomDomain[]> {
    const active = await this.restaurantRepo.listByCustomDomainState('active');
    return active.map((r) => ({
      restaurantId: r.id,
      domain: r.customDomain!,
    }));
  }
}
