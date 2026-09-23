import { Invitation } from '../entities/invitation.entity.js';

export interface CreateInvitationData {
  restaurantId: string;
  tokenHash: string;
  email: string | null;
  createdBy: string;
  expiresAt: Date;
}

export interface InvitationRepository {
  create(data: CreateInvitationData): Promise<Invitation>;
  findById(id: string): Promise<Invitation | null>;
  findByTokenHash(tokenHash: string): Promise<Invitation | null>;
  listByRestaurantId(
    restaurantId: string,
    limit: number,
  ): Promise<Invitation[]>;
  revokeOpenByRestaurantId(restaurantId: string): Promise<void>;
  revoke(id: string): Promise<Invitation | null>;
  markAccepted(id: string, userId: string | null): Promise<Invitation | null>;
  setAcceptedBy(id: string, userId: string): Promise<void>;
  releaseAcceptance(id: string): Promise<void>;
}
