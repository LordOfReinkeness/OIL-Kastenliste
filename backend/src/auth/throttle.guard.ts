import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AdminAwareThrottlerGuard extends ThrottlerGuard {
  protected skipIfAdmin(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    return !!(req.session as any)?.isAdmin;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.skipIfAdmin(context)) return true;
    return super.canActivate(context);
  }
}
