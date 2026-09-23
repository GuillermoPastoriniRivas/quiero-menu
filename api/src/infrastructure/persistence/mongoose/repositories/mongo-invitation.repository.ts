import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InvitationRepository,
  CreateInvitationData,
} from '../../../../domain/repositories/invitation.repository.js';
import { Invitation } from '../../../../domain/entities/invitation.entity.js';
import {
  InvitationModel,
  InvitationDocument,
} from '../schemas/invitation.schema.js';

function idToString(value: unknown): string {
  return value instanceof Types.ObjectId ? value.toHexString() : String(value);
}

function toDomain(doc: InvitationDocument): Invitation {
  return new Invitation(
    doc._id.toHexString(),
    idToString(doc.restaurantId),
    doc.tokenHash,
    doc.email ?? null,
    idToString(doc.createdBy),
    doc.expiresAt,
    doc.acceptedAt ?? null,
    doc.acceptedBy ? idToString(doc.acceptedBy) : null,
    doc.revokedAt ?? null,
    doc.createdAt,
  );
}

@Injectable()
export class MongoInvitationRepository implements InvitationRepository {
  constructor(
    @InjectModel(InvitationModel.name)
    private readonly model: Model<InvitationDocument>,
  ) {}

  async create(data: CreateInvitationData): Promise<Invitation> {
    const doc = await this.model.create({
      ...data,
      restaurantId: new Types.ObjectId(data.restaurantId),
      createdBy: new Types.ObjectId(data.createdBy),
    });
    return toDomain(doc);
  }

  async findById(id: string): Promise<Invitation | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findById(id);
    return doc ? toDomain(doc) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    const doc = await this.model.findOne({ tokenHash });
    return doc ? toDomain(doc) : null;
  }

  async listByRestaurantId(
    restaurantId: string,
    limit: number,
  ): Promise<Invitation[]> {
    if (!Types.ObjectId.isValid(restaurantId)) return [];
    const docs = await this.model
      .find({ restaurantId: new Types.ObjectId(restaurantId) })
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 50));
    return docs.map(toDomain);
  }

  async revokeOpenByRestaurantId(restaurantId: string): Promise<void> {
    if (!Types.ObjectId.isValid(restaurantId)) return;
    await this.model.updateMany(
      {
        restaurantId: new Types.ObjectId(restaurantId),
        acceptedAt: null,
        revokedAt: null,
      },
      { $set: { revokedAt: new Date() } },
    );
  }

  async revoke(id: string): Promise<Invitation | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findOneAndUpdate(
      { _id: id, acceptedAt: null, revokedAt: null },
      { $set: { revokedAt: new Date() } },
      { returnDocument: 'after' },
    );
    return doc ? toDomain(doc) : this.findById(id);
  }

  async markAccepted(
    id: string,
    userId: string | null,
  ): Promise<Invitation | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findOneAndUpdate(
      {
        _id: id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          acceptedAt: new Date(),
          acceptedBy: userId ? new Types.ObjectId(userId) : null,
        },
      },
      { returnDocument: 'after' },
    );
    return doc ? toDomain(doc) : null;
  }

  async releaseAcceptance(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await this.model.updateOne(
      { _id: id },
      { $set: { acceptedAt: null, acceptedBy: null } },
    );
  }

  async setAcceptedBy(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await this.model.updateOne(
      { _id: id },
      { $set: { acceptedBy: new Types.ObjectId(userId) } },
    );
  }
}
