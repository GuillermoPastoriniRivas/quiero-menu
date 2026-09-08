import { Controller, Get, Inject, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
   *
   * Throttle explícito: cada query con resultados registra un término en
   * `search_terms` (inteligencia de demanda). Sin límite, un scraper
   * inflaría esa señal y martillarías Mongo con upserts.
   */
  @Public()
  @Throttle({
    short: { ttl: 1000, limit: 10 },
    medium: { ttl: 60000, limit: 60 },
  })
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
