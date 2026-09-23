import { AcceptInvitationUseCase } from './accept-invitation.use-case.js';
import { hashInvitationToken } from './invitation-token.js';
import { Invitation } from '../../../domain/entities/invitation.entity.js';
import { User } from '../../../domain/entities/user.entity.js';
import { UserRestaurant } from '../../../domain/entities/user-restaurant.entity.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import {
  AccountHasRestaurantError,
  InvalidCredentialsError,
  InvitationEmailMismatchError,
  InvitationNotActiveError,
  InvitationNotFoundError,
} from '../../../domain/errors/domain-errors.js';

const RAW_TOKEN = 'token-crudo';
const DAY = 86_400_000;

function invitation(overrides: Partial<Record<string, unknown>> = {}) {
  const base = {
    id: 'inv1',
    restaurantId: 'r1',
    tokenHash: hashInvitationToken(RAW_TOKEN),
    email: null as string | null,
    createdBy: 'admin1',
    expiresAt: new Date(Date.now() + DAY),
    acceptedAt: null as Date | null,
    acceptedBy: null as string | null,
    revokedAt: null as Date | null,
    createdAt: new Date(),
    ...overrides,
  };
  return new Invitation(
    base.id,
    base.restaurantId,
    base.tokenHash,
    base.email,
    base.createdBy,
    base.expiresAt,
    base.acceptedAt,
    base.acceptedBy,
    base.revokedAt,
    base.createdAt,
  );
}

function build(
  options: {
    invitation?: Invitation | null;
    existingUser?: User | null;
    links?: UserRestaurant[];
    placeholderOwners?: number;
    placeholderItems?: number;
    googleEmail?: string | null;
    passwordValid?: boolean;
  } = {},
) {
  const inv =
    options.invitation === undefined ? invitation() : options.invitation;
  const createdUser = new User(
    'u-new',
    'duena@gmail.com',
    '',
    'Duena',
    true,
    new Date(),
  );

  const invitationRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByTokenHash: jest.fn().mockResolvedValue(inv),
    listByRestaurantId: jest.fn(),
    revokeOpenByRestaurantId: jest.fn(),
    revoke: jest.fn(),
    markAccepted: jest.fn().mockResolvedValue(inv),
    setAcceptedBy: jest.fn(),
    releaseAcceptance: jest.fn(),
  };
  const restaurantRepo = {
    findById: jest.fn().mockResolvedValue({
      id: 'r1',
      slug: 'pizzeria-demo',
      name: 'Pizzería Demo',
      claimed: false,
    } as Restaurant),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const userRepo = {
    findByEmail: jest.fn().mockResolvedValue(options.existingUser ?? null),
    create: jest.fn().mockResolvedValue(createdUser),
  };
  const userRestaurantRepo = {
    findByUserId: jest.fn().mockResolvedValue(options.links ?? []),
    findByRestaurantId: jest.fn().mockResolvedValue(
      Array.from({ length: options.placeholderOwners ?? 1 }, (_, i) => ({
        id: `ow${i}`,
      })),
    ),
    create: jest.fn(),
    delete: jest.fn(),
  };
  const subscriptionRepo = {
    findByRestaurantId: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    deleteManyByRestaurantId: jest.fn(),
  };
  const categoryRepo = { findByRestaurantId: jest.fn().mockResolvedValue([]) };
  const itemRepo = {
    findByRestaurantId: jest
      .fn()
      .mockResolvedValue(new Array(options.placeholderItems ?? 0).fill({})),
  };
  const orderRepo = {
    countByRestaurantIdSince: jest.fn().mockResolvedValue(0),
  };
  const refreshTokenRepo = { create: jest.fn() };
  const tokenProvider = {
    signAccess: jest.fn().mockReturnValue('access'),
    signRefresh: jest.fn().mockReturnValue('refresh'),
    verifyAccess: jest.fn(),
    verifyRefresh: jest.fn(),
  };
  const passwordHasher = {
    hash: jest.fn().mockResolvedValue('hashed'),
    verify: jest.fn().mockResolvedValue(options.passwordValid ?? false),
  };
  const googleVerifier = {
    verify: jest
      .fn()
      .mockResolvedValue(
        options.googleEmail === null
          ? null
          : { email: options.googleEmail ?? 'duena@gmail.com', name: 'Duena' },
      ),
  };

  const useCase = new AcceptInvitationUseCase(
    invitationRepo as never,
    restaurantRepo as never,
    userRepo as never,
    userRestaurantRepo as never,
    subscriptionRepo as never,
    categoryRepo as never,
    itemRepo as never,
    orderRepo as never,
    refreshTokenRepo as never,
    tokenProvider as never,
    passwordHasher as never,
    googleVerifier,
    [],
  );
  return {
    useCase,
    invitationRepo,
    restaurantRepo,
    userRepo,
    userRestaurantRepo,
    subscriptionRepo,
    passwordHasher,
  };
}

