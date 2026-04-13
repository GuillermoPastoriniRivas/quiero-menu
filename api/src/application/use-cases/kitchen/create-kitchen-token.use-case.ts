import { randomBytes } from 'crypto';
import { KitchenAccessTokenRepository } from '../../../domain/repositories/kitchen-access-token.repository.js';
import { KitchenAccessToken } from '../../../domain/entities/kitchen-access-token.entity.js';

function generateCode(): string {
  // 6-char alphanumeric (base36: 0-9 a-z)
  return randomBytes(4).toString('base64url').slice(0, 6).toLowerCase();
}

export class CreateKitchenTokenUseCase {
  constructor(private readonly tokenRepo: KitchenAccessTokenRepository) {}

  async execute(restaurantId: string, name: string = ''): Promise<KitchenAccessToken> {
    let code: string;
    let exists: KitchenAccessToken | null;
    do {
      code = generateCode();
      exists = await this.tokenRepo.findByToken(code);
    } while (exists);
    return this.tokenRepo.create({ restaurantId, token: code, name, expiresAt: null });
  }
}
