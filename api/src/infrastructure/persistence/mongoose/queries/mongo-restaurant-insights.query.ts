import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type {
  CityFacet,
  InsightDemand,
  InsightInvitation,
  InsightOwner,
  InsightSubscription,
  RestaurantInsightsQuery,
  RestaurantSearchFilter,
} from '../../../../application/ports/restaurant-insights.port.js';
import type { Restaurant } from '../../../../domain/entities/restaurant.entity.js';
import type { AuditLogEntry } from '../../../../domain/entities/audit-log.entity.js';
import { UserRole } from '../../../../domain/enums/user-role.enum.js';
import { OrderStatus } from '../../../../domain/enums/order-status.enum.js';
import { RestaurantMapper } from '../mappers/restaurant.mapper.js';
import {
  RestaurantModel,
  RestaurantDocument,
} from '../schemas/restaurant.schema.js';
import { UserModel, UserDocument } from '../schemas/user.schema.js';
import {
  UserRestaurantModel,
  UserRestaurantDocument,
} from '../schemas/user-restaurant.schema.js';
import {
  SubscriptionModel,
  SubscriptionDocument,
} from '../schemas/subscription.schema.js';
import {
  InvitationModel,
  InvitationDocument,
} from '../schemas/invitation.schema.js';
import {
  MenuItemModel,
  MenuItemDocument,
} from '../schemas/menu-item.schema.js';
import {
  OperatingHoursModel,
  OperatingHoursDocument,
} from '../schemas/operating-hours.schema.js';
import {
  StorefrontViewModel,
  StorefrontViewDocument,
} from '../schemas/storefront-view.schema.js';
import {
  StorefrontEventModel,
  StorefrontEventDocument,
} from '../schemas/storefront-event.schema.js';
import { OrderModel, OrderDocument } from '../schemas/order.schema.js';
import {
  StoreClaimModel,
  StoreClaimDocument,
} from '../schemas/store-claim.schema.js';
import {
  AuditLogModel,
  AuditLogDocument,
} from '../schemas/audit-log.schema.js';

