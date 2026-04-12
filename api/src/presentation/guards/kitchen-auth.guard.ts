import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import type { Request } from 'express';
import type { KitchenAccessTokenRepository } from '../../domain/repositories/kitchen-access-token.repository.js';

@Injectable()
export class KitchenAuthGuard implements CanActivate {
  constructor(
    @Inject('KitchenAccessTokenRepository') private readonly tokenRepo: KitchenAccessTokenRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Kitchen ')) {
      throw new UnauthorizedException('Missing kitchen authorization header');
    }

    const token = authHeader.slice(8);
    const stored = await this.tokenRepo.findByToken(token);

    if (!stored || stored.revokedAt) {
      throw new UnauthorizedException('Invalid or revoked kitchen token');
    }

    if (stored.expiresAt && stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Kitchen token has expired');
    }

    (request as any).kitchen = { restaurantId: stored.restaurantId };
    return true;
  }
}
