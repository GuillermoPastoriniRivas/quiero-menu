import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants.js';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { BehaviorService } from '../services/behavior.service.js';
import type { RequestUser } from '../decorators/current-user.decorator.js';
import { excludesBehavior } from '../controllers/behavior.controller.js';
import type { BehaviorContext } from '../../domain/entities/behavior-event.entity.js';

// Semantic successful operations, never a dump of request bodies or API traffic.
export const OWNER_OPERATIONS: Record<string, string> = {
  'POST /menu/items': 'menu_item_created',
  'PATCH /menu/items/:id': 'menu_item_updated',
  'DELETE /menu/items/:id': 'menu_item_deleted',
  'PATCH /menu/items/:id/toggle-availability': 'menu_availability_changed',
  'POST /menu/categories': 'category_created',
  'PATCH /menu/categories/:id': 'category_updated',
  'DELETE /menu/categories/:id': 'category_deleted',
  'POST /onboarding/import': 'menu_imported',
  'POST /onboarding/analyze': 'menu_analyzed',
  'PATCH /restaurants/current': 'business_updated',
  'PATCH /restaurants/current/operating-hours': 'hours_updated',
  'PATCH /restaurants/current/open-status': 'open_status_changed',
  'POST /restaurants/current/activation/shared': 'link_shared',
  'POST /billing/checkout': 'pro_checkout_started',
  'POST /billing/cancel': 'subscription_cancel_requested',
  'PATCH /auth/password': 'owner_password_set',
  'POST /coupons': 'coupon_created',
  'PATCH /coupons/:id': 'coupon_updated',
  'PUT /restaurants/current/custom-domain': 'custom_domain_requested',
  'DELETE /restaurants/current/custom-domain': 'custom_domain_removed',
  'PATCH /orders/:id/status': 'order_status_changed',
};

@Injectable()
export class BehaviorInterceptor implements NestInterceptor {
  constructor(
    private readonly behavior: BehaviorService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    // Resolve the route template through metadata: never depends on the global
    // prefix, the API version or the concrete param values.
    const controller =
      this.reflector.get<string>(PATH_METADATA, context.getClass()) ?? '';
    const method =
      this.reflector.get<string>(PATH_METADATA, context.getHandler()) ?? '';
    const key = `${request.method} ${`/${controller}/${method}`.replace(/\/+/g, '/').replace(/\/$/, '')}`;
    return next.handle().pipe(
      tap((response: unknown) => {
        // Analytics must not alter the result even if malformed input/model changes occur.
        try {
          this.success(request, key, response);
        } catch {
          /* best effort */
        }
      }),
    );
  }

  private success(
    request: Request & { user?: RequestUser },
    key: string,
    response: unknown,
  ): void {
    if (key.includes(' /behavior')) return;
    const user = request.user;
    const internal =
      user?.platformAdmin || user?.impersonating || user?.operating;
    const context = excludesBehavior(request)
      ? undefined
      : this.behavior.context(request.headers['x-qm-analytics']);
    const out = response as Record<string, unknown> | undefined;

    if (
      ['POST /auth/login', 'POST /auth/signup', 'POST /auth/google'].includes(
        key,
      )
    ) {
      const account = out?.user as
        | {
            id?: string;
            restaurantId?: string;
            platformAdmin?: boolean;
            operating?: boolean;
            impersonating?: boolean;
          }
        | undefined;
      if (
        !account?.id ||
        account.platformAdmin ||
        account.operating ||
        account.impersonating
      )
        return;
      this.behavior.background(
        this.behavior.repository.touchUser(account.id, true),
      );
      const data = {
        actorUserId: account.id,
        restaurantId: account.restaurantId,
        context,
      };
      const signup = key === 'POST /auth/signup' || out?.newAccount === true;
      this.behavior.record(signup ? 'owner_signup' : 'owner_login', {
        ...data,
        properties: {
          method: key === 'POST /auth/google' ? 'google' : 'password',
        },
      });
      if (key === 'POST /auth/google')
        this.behavior.record('owner_email_verified', data);
      return;
    }

    if (key === 'POST /storefront/:slug/orders') {
      const order = out?.order as
        | {
            id?: string;
            restaurantId?: string;
            total?: number;
            deliveryType?: string;
            paymentMethod?: string;
            attribution?: BehaviorContext | null;
          }
        | undefined;
      if (!order?.id) return;
      const properties: Record<string, string | number | boolean> = {
        orderId: order.id,
      };
      if (typeof order.total === 'number') properties.value = order.total;
      if (Array.isArray(out?.items)) properties.itemsCount = out.items.length;
      if (order.deliveryType) properties.deliveryType = order.deliveryType;
      if (order.paymentMethod) properties.paymentMethod = order.paymentMethod;
      this.behavior.record('order_created', {
        eventId: `order:${order.id}`,
        audience: 'diner',
        restaurantId: order.restaurantId,
        context: order.attribution ?? undefined,
        properties,
      });
      return;
    }

    if (!user?.restaurantId || internal) return;
    if (
      (request.method !== 'GET' &&
        (key.startsWith('POST /menu') ||
          key.startsWith('PATCH /menu') ||
          key.startsWith('DELETE /menu') ||
          key === 'POST /onboarding/import')) ||
      key === 'GET /restaurants/current/activation'
    ) {
      this.behavior.background(
        this.behavior.repository.observeMenu(user.restaurantId, user._id),
      );
    }
    const event = OWNER_OPERATIONS[key];
    if (!event) return;
    const status = (out?.status ??
      (out?.order as { status?: string } | undefined)?.status) as
      | string
      | undefined;
    this.behavior.record(event, {
      restaurantId: user.restaurantId,
      actorUserId: user._id,
      context,
      properties:
        key === 'PATCH /orders/:id/status'
          ? { status: status ?? 'unknown' }
          : {},
    });
    if (key === 'PATCH /orders/:id/status' && status === 'preparing')
      this.behavior.record('order_accepted', {
        restaurantId: user.restaurantId,
        actorUserId: user._id,
      });
    this.behavior.background(
      this.behavior.repository.touchUser(user._id, false),
    );
  }
}
