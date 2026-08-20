import { randomBytes } from 'crypto';
import { DeliveryAccessTokenRepository } from '../../../domain/repositories/delivery-access-token.repository.js';
import { DeliveryAccessToken } from '../../../domain/entities/delivery-access-token.entity.js';

function generateCode(): string {
  return randomBytes(4).toString('base64url').slice(0, 6).toLowerCase();
}

export class CreateDeliveryTokenUseCase {
  constructor(private readonly tokenRepo: DeliveryAccessTokenRepository) {}

  async execute(
    restaurantId: string,
    name: string = '',
  ): Promise<DeliveryAccessToken> {
    let code: string;
    let exists: DeliveryAccessToken | null;
    do {
      code = generateCode();
      exists = await this.tokenRepo.findByToken(code);
    } while (exists);
    return this.tokenRepo.create({
      restaurantId,
      token: code,
      name,
      expiresAt: null,
    });
  }
}
