import { SetMetadata } from '@nestjs/common'; //this creates a custom tag called 'roless' that stores arrays of strings
import { Role } from './role.enum';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
