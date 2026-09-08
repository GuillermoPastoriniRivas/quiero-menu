import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { StoreClaimRepository } from '../../../domain/repositories/store-claim.repository.js';
import { Result, ok, err } from '../../common/result.js';
import {
  RestaurantNotFoundError,
  StoreAlreadyClaimedError,
} from '../../../domain/errors/domain-errors.js';

export interface RequestStoreClaimInput {
  name: string;
  phone: string;
  email: string;
  message: string;
}

/**
 * Un comensal/dueño pide la cuenta de un local cargado como inventario.
 * Solo locales con claimed === false. Si ya hay un pedido pendiente del
 * mismo teléfono o email, devuelve ese (idempotencia ante doble click).
 */
export class RequestStoreClaimUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly claimRepo: StoreClaimRepository,
  ) {}

  async execute(
    slug: string,
    input: RequestStoreClaimInput,
  ): Promise<
    Result<
      { claimId: string; duplicate: boolean },
      RestaurantNotFoundError | StoreAlreadyClaimedError
    >
  > {
    const restaurant = await this.restaurantRepo.findBySlug(slug);
    if (!restaurant) return err(new RestaurantNotFoundError());
    if (restaurant.claimed !== false)
      return err(new StoreAlreadyClaimedError());

    const pending = await this.claimRepo.findPendingByRestaurantId(
      restaurant.id,
    );
    const same = pending.find(
      (c) =>
        c.phone === input.phone ||
        c.email.toLowerCase() === input.email.toLowerCase(),
    );
    if (same) return ok({ claimId: same.id, duplicate: true });

    const claim = await this.claimRepo.create({
      restaurantId: restaurant.id,
      name: input.name,
      phone: input.phone,
      email: input.email,
      message: input.message,
    });
    return ok({ claimId: claim.id, duplicate: false });
  }
}
