import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Result, ok, err } from '../../common/result.js';
import {
  CustomDomainNotActiveError,
  CustomDomainInvalidError,
} from '../../../domain/errors/domain-errors.js';
import { normalizeDomain } from '../../../domain/services/custom-domain-policy.js';

export class ResolveCustomDomainUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(
    host: string,
  ): Promise<
    Result<
      { slug: string; restaurantId: string },
      CustomDomainNotActiveError | CustomDomainInvalidError
    >
  > {
    const domain = normalizeDomain(host);
    if (!domain) return err(new CustomDomainInvalidError('Host inválido.'));
    const restaurant = await this.restaurantRepo.findByCustomDomain(domain);
    if (!restaurant || restaurant.customDomainStatus?.state !== 'active') {
      return err(new CustomDomainNotActiveError());
    }
    return ok({ slug: restaurant.slug, restaurantId: restaurant.id });
  }
}
