import { InvitationRepository } from '../../../domain/repositories/invitation.repository.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { InvitationStatus } from '../../../domain/entities/invitation.entity.js';

export interface InvitationListItem {
  id: string;
  email: string | null;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
  acceptedByEmail: string | null;
  revokedAt: Date | null;
}

export class ListInvitationsUseCase {
  constructor(
    private readonly invitationRepo: InvitationRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(restaurantId: string): Promise<InvitationListItem[]> {
    const invitations = await this.invitationRepo.listByRestaurantId(
      restaurantId,
      20,
    );
    const now = new Date();
    return Promise.all(
      invitations.map(async (inv) => {
        const acceptedBy = inv.acceptedBy
          ? await this.userRepo.findById(inv.acceptedBy)
          : null;
        return {
          id: inv.id,
          email: inv.email,
          status: inv.statusAt(now),
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
          acceptedAt: inv.acceptedAt,
          acceptedByEmail: acceptedBy?.email ?? null,
          revokedAt: inv.revokedAt,
        };
      }),
    );
  }
}
