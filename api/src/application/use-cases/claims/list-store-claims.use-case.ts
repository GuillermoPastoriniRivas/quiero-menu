import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { StoreClaimRepository } from '../../../domain/repositories/store-claim.repository.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import type { StoreClaimStatus } from '../../../domain/entities/store-claim.entity.js';

export interface StoreClaimListItem {
  id: string;
  status: StoreClaimStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  claimant: { name: string; phone: string; email: string; message: string };
  restaurant: {
    id: string;
    slug: string;
    name: string;
    city: string;
    phone: string;
    claimed: boolean;
  } | null;
  owners: { name: string; email: string }[];
}

/**
 * Cola de revisión para el admin: cada pedido con el local, su teléfono
 * publicado (para comparar con el del solicitante) y los dueños actuales.
 */
export class ListStoreClaimsUseCase {
  constructor(
    private readonly claimRepo: StoreClaimRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(
    status: StoreClaimStatus = 'pending',
    limit = 50,
  ): Promise<StoreClaimListItem[]> {
    const claims = await this.claimRepo.listByStatus(status, limit);
    const items: StoreClaimListItem[] = [];
    for (const claim of claims) {
      const restaurant = await this.restaurantRepo.findById(claim.restaurantId);
      const links = restaurant
        ? await this.userRestaurantRepo.findByRestaurantId(restaurant.id)
        : [];
      const owners: { name: string; email: string }[] = [];
      for (const link of links) {
        if (link.role !== UserRole.OWNER) continue;
        const user = await this.userRepo.findById(link.userId);
        if (user) owners.push({ name: user.name, email: user.email });
      }
      items.push({
        id: claim.id,
        status: claim.status,
        createdAt: claim.createdAt,
        reviewedAt: claim.reviewedAt,
        claimant: {
          name: claim.name,
          phone: claim.phone,
          email: claim.email,
          message: claim.message,
        },
        restaurant: restaurant
          ? {
              id: restaurant.id,
              slug: restaurant.slug,
              name: restaurant.name,
              city: restaurant.city,
              phone: restaurant.phone,
              claimed: restaurant.claimed ?? true,
            }
          : null,
        owners,
      });
    }
    return items;
  }
}
