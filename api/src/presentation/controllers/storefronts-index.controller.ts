import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../decorators/public.decorator.js';
import type { ListActiveStorefrontsUseCase } from '../../application/use-cases/restaurant/list-active-storefronts.use-case.js';

@Controller('storefronts')
export class StorefrontsIndexController {
  constructor(
    @Inject('ListActiveStorefrontsUseCase')
    private readonly listActive: ListActiveStorefrontsUseCase,
  ) {}

  @Public()
  @Get('index')
  async index() {
    return this.listActive.execute();
  }
}
