import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the roles required for this specific route
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. If no roles are defined on the route, allow access
    if (!requiredRoles) {
      return true;
    }

    // 3. Get the user from the request (attached by your Auth strategy)
    const { user } = context.switchToHttp().getRequest();

    // 4. Check if the user has one of the required roles
    return requiredRoles.some((role) => user.role === role);
  }
}
