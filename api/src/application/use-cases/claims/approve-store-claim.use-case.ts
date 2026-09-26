import { StoreClaimRepository } from '../../../domain/repositories/store-claim.repository.js';
import { Result, ok, err } from '../../common/result.js';
import {
  ClaimNotPendingError,
  RestaurantNotFoundError,
} from '../../../domain/errors/domain-errors.js';
import type {
  CreateInvitationOutput,
  CreateInvitationUseCase,
} from '../invitations/create-invitation.use-case.js';

export interface ApproveStoreClaimInput {
  adminUserId: string;
  email?: string;
}

export interface ApproveStoreClaimOutput {
  restaurantId: string;
  claimant: { name: string; phone: string; email: string };
  invitation: CreateInvitationOutput;
}

export class ApproveStoreClaimUseCase {
  constructor(
    private readonly claimRepo: StoreClaimRepository,
    private readonly createInvitation: CreateInvitationUseCase,
  ) {}

  async execute(
    claimId: string,
    input: ApproveStoreClaimInput,
  ): Promise<
    Result<
      ApproveStoreClaimOutput,
      ClaimNotPendingError | RestaurantNotFoundError
    >
  > {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim || claim.status !== 'pending') {
      return err(new ClaimNotPendingError());
    }

    const email = (input.email?.trim() || claim.email).toLowerCase();
    const created = await this.createInvitation.execute({
      restaurantId: claim.restaurantId,
      adminUserId: input.adminUserId,
      email,
      sendEmail: true,
    });
    if (!created.ok) return err(created.error);

    await this.claimRepo.updateStatus(claim.id, 'approved');

    return ok({
      restaurantId: claim.restaurantId,
      claimant: { name: claim.name, phone: claim.phone, email },
      invitation: created.value,
    });
  }
}
