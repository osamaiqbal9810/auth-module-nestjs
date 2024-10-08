import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';

  import { Request } from 'express';

import { UserService } from 'src/User/Service/user-service/user-service.service';


  @Injectable()
  export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService, private userService: UserService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
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

        if (!payload || !payload._id) {
          throw new UnauthorizedException()
        }
        
        const user = await this.userService.findOneById(payload._id) 
        if (!user || user.isRemoved || !user.isVerified ) {
          throw new UnauthorizedException()
        }
        
        // 💡 We're assigning the payload to the request object here
        // so that we can access it in our route handlers
       
        request.user = payload; //TODO Do we need to attach complete user?
      } catch {
        throw new UnauthorizedException();
      }
      return true;
    }
  
    private extractTokenFromHeader(request: Request): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  }

