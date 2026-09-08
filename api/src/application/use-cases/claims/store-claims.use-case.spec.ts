import { RequestStoreClaimUseCase } from './request-store-claim.use-case.js';
import { ApproveStoreClaimUseCase } from './approve-store-claim.use-case.js';
import { RejectStoreClaimUseCase } from './reject-store-claim.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { StoreClaim } from '../../../domain/entities/store-claim.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import {
  RestaurantNotFoundError,
  StoreAlreadyClaimedError,
  EmailAlreadyExistsError,
  ClaimNotPendingError,
} from '../../../domain/errors/domain-errors.js';

function makeRestaurant(claimed?: boolean) {
  return new Restaurant(
    'r1',
    'la-famosa',
    'La Famosa',
    '',
    '',
    '',
    '',
    'Paysandu',
    'AR',
    null,
    '+59899000000',
    'America/Argentina/Buenos_Aires',
    'ARS',
    RestaurantStatus.ACTIVE,
    null,
    null,
    null,
    null,
    { cashEnabled: true, cardEnabled: true, transferEnabled: true },
    { primaryColor: '#E8532C' },
    new Date(),
    new Date(),
    undefined,
    undefined,
    claimed,
  );
}

function makeClaim(status: 'pending' | 'approved' | 'rejected' = 'pending') {
  return new StoreClaim(
    'c1',
    'r1',
    'Juan',
    '+59899111111',
    'juan@local.com',
    '',
    status,
    new Date(),
    null,
  );
}

