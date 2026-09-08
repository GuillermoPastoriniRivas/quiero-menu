import { FeaturedSlotRepository } from '../../../domain/repositories/featured-slot.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';

/** Baja manual de un destacado (el admin lo apaga antes del vencimiento). */
export class DeactivateFeaturedSlotUseCase {
  constructor(private readonly slotRepo: FeaturedSlotRepository) {}

  async execute(
    slotId: string,
  ): Promise<Result<{ ok: true }, RestaurantNotFoundError>> {
    const slot = await this.slotRepo.setActive(slotId, false);
    if (!slot) return err(new RestaurantNotFoundError());
    return ok({ ok: true });
  }
}
