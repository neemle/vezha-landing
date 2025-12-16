import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-admin-token'] as string | undefined;
    const expected = process.env.ADMIN_TOKEN || 'vezha-admin';
    if (token && token === expected) {
      return true;
    }
    throw new UnauthorizedException('Invalid admin token');
  }
}
