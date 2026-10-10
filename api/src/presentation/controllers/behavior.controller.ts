import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import type { TokenProviderPort } from '../../application/ports/token-provider.port.js';
import type { RestaurantRepository } from '../../domain/repositories/restaurant.repository.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import type { BehaviorEvent } from '../../domain/entities/behavior-event.entity.js';
import { Public } from '../decorators/public.decorator.js';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { AdminGuard } from '../guards/admin.guard.js';
import { BehaviorService } from '../services/behavior.service.js';
import {
  BehaviorBatchSchema,
  BehaviorQuerySchema,
  DINER_EVENTS,
  OWNER_EVENTS,
  PUBLIC_EVENTS,
  TRACKING_EVENTS,
} from '../request-dtos/behavior.dto.js';

export function excludesBehavior(request: Pick<Request, 'headers'>): boolean {
  return (
    request.headers.dnt === '1' ||
    request.headers['sec-gpc'] === '1' ||
    /bot\b|crawler|spider|headless|lighthouse|preview|facebookexternalhit/i.test(
      String(request.headers['user-agent'] ?? ''),
    )
  );
}

export function internalBehaviorViewer(
  request: Pick<Request, 'headers'>,
  tokens: TokenProviderPort,
  restaurantId?: string,
): boolean {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return false;
  try {
    const user = tokens.verifyAccess(authorization.slice(7));
    return (
      user.plat === true ||
      user.imp === true ||
      user.act === true ||
      (Boolean(restaurantId) && user.restaurantId === restaurantId)
    );
  } catch {
    return false;
  }
}

@Controller('behavior')
@Throttle({
  short: { limit: 10, ttl: 1000 },
  medium: { limit: 60, ttl: 60_000 },
})
export class BehaviorController {
  constructor(
    private readonly behavior: BehaviorService,
    @Inject('RestaurantRepository')
    private readonly restaurants: RestaurantRepository,
    @Inject('OrderRepository') private readonly orders: OrderRepository,
    @Inject('TokenProviderPort') private readonly tokens: TokenProviderPort,
  ) {}

  @Public()
  @Post('events')
  async publicEvents(@Req() request: Request, @Body() body: unknown) {
    return this.ingest(request, body, PUBLIC_EVENTS, 'acquisition');
  }

  @Public()
  @Post('storefront/:slug')
  async storefront(
    @Param('slug') slug: string,
    @Req() request: Request,
    @Body() body: unknown,
  ) {
    const restaurant = await this.restaurants.findBySlug(slug);
    if (!restaurant) throw new NotFoundException();
    return this.ingest(request, body, DINER_EVENTS, 'diner', restaurant.id);
  }

  @Public()
  @Post('tracking/:token')
  async tracking(
    @Param('token') token: string,
    @Req() request: Request,
    @Body() body: unknown,
  ) {
    const order = await this.orders.findByTrackingToken(token);
    if (!order) throw new NotFoundException();
    return this.ingest(
      request,
      body,
      TRACKING_EVENTS,
      'diner',
      order.restaurantId,
      undefined,
      order.id,
    );
  }

  @Post('owner')
  async owner(
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
    @Body() body: unknown,
  ) {
    if (
      user.impersonating ||
      user.operating ||
      user.platformAdmin ||
      !user.restaurantId
    )
      return { accepted: 0 };
    const result = await this.ingest(
      request,
      body,
      OWNER_EVENTS,
      'owner',
      user.restaurantId,
      user._id,
    );
    if (result.accepted)
      this.behavior.background(
        this.behavior.repository.touchUser(user._id, false),
      );
    return result;
  }

  @Get('overview')
  async ownerOverview(
    @CurrentUser() user: RequestUser,
    @Query() query: unknown,
  ) {
    if (!user.restaurantId)
      throw new BadRequestException('Restaurant session required');
    const parsed = BehaviorQuerySchema.safeParse(query);
    if (!parsed.success)
      throw new BadRequestException('Invalid analytics range');
    // Never accept the requested restaurantId for a tenant-scoped report.
    return this.behavior.repository.overview({
      days: parsed.data.days,
      restaurantId: user.restaurantId,
    });
  }

  @UseGuards(AdminGuard)
  @Get('admin/overview')
  async adminOverview(@Query() query: unknown) {
    const parsed = BehaviorQuerySchema.safeParse(query);
    if (!parsed.success)
      throw new BadRequestException('Invalid analytics range');
    return this.behavior.repository.overview(parsed.data);
  }

  private async ingest(
    request: Request,
    body: unknown,
    allowed: readonly string[],
    audience: BehaviorEvent['audience'],
    restaurantId?: string,
    actorUserId?: string,
    orderId?: string,
  ) {
    if (excludesBehavior(request)) return { accepted: 0 };
    if (audience !== 'owner' && this.internalViewer(request, restaurantId))
      return { accepted: 0 };
    let input = body;
    if (typeof input === 'string') {
      try {
        input = JSON.parse(input);
      } catch {
        throw new BadRequestException('Invalid analytics payload');
      }
    }
    const parsed = BehaviorBatchSchema.safeParse(input);
    if (
      !parsed.success ||
      parsed.data.events.some((e) => !allowed.includes(e.event))
    )
      throw new BadRequestException('Invalid analytics events');
    const now = new Date();
    const events: BehaviorEvent[] = parsed.data.events.map((e) => ({
      eventId: e.eventId,
      event: e.event,
      // Delayed beacons are accepted for 24h; arbitrary historical/future dates are not.
      occurredAt: new Date(
        Math.max(
          now.getTime() - 86_400_000,
          Math.min(now.getTime(), Date.parse(e.occurredAt)),
        ),
      ),
      receivedAt: now,
      audience,
      source: 'client',
      restaurantId,
      actorUserId,
      context: parsed.data.context,
      properties: { ...e.properties, ...(orderId ? { orderId } : {}) },
    }));
    return { accepted: await this.behavior.repository.append(events) };
  }

  internalViewer(request: Request, restaurantId?: string): boolean {
    return internalBehaviorViewer(request, this.tokens, restaurantId);
  }
}
