import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RequestUser } from '../decorators/current-user.decorator.js';

@Injectable()
export class OwnSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: RequestUser }).user;
    if (user?.operating || user?.impersonating) {
      throw new ForbiddenException(
        'Esta acción no está disponible mientras operás un local como admin.',
      );
    }
    return true;
  }
}
