import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { BackfillDirectoryDataUseCase } from '../../application/use-cases/restaurant/backfill-directory-data.use-case.js';

/**
 * Al arrancar la API, completa los datos que el directorio necesita para los
 * locales creados ANTES de que existieran esos campos:
 *  - citySlug desde city (join key de /en/{ciudad}).
 *  - category inferida de los nombres de platos (solo si está vacía).
 * Es idempotente: solo escribe lo que falta y nunca rompe el boot.
 */
@Injectable()
export class DirectoryBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DirectoryBackfillService.name);

  constructor(
    @Inject('BackfillDirectoryDataUseCase')
    private readonly backfill: BackfillDirectoryDataUseCase,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const result = await this.backfill.execute();
      if (result.citySlugFixed > 0 || result.categoryInferred > 0) {
        this.logger.log(
          `Directory backfill: ${result.citySlugFixed} citySlug, ${result.categoryInferred} category`,
        );
      }
    } catch (err) {
      this.logger.error(
        'Directory backfill failed (non-fatal)',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
