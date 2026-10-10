import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import type { BehaviorPort } from '../../../../application/ports/behavior.port.js';
import type {
  BehaviorEvent,
  BehaviorQuery,
} from '../../../../domain/entities/behavior-event.entity.js';
import {
  DINER_STAGES,
  funnelCounts,
} from '../../../../application/use-cases/analytics/behavior-funnel.js';
import {
  BehaviorAccountModel,
  BehaviorDailyModel,
  BehaviorEventModel,
} from '../schemas/behavior-event.schema.js';
import { OrderModel } from '../schemas/order.schema.js';
import { MenuItemModel } from '../schemas/menu-item.schema.js';
import { UserModel } from '../schemas/user.schema.js';
import { UserRestaurantModel } from '../schemas/user-restaurant.schema.js';

const DAY = 86_400_000;
const MILESTONES = new Set([
  'owner_signup',
  'owner_email_verified',
  'menu_loaded',
  'link_shared',
  'order_created',
  'order_accepted',
  'subscription_started',
  'subscription_payment_succeeded',
  'subscription_canceled',
]);

@Injectable()
export class MongoBehaviorQuery implements BehaviorPort {
  constructor(
    @InjectModel(BehaviorEventModel.name)
    private readonly events: Model<BehaviorEventModel>,
    @InjectModel(BehaviorDailyModel.name)
    private readonly daily: Model<BehaviorDailyModel>,
    @InjectModel(BehaviorAccountModel.name)
    private readonly accounts: Model<BehaviorAccountModel>,
    @InjectModel(OrderModel.name) private readonly orders: Model<OrderModel>,
    @InjectModel(MenuItemModel.name)
    private readonly items: Model<MenuItemModel>,
    @InjectModel(UserModel.name) private readonly users: Model<UserModel>,
    @InjectModel(UserRestaurantModel.name)
    private readonly memberships: Model<UserRestaurantModel>,
  ) {}

  async append(events: BehaviorEvent[]): Promise<number> {
    let accepted = 0;
    // Unique IDs + upsert make beacons, retries and webhook redelivery idempotent.
    for (const event of events) {
      let restaurantId = event.restaurantId;
      if (!restaurantId && event.actorUserId && event.source === 'server') {
        const member = await this.memberships
          .findOne({ userId: new Types.ObjectId(event.actorUserId) })
          .select('restaurantId')
          .lean();
        restaurantId = member?.restaurantId.toString();
      }
      const result = await this.events.updateOne(
        { eventId: event.eventId },
        {
          $setOnInsert: {
            ...event,
            restaurantId: restaurantId
              ? new Types.ObjectId(restaurantId)
              : null,
            actorUserId: event.actorUserId
              ? new Types.ObjectId(event.actorUserId)
              : null,
            expiresAt: new Date(event.receivedAt.getTime() + 90 * DAY),
          },
        },
        { upsert: true },
      );
      if (result.upsertedCount) accepted++;
      if (!restaurantId) continue;
      // Raw driver update: milestone keys are dynamic (`first.<event>`), so
      // Mongoose strict casting would drop them. Idempotent via $min/$max.
      const accountFilter = { restaurantId: new Types.ObjectId(restaurantId) };
      if (MILESTONES.has(event.event)) {
        await this.accounts.collection.updateOne(
          accountFilter,
          {
            $min: { [`first.${event.event}`]: event.occurredAt },
            ...(event.event === 'owner_signup'
              ? {
                  $set: {
                    acquisitionChannel:
                      event.context?.firstChannel ??
                      event.context?.channel ??
                      'unknown',
                  },
                }
              : {}),
          } as never,
          { upsert: true },
        );
      }
      if (event.audience === 'owner') {
        await this.accounts.collection.updateOne(
          accountFilter,
          { $max: { lastActiveAt: event.occurredAt } } as never,
          { upsert: true },
        );
      }
    }
    return accepted;
  }

