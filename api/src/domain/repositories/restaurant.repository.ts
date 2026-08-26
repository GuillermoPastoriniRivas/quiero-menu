import { Restaurant } from '../entities/restaurant.entity.js';
import { RestaurantStatus } from '../enums/restaurant-status.enum.js';

export interface RestaurantRepository {
  create(
    data: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Restaurant>;
  findById(id: string): Promise<Restaurant | null>;
  findBySlug(slug: string): Promise<Restaurant | null>;
  searchAdmin(term: string, limit: number): Promise<Restaurant[]>;
  findByStatus(status: RestaurantStatus): Promise<Restaurant[]>;
  findByCustomDomain(domain: string): Promise<Restaurant | null>;
  listByCustomDomainState(
    state: 'pending' | 'provisioning' | 'active' | 'failed',
  ): Promise<Restaurant[]>;
  listStaleCustomDomainProvisioning(cutoff: Date): Promise<Restaurant[]>;
  update(
    id: string,
    data: Partial<Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Restaurant | null>;
  delete(id: string): Promise<boolean>;
}
