import { Controller, Get, Query, Inject } from '@nestjs/common';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  AnalyticsOverviewQuerySchema,
  AnalyticsOverviewQueryDto,
} from '../request-dtos/analytics.dto.js';
import type { GetAnalyticsOverviewUseCase } from '../../application/use-cases/analytics/get-analytics-overview.use-case.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    @Inject('GetAnalyticsOverviewUseCase')
    private readonly getOverview: GetAnalyticsOverviewUseCase,
  ) {}

  @Get('overview')
  async overview(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(AnalyticsOverviewQuerySchema))
    query: AnalyticsOverviewQueryDto,
  ) {
    return this.getOverview.execute(user.restaurantId, query.range);
  }
}
