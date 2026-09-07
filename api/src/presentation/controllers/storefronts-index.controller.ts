import { Controller, Get, Inject, Query } from '@nestjs/common';
import { Public } from '../decorators/public.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  StorefrontSearchRequestSchema,
  StorefrontSearchRequestDto,
} from '../request-dtos/storefront-search.dto.js';
import type { ListActiveStorefrontsUseCase } from '../../application/use-cases/restaurant/list-active-storefronts.use-case.js';
import type { SearchStorefrontsUseCase } from '../../application/use-cases/restaurant/search-storefronts.use-case.js';

@Controller('storefronts')
export class StorefrontsIndexController {
  constructor(
    @Inject('ListActiveStorefrontsUseCase')
    private readonly listActive: ListActiveStorefrontsUseCase,
    @Inject('SearchStorefrontsUseCase')
    private readonly searchStorefronts: SearchStorefrontsUseCase,
  ) {}

  @Public()
  @Get('index')
  async index() {
    return this.listActive.execute();
  }

  /**
   * Búsqueda del directorio: nombre, rubro, descripción y platos de la carta
   * visible. El comensal busca "milanesa", no "Leonardo's".
   */
  @Public()
  @Get('search')
  async search(
    @Query(new ZodValidationPipe(StorefrontSearchRequestSchema))
    query: StorefrontSearchRequestDto,
  ) {
    return this.searchStorefronts.execute({
      q: query.q,
      citySlug: query.city,
      openNow: query.openNow,
      limit: query.limit,
    });
  }
}
