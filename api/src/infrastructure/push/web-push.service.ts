import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { PushServicePort, PushPayload } from '../../application/ports/push-service.port.js';
import { PushSubscriptionRepository } from '../../domain/repositories/push-subscription.repository.js';
import { PushSubscription } from '../../domain/entities/push-subscription.entity.js';

interface RawSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

@Injectable()
export class WebPushService implements PushServicePort {
  private readonly logger = new Logger(WebPushService.name);
  private readonly publicKey: string;

  constructor(
    @Inject('PushSubscriptionRepository') private readonly subRepo: PushSubscriptionRepository,
    config: ConfigService,
  ) {
    this.publicKey = config.get<string>('vapid.publicKey')!;
    const privateKey = config.get<string>('vapid.privateKey')!;
    const subject = config.get<string>('vapid.subject')!;
    webpush.setVapidDetails(subject, this.publicKey, privateKey);
  }

  getVapidPublicKey(): string {
    return this.publicKey;
  }

  async subscribeStaff(userId: string, restaurantId: string, subscription: RawSubscription): Promise<void> {
    await this.subRepo.deleteByEndpoint(subscription.endpoint);
    await this.subRepo.create({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userId,
      restaurantId,
      orderCode: null,
      orderSlug: null,
    });
  }

  async subscribeOrder(orderCode: string, slug: string, subscription: RawSubscription): Promise<void> {
    await this.subRepo.deleteByEndpoint(subscription.endpoint);
    await this.subRepo.create({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userId: null,
      restaurantId: null,
      orderCode,
      orderSlug: slug,
    });
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.subRepo.deleteByEndpoint(endpoint);
  }

  async sendToRestaurant(restaurantId: string, payload: PushPayload): Promise<void> {
    const subs = await this.subRepo.findByRestaurantId(restaurantId);
    await this.sendToMany(subs, payload);
  }

  async sendToOrder(orderCode: string, payload: PushPayload): Promise<void> {
    const subs = await this.subRepo.findByOrderCode(orderCode);
    await Promise.all(subs.map((sub) => this.sendOne(sub, {
      ...payload,
      url: payload.url ?? `/tracking/${orderCode}?slug=${sub.orderSlug ?? ''}`,
    })));
  }

  private async sendToMany(subs: PushSubscription[], payload: PushPayload): Promise<void> {
    await Promise.all(subs.map((sub) => this.sendOne(sub, payload)));
  }

  private async sendOne(sub: PushSubscription, payload: PushPayload): Promise<void> {
    const body = JSON.stringify({ ...payload, icon: '/icon-192.png', badge: '/icon-192.png' });
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: sub.keys,
      }, body);
    } catch (err: any) {
      // 404/410: la suscripción ya no es válida (el cliente la desregistró o el
      // push service la purgó). La limpiamos para no acumular endpoints muertos.
      const statusCode = err?.statusCode ?? err?.status ?? 0;
      if (statusCode === 404 || statusCode === 410) {
        this.logger.warn(`Removing stale push subscription ${sub.endpoint}`);
        await this.subRepo.deleteByEndpoint(sub.endpoint);
      } else {
        this.logger.error(`Push send failed for ${sub.endpoint}: ${err?.message ?? err}`);
      }
    }
  }
}