describe('RequestStoreClaimUseCase', () => {
  function deps(restaurant: Restaurant | null, pending: StoreClaim[] = []) {
    const restaurantRepo: any = {
      findBySlug: jest.fn().mockResolvedValue(restaurant),
    };
    const claimRepo: any = {
      findPendingByRestaurantId: jest.fn().mockResolvedValue(pending),
      create: jest.fn((d: any) =>
        Promise.resolve(
          new StoreClaim(
            'c2',
            d.restaurantId,
            d.name,
            d.phone,
            d.email,
            d.message,
            'pending',
            new Date(),
            null,
          ),
        ),
      ),
    };
    return { restaurantRepo, claimRepo };
  }

  it('404 si el slug no existe', async () => {
    const d = deps(null);
    const uc = new RequestStoreClaimUseCase(d.restaurantRepo, d.claimRepo);
    const out = await uc.execute('nope', {
      name: 'Juan',
      phone: '+59899111111',
      email: 'juan@local.com',
      message: '',
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeInstanceOf(RestaurantNotFoundError);
  });

  it('conflicto si el local ya tiene dueño', async () => {
    const d = deps(makeRestaurant(true));
    const uc = new RequestStoreClaimUseCase(d.restaurantRepo, d.claimRepo);
    const out = await uc.execute('la-famosa', {
      name: 'Juan',
      phone: '+59899111111',
      email: 'juan@local.com',
      message: '',
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeInstanceOf(StoreAlreadyClaimedError);
    expect(d.claimRepo.create).not.toHaveBeenCalled();
  });

  it('devuelve duplicado si ya hay pedido pendiente del mismo teléfono', async () => {
    const d = deps(makeRestaurant(false), [makeClaim()]);
    const uc = new RequestStoreClaimUseCase(d.restaurantRepo, d.claimRepo);
    const out = await uc.execute('la-famosa', {
      name: 'Juan',
      phone: '+59899111111',
      email: 'otro@mail.com',
      message: '',
    });
    expect(out).toEqual({
      ok: true,
      value: { claimId: 'c1', duplicate: true },
    });
    expect(d.claimRepo.create).not.toHaveBeenCalled();
  });

  it('crea el pedido cuando el local es inventario', async () => {
    const d = deps(makeRestaurant(false));
    const uc = new RequestStoreClaimUseCase(d.restaurantRepo, d.claimRepo);
    const out = await uc.execute('la-famosa', {
      name: 'Juan',
      phone: '+59899222222',
      email: 'juan@local.com',
      message: 'Soy el dueño',
    });
    expect(out).toEqual({
      ok: true,
      value: { claimId: 'c2', duplicate: false },
    });
  });
});

describe('ApproveStoreClaimUseCase', () => {
  function deps(opts: { emailExists: boolean; subscriptionExists: boolean }) {
    const claimRepo: any = {
      findById: jest.fn().mockResolvedValue(makeClaim()),
      updateStatus: jest.fn(),
    };
    const restaurantRepo: any = {
      findById: jest.fn().mockResolvedValue(makeRestaurant(false)),
      update: jest.fn(),
    };
    const userRepo: any = {
      findByEmail: jest
        .fn()
        .mockResolvedValue(opts.emailExists ? { id: 'u0' } : null),
      create: jest.fn((d: any) => Promise.resolve({ id: 'u1', ...d })),
    };
    const userRestaurantRepo: any = { create: jest.fn() };
    const subscriptionRepo: any = {
      findByRestaurantId: jest
        .fn()
        .mockResolvedValue(opts.subscriptionExists ? { id: 's1' } : null),
      create: jest.fn(),
    };
    const verificationTokenRepo: any = {
      deleteAllByUserId: jest.fn(),
      create: jest.fn(),
    };
    const passwordHasher: any = {
      hash: jest.fn(() => Promise.resolve('hashed')),
    };
    const emailService: any = { send: jest.fn() };
    return {
      claimRepo,
      restaurantRepo,
      userRepo,
      userRestaurantRepo,
      subscriptionRepo,
      verificationTokenRepo,
      passwordHasher,
      emailService,
    };
  }

  function makeApprove(d: ReturnType<typeof deps>) {
    return new ApproveStoreClaimUseCase(
      d.claimRepo,
      d.restaurantRepo,
      d.userRepo,
      d.userRestaurantRepo,
      d.subscriptionRepo,
      d.verificationTokenRepo,
      d.passwordHasher,
      d.emailService,
      'https://quiero.menu',
    );
  }

  it('rechaza si el email ya existe (modelo single-tenant por usuario)', async () => {
    const d = deps({ emailExists: true, subscriptionExists: true });
    const out = await makeApprove(d).execute('c1', {
      ownerName: 'Juan',
      email: 'juan@local.com',
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeInstanceOf(EmailAlreadyExistsError);
    expect(d.userRestaurantRepo.create).not.toHaveBeenCalled();
  });

  it('crea usuario OWNER, marca claimed y manda email de contraseña', async () => {
    const d = deps({ emailExists: false, subscriptionExists: false });
    const out = await makeApprove(d).execute('c1', {
      ownerName: 'Juan',
      email: 'juan@local.com',
    });
    expect(out).toEqual({
      ok: true,
      value: { userId: 'u1', restaurantId: 'r1' },
    });
    expect(d.userRestaurantRepo.create).toHaveBeenCalledWith({
      userId: 'u1',
      restaurantId: 'r1',
      role: UserRole.OWNER,
    });
    expect(d.subscriptionRepo.create).toHaveBeenCalled();
    expect(d.restaurantRepo.update).toHaveBeenCalledWith('r1', {
      claimed: true,
    });
    expect(d.claimRepo.updateStatus).toHaveBeenCalledWith('c1', 'approved');
    expect(d.verificationTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', type: 'password_reset' }),
    );
    expect(d.emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'juan@local.com' }),
    );
  });

  it('error si el pedido no está pendiente', async () => {
    const d = deps({ emailExists: false, subscriptionExists: true });
    d.claimRepo.findById.mockResolvedValue(makeClaim('approved'));
    const out = await makeApprove(d).execute('c1', {
      ownerName: 'Juan',
      email: 'juan@local.com',
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeInstanceOf(ClaimNotPendingError);
  });
});

describe('RejectStoreClaimUseCase', () => {
  it('marca rejected solo si está pendiente', async () => {
    const claimRepo: any = {
      findById: jest.fn().mockResolvedValue(makeClaim()),
      updateStatus: jest.fn(),
    };
    const uc = new RejectStoreClaimUseCase(claimRepo);
    const out = await uc.execute('c1');
    expect(out).toEqual({ ok: true, value: { ok: true } });
    expect(claimRepo.updateStatus).toHaveBeenCalledWith('c1', 'rejected');

    claimRepo.findById.mockResolvedValue(makeClaim('rejected'));
    const out2 = await uc.execute('c1');
    expect(out2.ok).toBe(false);
  });
});
