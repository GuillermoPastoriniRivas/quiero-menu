import { ListPendingCustomDomainsUseCase } from './list-pending-custom-domains.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';

function makeRestaurant(
  id: string,
  domain: string,
  state: 'pending' | 'provisioning',
  requestedAt: Date,
): Restaurant {
  return new Restaurant(
    id,
    `slug-${id}`,
    'Mi Resto',
    '',
    '',
    '',
    '',
    '',
    'AR',
    null,
    '+5491100000000',
    'America/Argentina/Buenos_Aires',
    'ARS',
    RestaurantStatus.ACTIVE,
    null,
    domain,
    { state, requestedAt },
    null,
    { cashEnabled: true, cardEnabled: true, transferEnabled: true },
    { primaryColor: '#000000' },
    new Date(),
    new Date(),
  );
}

describe('ListPendingCustomDomainsUseCase', () => {
  it('devuelve pendientes y provisioning colgado (> 15 min) sin duplicar', async () => {
    const now = Date.now();
    const restaurantRepo = {
      listByCustomDomainState: jest
        .fn()
        .mockResolvedValue([
          makeRestaurant('r1', 'a.com', 'pending', new Date(now - 1000)),
        ]),
      listStaleCustomDomainProvisioning: jest
        .fn()
        .mockResolvedValue([
          makeRestaurant(
            'r2',
            'b.com',
            'provisioning',
            new Date(now - 20 * 60 * 1000),
          ),
        ]),
      findByCustomDomain: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const useCase = new ListPendingCustomDomainsUseCase(restaurantRepo as any);

    const rows = await useCase.execute();
    expect(rows).toEqual([
      { restaurantId: 'r1', domain: 'a.com', requestedAt: expect.any(Date) },
      { restaurantId: 'r2', domain: 'b.com', requestedAt: expect.any(Date) },
    ]);
    expect(restaurantRepo.listStaleCustomDomainProvisioning).toHaveBeenCalled();
  });
});