const google = { kind: 'google' as const, credential: 'id-token' };

describe('AcceptInvitationUseCase', () => {
  it('crea la cuenta con Google, la vincula como dueña y marca el local como reclamado', async () => {
    const t = build();
    const result = await t.useCase.execute(RAW_TOKEN, google);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.user.restaurantId).toBe('r1');
    expect(result.value.user.restaurantSlug).toBe('pizzeria-demo');
    expect(t.userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'duena@gmail.com',
        emailVerified: true,
      }),
    );
    expect(t.userRestaurantRepo.create).toHaveBeenCalledWith({
      userId: 'u-new',
      restaurantId: 'r1',
      role: UserRole.OWNER,
    });
    expect(t.restaurantRepo.update).toHaveBeenCalledWith('r1', {
      claimed: true,
    });
    expect(t.subscriptionRepo.create).toHaveBeenCalled();
    expect(t.invitationRepo.markAccepted).toHaveBeenCalledWith('inv1', null);
    expect(t.invitationRepo.setAcceptedBy).toHaveBeenCalledWith(
      'inv1',
      'u-new',
    );
  });

  it('rechaza un token que no existe', async () => {
    const t = build({ invitation: null });
    const result = await t.useCase.execute(RAW_TOKEN, google);
    expect(!result.ok && result.error).toBeInstanceOf(InvitationNotFoundError);
  });

  it('rechaza una invitación vencida sin tocar nada', async () => {
    const t = build({
      invitation: invitation({ expiresAt: new Date(Date.now() - 1000) }),
    });
    const result = await t.useCase.execute(RAW_TOKEN, google);
    expect(!result.ok && result.error).toBeInstanceOf(InvitationNotActiveError);
    expect(t.invitationRepo.markAccepted).not.toHaveBeenCalled();
    expect(t.userRepo.create).not.toHaveBeenCalled();
  });

  it('rechaza una invitación ya usada', async () => {
    const t = build({ invitation: invitation({ acceptedAt: new Date() }) });
    const result = await t.useCase.execute(RAW_TOKEN, google);
    expect(!result.ok && result.error).toBeInstanceOf(InvitationNotActiveError);
  });

  it('pierde la carrera si otra aceptación la reservó primero', async () => {
    const t = build();
    t.invitationRepo.markAccepted.mockResolvedValue(null);
    const result = await t.useCase.execute(RAW_TOKEN, google);
    expect(!result.ok && result.error).toBeInstanceOf(InvitationNotActiveError);
    expect(t.userRepo.create).not.toHaveBeenCalled();
  });

  it('rechaza si el token de Google no se puede verificar', async () => {
    const t = build({ googleEmail: null });
    const result = await t.useCase.execute(RAW_TOKEN, google);
    expect(!result.ok && result.error).toBeInstanceOf(InvalidCredentialsError);
  });

  it('respeta el email atado a la invitación', async () => {
    const t = build({
      invitation: invitation({ email: 'otra@gmail.com' }),
      googleEmail: 'duena@gmail.com',
    });
    const result = await t.useCase.execute(RAW_TOKEN, google);
    expect(!result.ok && result.error).toBeInstanceOf(
      InvitationEmailMismatchError,
    );
  });

  it('con email y contraseña de una cuenta existente exige la contraseña correcta', async () => {
    const existing = new User(
      'u1',
      'duena@gmail.com',
      'hash',
      'Duena',
      true,
      new Date(),
    );
    const t = build({ existingUser: existing, passwordValid: false });
    const result = await t.useCase.execute(RAW_TOKEN, {
      kind: 'password',
      name: 'Duena',
      email: 'duena@gmail.com',
      password: 'no-es-la-clave',
    });
    expect(!result.ok && result.error).toBeInstanceOf(InvalidCredentialsError);
    expect(t.invitationRepo.markAccepted).not.toHaveBeenCalled();
  });

  it('no deja entrar con contraseña a una cuenta creada con Google', async () => {
    const googleOnly = new User(
      'u1',
      'duena@gmail.com',
      '',
      'Duena',
      true,
      new Date(),
    );
    const t = build({ existingUser: googleOnly, passwordValid: true });
    const result = await t.useCase.execute(RAW_TOKEN, {
      kind: 'password',
      name: 'Duena',
      email: 'duena@gmail.com',
      password: 'cualquiera',
    });
    expect(!result.ok && result.error).toBeInstanceOf(InvalidCredentialsError);
    expect(t.passwordHasher.verify).not.toHaveBeenCalled();
  });

  it('rechaza una cuenta que ya administra un local con datos', async () => {
    const existing = new User(
      'u1',
      'duena@gmail.com',
      '',
      'Duena',
      true,
      new Date(),
    );
    const t = build({
      existingUser: existing,
      links: [new UserRestaurant('ur1', 'u1', 'r-otro', UserRole.OWNER)],
      placeholderItems: 3,
    });
    const result = await t.useCase.execute(RAW_TOKEN, google);
    expect(!result.ok && result.error).toBeInstanceOf(
      AccountHasRestaurantError,
    );
    expect(t.restaurantRepo.delete).not.toHaveBeenCalled();
    expect(t.invitationRepo.markAccepted).not.toHaveBeenCalled();
  });

  it('reemplaza el local vacío de una cuenta existente por el invitado', async () => {
    const existing = new User(
      'u1',
      'duena@gmail.com',
      '',
      'Duena',
      true,
      new Date(),
    );
    const t = build({
      existingUser: existing,
      links: [new UserRestaurant('ur1', 'u1', 'r-vacio', UserRole.OWNER)],
    });
    const result = await t.useCase.execute(RAW_TOKEN, google);
    expect(result.ok).toBe(true);
    expect(t.userRestaurantRepo.delete).toHaveBeenCalledWith('ur1');
    expect(t.restaurantRepo.delete).toHaveBeenCalledWith('r-vacio');
    expect(t.userRepo.create).not.toHaveBeenCalled();
    expect(t.userRestaurantRepo.create).toHaveBeenCalledWith({
      userId: 'u1',
      restaurantId: 'r1',
      role: UserRole.OWNER,
    });
    expect(t.invitationRepo.markAccepted).toHaveBeenCalledWith('inv1', 'u1');
  });

  it('no borra un local vacío que comparte con otros dueños', async () => {
    const existing = new User(
      'u1',
      'duena@gmail.com',
      '',
      'Duena',
      true,
      new Date(),
    );
    const t = build({
      existingUser: existing,
      links: [new UserRestaurant('ur1', 'u1', 'r-compartido', UserRole.OWNER)],
      placeholderOwners: 2,
    });
    const result = await t.useCase.execute(RAW_TOKEN, google);
    expect(!result.ok && result.error).toBeInstanceOf(
      AccountHasRestaurantError,
    );
    expect(t.restaurantRepo.delete).not.toHaveBeenCalled();
  });

  it('si falla la toma de posesión libera la invitación para reintentar', async () => {
    const t = build();
    t.userRepo.create.mockRejectedValue(new Error('mongo caído'));
    await expect(t.useCase.execute(RAW_TOKEN, google)).rejects.toThrow(
      'mongo caído',
    );
    expect(t.invitationRepo.markAccepted).toHaveBeenCalled();
    expect(t.invitationRepo.releaseAcceptance).toHaveBeenCalledWith('inv1');
    expect(t.userRestaurantRepo.create).not.toHaveBeenCalled();
  });
});
