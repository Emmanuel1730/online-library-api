import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';
import { Roles } from './roles.decorator';


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Keep this: Get the roles required for this specific route

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    // --- PASTE THE NEW CODE STARTING HERE ---

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // These logs will appear in your VS Code terminal when you try to access the route
    console.log(request.user);
    console.log(requiredRoles);

    if (!user || !user.role) {
      console.error('Access Denied: No user or role found on request object');
      return false;
    }

    const hasRole = requiredRoles.some(
      (role) => user.role?.toUpperCase() === role.toUpperCase(),
    );

    // Using toLowerCase() on both sides makes the check case-insensitive

    // --- END OF NEW CODE ---

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
