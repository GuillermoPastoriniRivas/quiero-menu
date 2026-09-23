import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../services/audit.service.js';
import type { RequestUser } from '../decorators/current-user.decorator.js';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class OperateAuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const user = request.user;
    if (!user?.operating || READ_METHODS.has(request.method)) {
      return next.handle();
    }
    const route = (request.route as { path?: string } | undefined)?.path;
    return next.handle().pipe(
      tap(() =>
        this.audit.log('admin.operate_write', user._id, user.restaurantId, {
          method: request.method,
          path: route ?? request.path,
        }),
      ),
    );
  }
}
