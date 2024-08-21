import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from './enums/Role.enum';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './Service/user-service/user-service.service';
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
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: process.env.JWT_Secret
                }
            );

            if (payload && payload._id) {
                const user = await this.userService.findOneById(payload._id)
                const { roles } = user
                if (!roles) {
                    console.error('User not found in the request object');
                    return false;
                }
                const roleIndexes = roles.map((role: string) => Role[role as keyof typeof Role]);

                return requiredRoles.some((role) => roleIndexes?.includes(role));
            }
            return false

        } catch {
            throw new UnauthorizedException();
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
