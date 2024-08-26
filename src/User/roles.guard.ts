import { Injectable, CanActivate, ExecutionContext, InternalServerErrorException, ForbiddenException, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, } from './enums/Role.enum';
import { User } from './Schema/user.schema';
import { ROLES_KEY } from 'src/roles.decorator';
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        try {
            const user = request.user as User
            const { roles } = user
            if (!roles) {
                console.error('User not found in the request object');
                throw new ForbiddenException()
            }
            let result = requiredRoles.some((role) => roles?.includes(role));
            if (!result) {
                throw new ForbiddenException()
            }
            return true

        } catch (err) {
            if (err instanceof HttpException) {
                if (err.getStatus() == 403) {
                    throw new ForbiddenException()
                }
            }
            throw new InternalServerErrorException();
        }
    }
}
