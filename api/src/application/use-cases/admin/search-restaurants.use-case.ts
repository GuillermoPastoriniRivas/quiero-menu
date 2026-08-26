import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';

export interface AdminRestaurantListItem {
  id: string;
  slug: string;
  name: string;
  city: string;
  status: string;
  plan: string | null;
  createdAt: Date;
  ownerName: string;
  ownerEmail: string;
}

export class SearchRestaurantsUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRepo: UserRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly defaultLimit = 20,
  ) {}

  async execute(term: string): Promise<AdminRestaurantListItem[]> {
    const clean = term.trim();
    const limit = this.defaultLimit;

    const restaurants = await this.restaurantRepo.searchAdmin(clean, limit);
    const byId = new Map(restaurants.map((r) => [r.id, r]));

    if (clean) {
      const users = await this.userRepo.searchByEmail(clean, limit);
      for (const user of users) {
        const links = await this.userRestaurantRepo.findByUserId(user.id);
        for (const link of links) {
          if (!byId.has(link.restaurantId)) {
            const r = await this.restaurantRepo.findById(link.restaurantId);
            if (r) byId.set(r.id, r);
          }
        }
      }
    }

    return Promise.all(
      [...byId.values()].map(async (r) => {
        const links = await this.userRestaurantRepo.findByRestaurantId(r.id);
        const ownerLink =
          links.find((l) => l.role === UserRole.OWNER) ?? links[0] ?? null;
        const owner = ownerLink
          ? await this.userRepo.findById(ownerLink.userId)
          : null;
        const subscription = await this.subscriptionRepo.findByRestaurantId(
          r.id,
        );

        return {
          id: r.id,
          slug: r.slug,
          name: r.name,
          city: r.city,
          status: r.status,
          plan: subscription?.plan ?? null,
          createdAt: r.createdAt,
          ownerName: owner?.name ?? '',
          ownerEmail: owner?.email ?? '',
        };
      }),
    );
  }
}
