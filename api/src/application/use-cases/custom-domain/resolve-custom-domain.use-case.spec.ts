import { ResolveCustomDomainUseCase } from './resolve-custom-domain.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { CustomDomainNotActiveError } from '../../../domain/errors/domain-errors.js';

function makeRestaurant(
  customDomain: string | null,
  state: 'pending' | 'active' | null,
): Restaurant {
  return new Restaurant(
    'r1',
    'mi-resto',
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
    customDomain,
    state ? { state, requestedAt: new Date() } : null,
    null,
    { cashEnabled: true, cardEnabled: true, transferEnabled: true },
    { primaryColor: '#000000' },
    new Date(),
    new Date(),
  );
}

describe('ResolveCustomDomainUseCase', () => {
  it('resuelve el slug cuando el dominio está activo', async () => {
    const restaurantRepo = {
      findByCustomDomain: jest
        .fn()
        .mockResolvedValue(makeRestaurant('menu.mirestaurante.com', 'active')),
    };
    const useCase = new ResolveCustomDomainUseCase(restaurantRepo as any);

    const result = await useCase.execute('Menu.MiRestaurante.com');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ slug: 'mi-resto', restaurantId: 'r1' });
    }
    expect(restaurantRepo.findByCustomDomain).toHaveBeenCalledWith(
      'menu.mirestaurante.com',
    );
  });

  it('rechaza cuando el dominio no está activo (pending)', async () => {
    const restaurantRepo = {
      findByCustomDomain: jest
        .fn()
        .mockResolvedValue(makeRestaurant('menu.mirestaurante.com', 'pending')),
    };
    const useCase = new ResolveCustomDomainUseCase(restaurantRepo as any);

    const result = await useCase.execute('menu.mirestaurante.com');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(CustomDomainNotActiveError);
    }
  });

  it('rechaza cuando no existe el dominio', async () => {
    const restaurantRepo = {
      findByCustomDomain: jest.fn().mockResolvedValue(null),
    };
    const useCase = new ResolveCustomDomainUseCase(restaurantRepo as any);

    const result = await useCase.execute('nadie.com');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(CustomDomainNotActiveError);
    }
  });
});
