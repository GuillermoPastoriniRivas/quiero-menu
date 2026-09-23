import { InvitationRepository } from '../../../domain/repositories/invitation.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { InvitationNotFoundError } from '../../../domain/errors/domain-errors.js';

export class RevokeInvitationUseCase {
  constructor(private readonly invitationRepo: InvitationRepository) {}

  async execute(
    invitationId: string,
  ): Promise<Result<{ restaurantId: string }, InvitationNotFoundError>> {
    const invitation = await this.invitationRepo.revoke(invitationId);
    if (!invitation) return err(new InvitationNotFoundError());
    return ok({ restaurantId: invitation.restaurantId });
  }
}
