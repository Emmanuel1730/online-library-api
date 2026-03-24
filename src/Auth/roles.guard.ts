import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 1. Get the incoming request
    const request = context.switchToHttp().getRequest();

    // 2. Look for our custom "ID Badge" in the headers
    const userRole = request.headers['x-user-role'];

    // 3. Check if they are an ADMIN
    if (userRole === 'ADMIN') {
      return true; // The bouncer opens the door!
    }

    // 4. If they are not an admin, kick them out
    throw new ForbiddenException(
      'Access Denied: You must be an Admin to change settings!',
    );
  }
}
