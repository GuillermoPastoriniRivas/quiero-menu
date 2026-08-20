import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-internal-token'];
    const expected = this.config.get<string>('internalToken');
    if (!expected || token !== expected) {
      throw new UnauthorizedException('Invalid internal token');
    }
    return true;
  }
}
