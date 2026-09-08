import { StoreClaimRepository } from '../../../domain/repositories/store-claim.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { ClaimNotPendingError } from '../../../domain/errors/domain-errors.js';

/**
 * El admin rechaza el pedido (verificación por WhatsApp falló o el local
 * ya tiene dueño). Sin email: el seguimiento es por WhatsApp.
 */
export class RejectStoreClaimUseCase {
  constructor(private readonly claimRepo: StoreClaimRepository) {}

  async execute(
    claimId: string,
  ): Promise<Result<{ ok: true }, ClaimNotPendingError>> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim || claim.status !== 'pending')
      return err(new ClaimNotPendingError());
    await this.claimRepo.updateStatus(claim.id, 'rejected');
    return ok({ ok: true });
  }
}
