import { ListAuditLogsUseCase } from './list-audit-logs.use-case.js';
import { AuditLogRepository } from '../../../domain/repositories/audit-log.repository.js';

describe('ListAuditLogsUseCase', () => {
  function buildUseCase(
    overrides: { auditLogRepo?: Partial<AuditLogRepository> } = {},
  ) {
    const auditLogRepo: AuditLogRepository = {
      append: jest.fn(),
      findRecent: jest.fn().mockResolvedValue([
        {
          id: 'log1',
          event: 'admin.impersonated',
          actorUserId: 'admin1',
          restaurantId: 'r1',
          metadata: { targetEmail: 'x@y.com' },
          createdAt: new Date('2026-08-26T10:00:00Z'),
        },
      ]),
      ...overrides.auditLogRepo,
    };
    return new ListAuditLogsUseCase(auditLogRepo);
  }

  it('devuelve las entradas recientes del log', async () => {
    const findRecent = jest.fn().mockResolvedValue([]);
    const useCase = buildUseCase({ auditLogRepo: { findRecent } });

    await useCase.execute(50);

    expect(findRecent).toHaveBeenCalledWith(50);
  });

  it('propaga lo que devuelve el repositorio', async () => {
    const useCase = buildUseCase();

    const entries = await useCase.execute(10);

    expect(entries).toHaveLength(1);
    expect(entries[0].event).toBe('admin.impersonated');
  });
});
