import { RequestStoreClaimUseCase } from './request-store-claim.use-case.js';
import { ApproveStoreClaimUseCase } from './approve-store-claim.use-case.js';
import { RejectStoreClaimUseCase } from './reject-store-claim.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { StoreClaim } from '../../../domain/entities/store-claim.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import {
  RestaurantNotFoundError,
  StoreAlreadyClaimedError,
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
    '',
    '',
    '',
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
  function deps(claim: StoreClaim | null = makeClaim()) {
    const claimRepo: any = {
      findById: jest.fn().mockResolvedValue(claim),
      updateStatus: jest.fn(),
    };
    const invitation = {
      id: 'inv1',
      url: 'https://quiero.menu/invitacion/tok',
      email: 'juan@local.com',
      expiresAt: new Date('2026-10-08'),
      emailSent: true,
    };
    const createInvitation: any = {
      execute: jest.fn().mockResolvedValue({ ok: true, value: invitation }),
    };
    return { claimRepo, createInvitation, invitation };
  }

  it('genera una invitación atada al email del solicitante y aprueba el pedido', async () => {
    const d = deps();
    const out = await new ApproveStoreClaimUseCase(
      d.claimRepo,
      d.createInvitation,
    ).execute('c1', { adminUserId: 'admin1' });
    expect(out).toEqual({
      ok: true,
      value: {
        restaurantId: 'r1',
        claimant: {
          name: 'Juan',
          phone: '+59899111111',
          email: 'juan@local.com',
        },
        invitation: d.invitation,
      },
    });
    expect(d.createInvitation.execute).toHaveBeenCalledWith({
      restaurantId: 'r1',
      adminUserId: 'admin1',
      email: 'juan@local.com',
      sendEmail: true,
    });
    expect(d.claimRepo.updateStatus).toHaveBeenCalledWith('c1', 'approved');
  });

  it('usa el email corregido por el admin, normalizado', async () => {
    const d = deps();
    await new ApproveStoreClaimUseCase(d.claimRepo, d.createInvitation).execute(
      'c1',
      {
        adminUserId: 'admin1',
        email: '  Dueno@Local.com ',
      },
    );
    expect(d.createInvitation.execute).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'dueno@local.com' }),
    );
  });

  it('no aprueba si la invitación falla', async () => {
    const d = deps();
    d.createInvitation.execute.mockResolvedValue({
      ok: false,
      error: new RestaurantNotFoundError(),
    });
    const out = await new ApproveStoreClaimUseCase(
      d.claimRepo,
      d.createInvitation,
    ).execute('c1', { adminUserId: 'admin1' });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeInstanceOf(RestaurantNotFoundError);
    expect(d.claimRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('error si el pedido no está pendiente', async () => {
    const d = deps(makeClaim('approved'));
    const out = await new ApproveStoreClaimUseCase(
      d.claimRepo,
      d.createInvitation,
    ).execute('c1', { adminUserId: 'admin1' });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeInstanceOf(ClaimNotPendingError);
    expect(d.createInvitation.execute).not.toHaveBeenCalled();
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
