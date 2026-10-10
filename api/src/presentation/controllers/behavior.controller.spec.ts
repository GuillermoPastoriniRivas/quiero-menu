import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { text } from 'express';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { BehaviorController } from './behavior.controller.js';
import { BehaviorService } from '../services/behavior.service.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { BehaviorContextSchema } from '../request-dtos/behavior.dto.js';

const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const append = jest.fn().mockResolvedValue(1);
const overview = jest.fn().mockResolvedValue({});

describe('Behavior HTTP boundaries', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [BehaviorController],
      providers: [
        JwtAuthGuard,
        {
          provide: BehaviorService,
          useValue: {
            repository: {
              append,
              overview,
              touchUser: () => Promise.resolve(),
            },
            background: () => {},
          },
        },
        {
          provide: 'RestaurantRepository',
          useValue: { findBySlug: () => Promise.resolve({ id: A }) },
        },
        {
          provide: 'OrderRepository',
          useValue: {
            findByTrackingToken: () =>
              Promise.resolve({ id: 'order', restaurantId: A }),
          },
        },
        {
          provide: 'TokenProviderPort',
          useValue: {
            verifyAccess: (token: string) => {
              if (!['owner', 'admin'].includes(token))
                throw new Error('invalid');
              return {
                sub: A,
                restaurantId: A,
                role: 'owner',
                plat: token === 'admin',
              };
            },
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use(text({ type: 'text/plain', limit: '32kb' }));
    app.useGlobalGuards(module.get(JwtAuthGuard));
    await app.init();
  });
  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  function batch(event = 'storefront_view') {
    return {
      restaurantId: B,
      actorUserId: B,
      context: {
        visitorId: randomUUID(),
        sessionId: randomUUID(),
        channel: 'qr',
        path: '/tracking/secret-token?email=x@y.com',
      },
      events: [
        {
          eventId: randomUUID(),
          event,
          occurredAt: new Date().toISOString(),
          properties: {
            query: 'mail@example.com',
            phone: '123456',
            notes: 'private',
          },
        },
      ],
    };
  }

  it('accepts text/plain beacons, derives the tenant from the slug and strips PII', async () => {
    await request(app.getHttpServer())
      .post('/behavior/storefront/test')
      .type('text/plain')
      .send(JSON.stringify(batch()))
      .expect(201);
    const event = append.mock.calls[0][0][0];
    expect(event.restaurantId).toBe(A);
    expect(event.actorUserId).toBeUndefined();
    expect(event.context.path).toBe('/tracking/:token');
    expect(event.properties).toEqual({ query: '[redacted]' });
  });

  it('rejects attempts to forge server outcomes and oversized batches', async () => {
    await request(app.getHttpServer())
      .post('/behavior/storefront/test')
      .send(batch('order_created'))
      .expect(400);
    const body = batch();
    body.events = Array.from({ length: 21 }, () => body.events[0]);
    await request(app.getHttpServer())
      .post('/behavior/storefront/test')
      .send(body)
      .expect(400);
    expect(append).not.toHaveBeenCalled();
  });

  it('excludes internal viewers, bots and browser opt-out signals', async () => {
    for (const headers of [
      { Authorization: 'Bearer owner' },
      { 'User-Agent': 'Googlebot' },
      { DNT: '1' },
      { 'Sec-GPC': '1' },
    ]) {
      await request(app.getHttpServer())
        .post('/behavior/storefront/test')
        .set(headers)
        .send(batch())
        .expect(201, { accepted: 0 });
    }
    expect(append).not.toHaveBeenCalled();
  });

  it('requires authentication, protects the platform report and ignores tenant overrides', async () => {
    await request(app.getHttpServer()).get('/behavior/overview').expect(401);
    await request(app.getHttpServer())
      .get('/behavior/admin/overview')
      .set('Authorization', 'Bearer owner')
      .expect(403);
    await request(app.getHttpServer())
      .get(`/behavior/overview?restaurantId=${B}&days=7`)
      .set('Authorization', 'Bearer owner')
      .expect(200);
    expect(overview).toHaveBeenLastCalledWith({ restaurantId: A, days: 7 });
    await request(app.getHttpServer())
      .get('/behavior/admin/overview')
      .set('Authorization', 'Bearer admin')
      .expect(200);
  });

  it('does not accept personal data in attribution tags', () => {
    expect(
      BehaviorContextSchema.safeParse({
        ...batch().context,
        utmCampaign: 'user@example.com',
      }).success,
    ).toBe(false);
  });
});
