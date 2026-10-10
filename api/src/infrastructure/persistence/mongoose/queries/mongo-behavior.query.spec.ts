import { randomUUID } from 'node:crypto';
import mongoose, { Connection, Model, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoBehaviorQuery } from './mongo-behavior.query.js';
import {
  BehaviorAccountModel,
  BehaviorAccountSchema,
  BehaviorDailyModel,
  BehaviorDailySchema,
  BehaviorEventModel,
  BehaviorEventSchema,
} from '../schemas/behavior-event.schema.js';
import { OrderModel, OrderSchema } from '../schemas/order.schema.js';
import { MenuItemModel, MenuItemSchema } from '../schemas/menu-item.schema.js';
import { UserModel, UserSchema } from '../schemas/user.schema.js';
import {
  UserRestaurantModel,
  UserRestaurantSchema,
} from '../schemas/user-restaurant.schema.js';
import type { BehaviorEvent } from '../../../../domain/entities/behavior-event.entity.js';

jest.setTimeout(180_000);
const DAY = 86_400_000;
const A = new Types.ObjectId().toHexString();
const B = new Types.ObjectId().toHexString();

describe('Behavior storage and analytics with isolated MongoDB', () => {
  let mongo: MongoMemoryServer;
  let connection: Connection;
  let events: Model<BehaviorEventModel>;
  let accounts: Model<BehaviorAccountModel>;
  let daily: Model<BehaviorDailyModel>;
  let orders: Model<OrderModel>;
  let query: MongoBehaviorQuery;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    connection = await mongoose
      .createConnection(mongo.getUri(), { dbName: 'behavior_test' })
      .asPromise();
    events = connection.model(BehaviorEventModel.name, BehaviorEventSchema);
    accounts = connection.model(
      BehaviorAccountModel.name,
      BehaviorAccountSchema,
    );
    daily = connection.model(BehaviorDailyModel.name, BehaviorDailySchema);
    orders = connection.model(OrderModel.name, OrderSchema);
    const items = connection.model(MenuItemModel.name, MenuItemSchema);
    const users = connection.model(UserModel.name, UserSchema);
    const memberships = connection.model(
      UserRestaurantModel.name,
      UserRestaurantSchema,
    );
    query = new MongoBehaviorQuery(
      events,
      daily,
      accounts,
      orders,
      items,
      users,
      memberships,
    );
    await Promise.all([
      events.init(),
      accounts.init(),
      daily.init(),
      orders.init(),
    ]);
  });
  afterAll(async () => {
    await connection?.close();
    await mongo?.stop();
  });
  beforeEach(async () => {
    await Promise.all([
      events.deleteMany({}),
      accounts.deleteMany({}),
      daily.deleteMany({}),
      orders.deleteMany({}),
    ]);
  });

  function event(
    name: string,
    sessionId = randomUUID(),
    restaurantId = A,
    time = Date.now() - 3600_000,
  ): BehaviorEvent {
    return {
      eventId: randomUUID(),
      event: name,
      occurredAt: new Date(time),
      receivedAt: new Date(),
      restaurantId,
      audience: 'diner',
      source: name === 'order_created' ? 'server' : 'client',
      properties: {},
      context: { visitorId: randomUUID(), sessionId, channel: 'qr' },
    };
  }

  it('deduplicates retries, preserves first milestones and rebuilds rollups without inflation', async () => {
    const e = {
      ...event('owner_signup'),
      audience: 'owner' as const,
      source: 'server' as const,
    };
    expect(await query.append([e, e])).toBe(1);
    await Promise.all([query.append([e]), query.append([e])]);
    expect(await events.countDocuments()).toBe(1);
    const profile = await accounts
      .findOne({ restaurantId: new Types.ObjectId(A) })
      .lean();
    expect(profile?.first.owner_signup.getTime()).toBe(e.occurredAt.getTime());
    expect(profile?.acquisitionChannel).toBe('qr');
    await query.rebuildDaily(new Date(Date.now() - DAY));
    await query.rebuildDaily(new Date(Date.now() - DAY));
    expect((await daily.findOne().lean())?.count).toBe(1);
    expect(
      (await events.collection.indexes()).find((index) => index.key.expiresAt)
        ?.expireAfterSeconds,
    ).toBe(0);
  });

  it('requires ordered stages in the same session and restaurant, even with reversed beacon arrival', async () => {
    const complete = randomUUID();
    const orphan = randomUUID();
    const crossed = randomUUID();
    const t = Date.now() - 3600_000;
    await query.append([
      event('order_created', complete, A, t + 3),
      event('checkout_start', complete, A, t + 2),
      event('item_add', complete, A, t + 1),
      event('storefront_view', complete, A, t),
      event('order_created', orphan, A),
      event('storefront_view', crossed, A),
      event('item_add', crossed, B),
      event('checkout_start', crossed, B),
      event('order_created', crossed, B),
    ]);
    const report = await query.overview({ days: 7, restaurantId: A });
    expect(
      (report.dinerFunnel as { count: number }[]).map((s) => s.count),
    ).toEqual([2, 1, 1, 1]);
    expect(report.checkoutDropoff).toBe(0);
  });

  it('distinguishes probable checkout abandonment from a still-active checkout', async () => {
    for (const time of [Date.now() - 3600_000, Date.now() - 5000]) {
      const session = randomUUID();
      await query.append(
        ['storefront_view', 'item_add', 'checkout_start'].map((name, index) =>
          event(name, session, A, time + index),
        ),
      );
    }
    const report = await query.overview({ days: 7, restaurantId: A });
    expect(report.checkoutDropoff).toBe(1);
  });

  async function order(
    restaurantId: string,
    createdAt: Date,
    phone: string,
    source = 'storefront',
  ) {
    // Use raw fixture inserts: no credentials, external database, emails or live payment calls.
    await orders.collection.insertOne({
      restaurantId: new Types.ObjectId(restaurantId),
      code: randomUUID(),
      createdAt,
      deliveredAt: createdAt,
      customerPhone: phone,
      source,
      status: 'delivered',
      total: 100,
    } as never);
  }

  it('counts only mature activation/retention windows and separates trial authorization from payment', async () => {
    const signup = Date.now() - 40 * DAY;
    await query.append([
      {
        ...event('owner_signup', randomUUID(), A, signup),
        audience: 'owner',
        source: 'server',
      },
      { ...event('subscription_started'), audience: 'owner', source: 'server' },
    ]);
    await query.append([
      {
        ...event('owner_signup', randomUUID(), B, Date.now() - 2 * DAY),
        audience: 'owner',
        source: 'server',
      },
    ]);
    for (let i = 1; i <= 5; i++)
      await order(A, new Date(signup + i * DAY), '5491112345678');
    await order(A, new Date(signup + 28 * DAY), '5491112345678');
    const report = await query.overview({ days: 90 });
    const owners = report.owners as {
      funnel: { subscribed: number; paid: number }[];
      cohorts: {
        eligible14: number;
        activated14: number;
        eligible30: number;
        retained30: number;
      }[];
    };
    expect(owners.funnel[0].subscribed).toBe(1);
    expect(owners.funnel[0].paid).toBe(0);
    expect(owners.cohorts.reduce((sum, c) => sum + c.eligible14, 0)).toBe(1);
    expect(owners.cohorts.reduce((sum, c) => sum + c.activated14, 0)).toBe(1);
    expect(owners.cohorts.reduce((sum, c) => sum + c.retained30, 0)).toBe(1);
  });

  it.each([7, 30, 90])(
    'computes mature repeat cohorts independently of the %i-day activity filter',
    async (days) => {
      const first = new Date(Date.now() - 40 * DAY);
      await order(A, first, '5491199999999');
      await order(A, new Date(first.getTime() + 20 * DAY), '5491199999999');
      await order(B, first, '5491199999999');
      await order(A, first, '5491188888888', 'manual');
      const report = await query.overview({ days, restaurantId: A });
      const cohorts = report.customerCohorts as {
        customers: number;
        eligible30: number;
        repeated30: number;
      }[];
      expect(cohorts).toHaveLength(1);
      expect(cohorts[0]).toMatchObject({
        customers: 1,
        eligible30: 1,
        repeated30: 1,
      });
      expect(JSON.stringify(report)).not.toContain('5491199999999');
      expect(report.customerCohortDays).toBe(90);
      expect(report.orders).toMatchObject({
        orders: days === 90 ? 2 : days === 30 ? 1 : 0,
      });
    },
  );
});