const OWNER_ROLE: string = UserRole.OWNER;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function objectIds(ids: string[]): Types.ObjectId[] {
  return ids
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function countsToMap(
  rows: { _id: unknown; count: number }[],
): Map<string, number> {
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

@Injectable()
export class MongoRestaurantInsightsQuery implements RestaurantInsightsQuery {
  constructor(
    @InjectModel(RestaurantModel.name)
    private readonly restaurants: Model<RestaurantDocument>,
    @InjectModel(UserModel.name)
    private readonly usersModel: Model<UserDocument>,
    @InjectModel(UserRestaurantModel.name)
    private readonly links: Model<UserRestaurantDocument>,
    @InjectModel(SubscriptionModel.name)
    private readonly subscriptionsModel: Model<SubscriptionDocument>,
    @InjectModel(InvitationModel.name)
    private readonly invitations: Model<InvitationDocument>,
    @InjectModel(MenuItemModel.name)
    private readonly menuItems: Model<MenuItemDocument>,
    @InjectModel(OperatingHoursModel.name)
    private readonly hours: Model<OperatingHoursDocument>,
    @InjectModel(StorefrontViewModel.name)
    private readonly views: Model<StorefrontViewDocument>,
    @InjectModel(StorefrontEventModel.name)
    private readonly events: Model<StorefrontEventDocument>,
    @InjectModel(OrderModel.name)
    private readonly orders: Model<OrderDocument>,
    @InjectModel(StoreClaimModel.name)
    private readonly claims: Model<StoreClaimDocument>,
    @InjectModel(AuditLogModel.name)
    private readonly auditLogs: Model<AuditLogDocument>,
  ) {}

  async findRestaurants(
    filter: RestaurantSearchFilter,
    limit: number,
  ): Promise<Restaurant[]> {
    const and: Record<string, unknown>[] = [];
    if (filter.citySlug) and.push({ citySlug: filter.citySlug });
    if (filter.category) and.push({ category: filter.category });
    const term = filter.term?.trim();
    if (term) {
      const rx = { $regex: escapeRegex(term), $options: 'i' };
      const or: Record<string, unknown>[] = [
        { name: rx },
        { slug: rx },
        { city: rx },
      ];
      const extra = objectIds(filter.ownerMatchIds ?? []);
      if (extra.length > 0) or.push({ _id: { $in: extra } });
      and.push({ $or: or });
    }
    const docs = await this.restaurants
      .find(and.length > 0 ? { $and: and } : {})
      .sort({ createdAt: -1 })
      .limit(limit);
    return docs.map((doc) => RestaurantMapper.toDomain(doc));
  }

  async restaurantIdsByOwnerEmail(
    term: string,
    limit: number,
  ): Promise<string[]> {
    const clean = term.trim();
    if (!clean) return [];
    const rx = { $regex: escapeRegex(clean), $options: 'i' };
    const users = await this.usersModel
      .find({ $or: [{ email: rx }, { name: rx }] }, { _id: 1 })
      .limit(limit)
      .lean();
    if (users.length === 0) return [];
    const links = await this.links
      .find({ userId: { $in: users.map((u) => u._id) } }, { restaurantId: 1 })
      .lean();
    return [...new Set(links.map((l) => String(l.restaurantId)))];
  }

  async owners(restaurantIds: string[]): Promise<Map<string, InsightOwner>> {
    const ids = objectIds(restaurantIds);
    if (ids.length === 0) return new Map();
    const links = await this.links
      .find(
        { restaurantId: { $in: ids } },
        { restaurantId: 1, userId: 1, role: 1 },
      )
      .lean();
    const chosen = new Map<string, { userId: string; role: string }>();
    for (const link of links) {
      const key = String(link.restaurantId);
      const current = chosen.get(key);
      const isOwner = link.role === OWNER_ROLE;
      if (!current || (current.role !== OWNER_ROLE && isOwner)) {
        chosen.set(key, { userId: String(link.userId), role: link.role });
      }
    }
    const users = await this.users([
      ...new Set([...chosen.values()].map((c) => c.userId)),
    ]);
    const result = new Map<string, InsightOwner>();
    for (const [restaurantId, link] of chosen) {
      const user = users.get(link.userId);
      if (user) result.set(restaurantId, { userId: link.userId, ...user });
    }
    return result;
  }

  async subscriptions(
    restaurantIds: string[],
  ): Promise<Map<string, InsightSubscription>> {
    const ids = objectIds(restaurantIds);
    if (ids.length === 0) return new Map();
    const docs = await this.subscriptionsModel
      .find(
        { restaurantId: { $in: ids } },
        { restaurantId: 1, plan: 1, status: 1 },
      )
      .lean();
    return new Map(
      docs.map((d) => [
        String(d.restaurantId),
        { plan: d.plan, status: d.status },
      ]),
    );
  }

  async openInvitations(
    restaurantIds: string[],
    now: Date,
  ): Promise<Map<string, InsightInvitation>> {
    const ids = objectIds(restaurantIds);
    if (ids.length === 0) return new Map();
    const docs = await this.invitations
      .find({
        restaurantId: { $in: ids },
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { $gt: now },
      })
      .sort({ createdAt: -1 })
      .lean();
    const result = new Map<string, InsightInvitation>();
    for (const doc of docs) {
      const key = String(doc.restaurantId);
      if (result.has(key)) continue;
      result.set(key, {
        id: String(doc._id),
        email: doc.email ?? null,
        expiresAt: doc.expiresAt,
        createdAt: (doc as { createdAt?: Date }).createdAt ?? doc.expiresAt,
      });
    }
    return result;
  }

  async menuItemCounts(restaurantIds: string[]): Promise<Map<string, number>> {
    const ids = objectIds(restaurantIds);
    if (ids.length === 0) return new Map();
    const rows = await this.menuItems.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      { $match: { restaurantId: { $in: ids }, isVisible: { $ne: false } } },
      { $group: { _id: '$restaurantId', count: { $sum: 1 } } },
    ]);
    return countsToMap(rows);
  }

  async openDayCounts(restaurantIds: string[]): Promise<Map<string, number>> {
    const ids = objectIds(restaurantIds);
    if (ids.length === 0) return new Map();
    const rows = await this.hours.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          restaurantId: { $in: ids },
          isClosed: false,
          opensAt: { $nin: ['', null] },
          closesAt: { $nin: ['', null] },
        },
      },
      { $group: { _id: { r: '$restaurantId', d: '$dayOfWeek' } } },
      { $group: { _id: '$_id.r', count: { $sum: 1 } } },
    ]);
    return countsToMap(rows);
  }

  async demand(
    restaurantIds: string[],
    since: Date,
    to: Date,
  ): Promise<Map<string, InsightDemand>> {
    const ids = objectIds(restaurantIds);
    const result = new Map<string, InsightDemand>();
    if (ids.length === 0) return result;
    const range = { $gte: isoDay(since), $lte: isoDay(to) };
    const [viewRows, eventRows] = await Promise.all([
      this.views.aggregate<{ _id: Types.ObjectId; views: number }>([
        { $match: { restaurantId: { $in: ids }, date: range } },
        { $group: { _id: '$restaurantId', views: { $sum: '$views' } } },
      ]),
      this.events.aggregate<{
        _id: { r: Types.ObjectId; t: string };
        count: number;
      }>([
        { $match: { restaurantId: { $in: ids }, date: range } },
        {
          $group: {
            _id: { r: '$restaurantId', t: '$type' },
            count: { $sum: '$count' },
          },
        },
      ]),
    ]);
    const entry = (key: string): InsightDemand => {
      let value = result.get(key);
      if (!value) {
        value = { views: 0, whatsapp: 0, maps: 0, instagram: 0 };
        result.set(key, value);
      }
      return value;
    };
    for (const row of viewRows) entry(String(row._id)).views = row.views;
    for (const row of eventRows) {
      const target = entry(String(row._id.r));
      if (row._id.t === 'whatsapp') target.whatsapp = row.count;
      if (row._id.t === 'maps') target.maps = row.count;
      if (row._id.t === 'instagram') target.instagram = row.count;
    }
    return result;
  }

  async orderCounts(
    restaurantIds: string[],
    since: Date,
  ): Promise<Map<string, number>> {
    const ids = objectIds(restaurantIds);
    if (ids.length === 0) return new Map();
    const rows = await this.orders.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          restaurantId: { $in: ids },
          createdAt: { $gte: since },
          status: { $ne: OrderStatus.CANCELLED },
        },
      },
      { $group: { _id: '$restaurantId', count: { $sum: 1 } } },
    ]);
    return countsToMap(rows);
  }

  async platformOrders(
    since: Date,
    to: Date,
  ): Promise<{ orders: number; restaurants: number }> {
    const rows = await this.orders.aggregate<{
      orders: number;
      restaurants: Types.ObjectId[];
    }>([
      {
        $match: {
          createdAt: { $gte: since, $lt: to },
          status: { $ne: OrderStatus.CANCELLED },
        },
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          restaurants: { $addToSet: '$restaurantId' },
        },
      },
    ]);
    const row = rows[0];
    return {
      orders: row?.orders ?? 0,
      restaurants: row?.restaurants.length ?? 0,
    };
  }

  async pendingClaimsCount(): Promise<number> {
    return this.claims.countDocuments({ status: 'pending' });
  }

  async cities(): Promise<CityFacet[]> {
    const rows = await this.restaurants.aggregate<{
      _id: string;
      city: string;
      count: number;
    }>([
      { $match: { citySlug: { $nin: ['', null] } } },
      {
        $group: {
          _id: '$citySlug',
          city: { $first: '$city' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]);
    return rows.map((row) => ({
      citySlug: row._id,
      city: row.city,
      count: row.count,
    }));
  }

  async timeline(
    restaurantId: string | null,
    limit: number,
  ): Promise<AuditLogEntry[]> {
    if (restaurantId !== null && !Types.ObjectId.isValid(restaurantId))
      return [];
    const filter =
      restaurantId === null
        ? {}
        : { restaurantId: new Types.ObjectId(restaurantId) };
    const docs = await this.auditLogs
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200))
      .lean();
    return docs.map((doc) => ({
      id: String(doc._id),
      event: doc.event,
      actorUserId: doc.actorUserId ? String(doc.actorUserId) : null,
      restaurantId: doc.restaurantId ? String(doc.restaurantId) : null,
      metadata: doc.metadata ?? null,
      createdAt: doc.createdAt,
    }));
  }

  async users(
    userIds: string[],
  ): Promise<Map<string, { name: string; email: string }>> {
    const ids = objectIds(userIds);
    if (ids.length === 0) return new Map();
    const docs = await this.usersModel
      .find({ _id: { $in: ids } }, { name: 1, email: 1 })
      .lean();
    return new Map(
      docs.map((d) => [
        String(d._id),
        { name: d.name ?? '', email: d.email ?? '' },
      ]),
    );
  }

  async restaurantLabels(
    restaurantIds: string[],
  ): Promise<Map<string, { id: string; name: string; slug: string }>> {
    const ids = objectIds(restaurantIds);
    if (ids.length === 0) return new Map();
    const docs = await this.restaurants
      .find({ _id: { $in: ids } }, { name: 1, slug: 1 })
      .lean();
    return new Map(
      docs.map((d) => [
        String(d._id),
        { id: String(d._id), name: d.name, slug: d.slug },
      ]),
    );
  }
}
