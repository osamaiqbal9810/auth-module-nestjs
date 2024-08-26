import { Injectable, CanActivate, ExecutionContext, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, } from './enums/Role.enum';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './Service/user-service/user-service.service';
import { FileUtilsService } from 'src/Files/file.utils';
import { User } from './Schema/user.schema';
import { ROLES_KEY } from 'src/roles.decorator';
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector, private jwtService: JwtService, private userService: UserService) { }

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
            console.log(err)
            throw new InternalServerErrorException();
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