  async touchUser(userId: string, login: boolean): Promise<void> {
    const now = new Date();
    await this.users.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $max: { lastActiveAt: now, ...(login ? { lastLoginAt: now } : {}) } },
    );
  }

  async observeMenu(restaurantId: string, actorUserId: string): Promise<void> {
    const count = await this.items.countDocuments({
      restaurantId: new Types.ObjectId(restaurantId),
      isVisible: true,
    });
    if (count < 5) return;
    const now = new Date();
    await this.append([
      {
        eventId: `menu-loaded:${restaurantId}`,
        event: 'menu_loaded',
        restaurantId,
        actorUserId,
        occurredAt: now,
        receivedAt: now,
        audience: 'owner',
        source: 'server',
        properties: { itemsCount: count },
      },
    ]);
  }

  async rebuildDaily(since: Date): Promise<void> {
    await this.events
      .aggregate([
        { $match: { occurredAt: { $gte: since } } },
        {
          $group: {
            _id: {
              day: {
                $dateToString: {
                  date: '$occurredAt',
                  format: '%Y-%m-%d',
                  timezone: 'UTC',
                },
              },
              restaurantId: '$restaurantId',
              audience: '$audience',
              event: '$event',
              channel: { $ifNull: ['$context.channel', 'unknown'] },
            },
            count: { $sum: 1 },
          },
        },
        { $set: { updatedAt: '$$NOW' } },
        {
          $merge: {
            into: 'behavior_daily',
            on: '_id',
            whenMatched: 'replace',
            whenNotMatched: 'insert',
          },
        },
      ])
      .option({ maxTimeMS: 60_000 })
      .exec();
  }

  async overview(query: BehaviorQuery): Promise<Record<string, unknown>> {
    const now = new Date();
    const since = new Date(now.getTime() - query.days * DAY);
    const tenant = query.restaurantId
      ? { restaurantId: new Types.ObjectId(query.restaurantId) }
      : {};
    const match = { ...tenant, occurredAt: { $gte: since, $lte: now } };
    const aggregate = <T>(model: Model<T>, pipeline: PipelineStage[]) =>
      model.aggregate(pipeline).option({ maxTimeMS: 15_000 }).exec();
    const [
      totals,
      journeys,
      ownerStats,
      orderStats,
      customers,
      daily,
      products,
      searches,
    ] = await Promise.all([
      aggregate(this.events, [
        { $match: match },
        {
          $facet: {
            events: [
              { $group: { _id: '$event', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            sources: [
              {
                $group: {
                  _id: {
                    channel: { $ifNull: ['$context.channel', 'unknown'] },
                    audience: '$audience',
                  },
                  count: { $sum: 1 },
                  views: {
                    $sum: {
                      $cond: [
                        {
                          $in: ['$event', ['landing_view', 'storefront_view']],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  orders: {
                    $sum: {
                      $cond: [{ $eq: ['$event', 'order_created'] }, 1, 0],
                    },
                  },
                },
              },
            ],
            devices: [
              { $match: { event: 'storefront_view' } },
              {
                $group: {
                  _id: { $ifNull: ['$context.device', 'unknown'] },
                  count: { $sum: 1 },
                },
              },
            ],
            coverage: [
              {
                $group: {
                  _id: null,
                  earliest: { $min: '$receivedAt' },
                  events: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),
      aggregate(this.events, [
        {
          $match: {
            ...match,
            audience: 'diner',
            event: { $in: DINER_STAGES },
            'context.sessionId': { $type: 'string' },
          },
        },
        { $set: { rank: { $indexOfArray: [DINER_STAGES, '$event'] } } },
        { $sort: { occurredAt: 1, rank: 1 } },
        {
          $group: {
            _id: {
              restaurantId: '$restaurantId',
              session: '$context.sessionId',
            },
            journey: { $push: '$event' },
            channel: { $first: '$context.channel' },
            lastAt: { $max: '$occurredAt' },
          },
        },
        {
          $project: {
            channel: 1,
            expired: {
              $lt: ['$lastAt', new Date(now.getTime() - 30 * 60_000)],
            },
            reached: {
              $reduce: {
                input: '$journey',
                initialValue: 0,
                in: {
                  $cond: [
                    {
                      $eq: [
                        '$$this',
                        { $arrayElemAt: [DINER_STAGES, '$$value'] },
                      ],
                    },
                    { $add: ['$$value', 1] },
                    '$$value',
                  ],
                },
              },
            },
          },
        },
        {
          $group: {
            _id: {
              reached: '$reached',
              channel: '$channel',
              expired: '$expired',
            },
            count: { $sum: 1 },
          },
        },
      ]),
      aggregate(this.accounts, [
        {
          $match: {
            ...tenant,
            'first.owner_signup': {
              $gte: new Date(now.getTime() - 180 * DAY),
              $lte: now,
            },
          },
        },
        {
          $lookup: {
            from: 'orders',
            let: { id: '$restaurantId', signup: '$first.owner_signup' },
            pipeline: [
              {
                $match: {
                  source: 'storefront',
                  status: { $ne: 'cancelled' },
                  $expr: {
                    $and: [
                      { $eq: ['$restaurantId', '$$id'] },
                      { $gte: ['$createdAt', '$$signup'] },
                      { $lte: ['$createdAt', now] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  firstAt: { $min: '$createdAt' },
                  lastAt: { $max: '$createdAt' },
                  in14: {
                    $sum: {
                      $cond: [
                        {
                          $lt: ['$createdAt', { $add: ['$$signup', 14 * DAY] }],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  d30: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $gte: [
                                '$createdAt',
                                { $add: ['$$signup', 23 * DAY] },
                              ],
                            },
                            {
                              $lt: [
                                '$createdAt',
                                { $add: ['$$signup', 30 * DAY] },
                              ],
                            },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  d60: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $gte: [
                                '$createdAt',
                                { $add: ['$$signup', 53 * DAY] },
                              ],
                            },
                            {
                              $lt: [
                                '$createdAt',
                                { $add: ['$$signup', 60 * DAY] },
                              ],
                            },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  d90: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $gte: [
                                '$createdAt',
                                { $add: ['$$signup', 83 * DAY] },
                              ],
                            },
                            {
                              $lt: [
                                '$createdAt',
                                { $add: ['$$signup', 90 * DAY] },
                              ],
                            },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: 'usage',
          },
        },
        { $set: { usage: { $arrayElemAt: ['$usage', 0] } } },
        {
          $facet: {
            funnel: [
              { $match: { 'first.owner_signup': { $gte: since } } },
              {
                $group: {
                  _id: null,
                  registered: { $sum: 1 },
                  verified: {
                    $sum: { $cond: ['$first.owner_email_verified', 1, 0] },
                  },
                  menu: { $sum: { $cond: ['$first.menu_loaded', 1, 0] } },
                  shared: { $sum: { $cond: ['$first.link_shared', 1, 0] } },
                  firstOrder: { $sum: { $cond: ['$usage.firstAt', 1, 0] } },
                  subscribed: {
                    $sum: { $cond: ['$first.subscription_started', 1, 0] },
                  },
                  paid: {
                    $sum: {
                      $cond: ['$first.subscription_payment_succeeded', 1, 0],
                    },
                  },
                },
              },
            ],
            cohorts: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      date: '$first.owner_signup',
                      format: '%Y-%m',
                      timezone: 'UTC',
                    },
                  },
                  accounts: { $sum: 1 },
                  eligible14: {
                    $sum: {
                      $cond: [
                        {
                          $lte: [
                            '$first.owner_signup',
                            new Date(now.getTime() - 14 * DAY),
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  activated14: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $lte: [
                                '$first.owner_signup',
                                new Date(now.getTime() - 14 * DAY),
                              ],
                            },
                            { $gte: ['$usage.in14', 5] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  eligible30: {
                    $sum: {
                      $cond: [
                        {
                          $lte: [
                            '$first.owner_signup',
                            new Date(now.getTime() - 30 * DAY),
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  retained30: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $lte: [
                                '$first.owner_signup',
                                new Date(now.getTime() - 30 * DAY),
                              ],
                            },
                            { $gt: ['$usage.d30', 0] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  eligible60: {
                    $sum: {
                      $cond: [
                        {
                          $lte: [
                            '$first.owner_signup',
                            new Date(now.getTime() - 60 * DAY),
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  retained60: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $lte: [
                                '$first.owner_signup',
                                new Date(now.getTime() - 60 * DAY),
                              ],
                            },
                            { $gt: ['$usage.d60', 0] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  eligible90: {
                    $sum: {
                      $cond: [
                        {
                          $lte: [
                            '$first.owner_signup',
                            new Date(now.getTime() - 90 * DAY),
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  retained90: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $lte: [
                                '$first.owner_signup',
                                new Date(now.getTime() - 90 * DAY),
                              ],
                            },
                            { $gt: ['$usage.d90', 0] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              { $sort: { _id: 1 } },
            ],
            accounts: [
              { $sort: { 'first.owner_signup': -1 } },
              { $limit: 100 },
              {
                $lookup: {
                  from: 'restaurants',
                  localField: 'restaurantId',
                  foreignField: '_id',
                  as: 'restaurant',
                },
              },
              {
                $project: {
                  _id: 0,
                  restaurantId: 1,
                  name: { $arrayElemAt: ['$restaurant.name', 0] },
                  slug: { $arrayElemAt: ['$restaurant.slug', 0] },
                  first: 1,
                  acquisitionChannel: 1,
                  lastActiveAt: 1,
                  firstOrderAt: '$usage.firstAt',
                },
              },
            ],
          },
        },
      ]),
      aggregate(this.orders, [
        { $match: { ...tenant, source: 'storefront' } },
        {
          $facet: {
            period: [
              { $match: { createdAt: { $gte: since, $lte: now } } },
              {
                $group: {
                  _id: null,
                  orders: { $sum: 1 },
                  cancelled: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
                  },
                  delivered: {
                    $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
                  },
                  attributed: {
                    $sum: { $cond: ['$attribution.sessionId', 1, 0] },
                  },
                },
              },
            ],
            completedLast7: [
              {
                $match: {
                  status: 'delivered',
                  deliveredAt: {
                    $gte: new Date(now.getTime() - 7 * DAY),
                    $lte: now,
                  },
                },
              },
              { $count: 'count' },
            ],
          },
        },
      ]),
      aggregate(this.orders, [
        {
          $match: {
            ...tenant,
            source: 'storefront',
            status: 'delivered',
            customerPhone: { $ne: '' },
            createdAt: { $lte: now },
          },
        },
        // Operational phone stays inside Mongo. Only aggregate cohort counts leave this pipeline.
        { $sort: { restaurantId: 1, customerPhone: 1, createdAt: 1 } },
        {
          $group: {
            _id: { restaurantId: '$restaurantId', phone: '$customerPhone' },
            firstTwo: { $push: '$createdAt' },
          },
        },
        {
          $set: {
            firstTwo: { $slice: ['$firstTwo', 2] },
            firstAt: { $arrayElemAt: ['$firstTwo', 0] },
            repeatAt: { $arrayElemAt: ['$firstTwo', 1] },
          },
        },
        // D30 necesita cohortes maduras incluso cuando la actividad se filtra a 7/30 días.
        {
          $match: {
            firstAt: { $gte: new Date(now.getTime() - 90 * DAY), $lte: now },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                date: '$firstAt',
                format: '%Y-%m',
                timezone: 'UTC',
              },
            },
            customers: { $sum: 1 },
            eligible30: {
              $sum: {
                $cond: [
                  { $lte: ['$firstAt', new Date(now.getTime() - 30 * DAY)] },
                  1,
                  0,
                ],
              },
            },
            repeated30: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $lte: ['$firstAt', new Date(now.getTime() - 30 * DAY)],
                      },
                      { $ne: [{ $ifNull: ['$repeatAt', null] }, null] },
                      { $lte: ['$repeatAt', { $add: ['$firstAt', 30 * DAY] }] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      aggregate(this.daily, [
        {
          $match: {
            '_id.day': { $gte: since.toISOString().slice(0, 10) },
            ...(query.restaurantId
              ? { '_id.restaurantId': new Types.ObjectId(query.restaurantId) }
              : {}),
          },
        },
        { $group: { _id: '$_id.day', count: { $sum: '$count' } } },
        { $sort: { _id: 1 } },
      ]),
      aggregate(this.events, [
        {
          $match: {
            ...match,
            event: { $in: ['item_view', 'item_add'] },
            'properties.itemId': { $exists: true },
          },
        },
        {
          $group: {
            _id: {
              restaurantId: '$restaurantId',
              itemId: '$properties.itemId',
            },
            views: {
              $sum: { $cond: [{ $eq: ['$event', 'item_view'] }, 1, 0] },
            },
            adds: { $sum: { $cond: [{ $eq: ['$event', 'item_add'] }, 1, 0] } },
          },
        },
        { $sort: { adds: -1, views: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'menu_items',
            let: {
              id: { $toObjectId: '$_id.itemId' },
              restaurantId: '$_id.restaurantId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$id'] },
                      { $eq: ['$restaurantId', '$$restaurantId'] },
                    ],
                  },
                },
              },
              { $project: { name: 1 } },
            ],
            as: 'item',
          },
        },
        {
          $project: {
            _id: 0,
            restaurantId: '$_id.restaurantId',
            itemId: '$_id.itemId',
            name: { $arrayElemAt: ['$item.name', 0] },
            views: 1,
            adds: 1,
          },
        },
      ]),
      aggregate(this.events, [
        {
          $match: {
            ...match,
            event: { $in: ['menu_search', 'directory_search'] },
            'properties.query': { $exists: true, $nin: ['', '[redacted]'] },
          },
        },
        {
          $group: {
            _id: {
              query: '$properties.query',
              city: '$properties.city',
              scope: '$event',
            },
            count: { $sum: 1 },
            zeroResults: {
              $sum: { $cond: [{ $eq: ['$properties.resultsCount', 0] }, 1, 0] },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ]),
    ]);
    const reached = journeys.map((r) => ({
      reached: r._id.reached as number,
      count: r.count as number,
    }));
    const channels = [...new Set<string>(journeys.map((r) => r._id.channel))];
    return {
      days: query.days,
      since,
      until: now,
      rawRetentionDays: 90,
      timezone: 'UTC',
      totals: totals[0] ?? {},
      orders: {
        ...(orderStats[0]?.period[0] ?? {
          orders: 0,
          delivered: 0,
          cancelled: 0,
          attributed: 0,
        }),
        completedLast7: orderStats[0]?.completedLast7[0]?.count ?? 0,
      },
      dinerFunnel: funnelCounts(reached),
      byChannel: channels.map((channel) => ({
        channel,
        stages: funnelCounts(
          journeys
            .filter((r) => r._id.channel === channel)
            .map((r) => ({ reached: r._id.reached, count: r.count })),
        ),
      })),
      checkoutDropoff: journeys
        .filter((r) => r._id.reached === 3 && r._id.expired)
        .reduce((sum, r) => sum + r.count, 0),
      owners: ownerStats[0] ?? { funnel: [], cohorts: [], accounts: [] },
      customerCohorts: customers,
      customerCohortDays: 90,
      daily,
      products,
      searches,
    };
  }
}
