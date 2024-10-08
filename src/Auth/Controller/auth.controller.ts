import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Post, Req, Request, Res, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiNotFoundResponse, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';

import { AuthService } from '../Service/auth.service';

import { AuthGuard } from 'src/Auth/auth.guard';
import { GoogleOauthGuard } from './google-auth.guard';
import { UserSignUpDto } from 'src/User/DTO/UserSignUp.dto';
import { createApiResponseSchema } from 'src/ErrorResponse.utils';
import { User } from 'src/User/Schema/user.schema';
import Express from 'express';
import { GoogleProfileTranslated } from '../Strategies/google.strategy';
import { Throttle } from '@nestjs/throttler';
import { UserIdThrottleGuard } from 'src/User/throttleUser.guard';
import { Throttle_Limit, Throttle_Ttl } from 'Global.constnats';
import { JWTPayloadModel } from '../../User/JWTPayload.model';
import { UserService } from 'src/User/Service/user-service/user-service.service';

import { UserSignInDto } from '../DTO/UserSignIn.dto';
import { ForgotPasswordDto } from 'src/User/DTO/ForgotPassword.dto';
import { Users } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private userService: UserService) { }

    @ApiTags("Auth")
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Logged in successfully!", {
        access_token: {
            type: 'string',
            example: "ey7yrgbu7yr4ir982y2i9yr92u90399"
        }, data: {
            $ref: getSchemaPath(User),
        }
    }))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not found", "Login Failed! user not found"))
    @ApiBody({ type: UserSignInDto })
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Post("/signIn")
    async signIn(@Body() signInDto: UserSignInDto): Promise<{ statusCode: Number, message: String, access_token: String, data: User }> {

        try {
            const result = await this.authService.signIn(signInDto)
            if (result && result) {
                // TODO: handle cookies properly
                // res.cookie('jwt', result.access_token, {
                //     httpOnly: true,
                //     secure: process.env.NODE_ENV === 'production', // Use true if using HTTPS
                //     sameSite: 'strict', // Helps prevent CSRF attacks
                // });

                return {
                    statusCode: 200,
                    message: "Logged in successfully!",
                    access_token: result.access_token,
                    data: result.user
                }
            }
            else {
                throw new NotFoundException("User not found!")
            }
        } catch (error) {
            // If it's a known error type, rethrow it; otherwise, throw a generic server error
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException()
        }
    }

    @ApiTags("Auth")
    @ApiBearerAuth()
    @UseGuards(AuthGuard, UserIdThrottleGuard)
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Throttle_Limit(5)
    @Throttle_Ttl(60)
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Logout success."))
    @Get('signOut')

    async signOut(): Promise<{ statusCode: Number, message: String }> {
        try {
            // TODO: blacklist jwt token 
            //    res.clearCookie('jwt') TODO://
            // return res.status(200).json({ message: 'Signed out successfully' });
            return {
                statusCode: 200,
                message: 'Signed out successfully'
            }
        } catch (err) {
            throw new InternalServerErrorException()
        }
    }

    @ApiTags("Auth")
    @ApiOkResponse(createApiResponseSchema(200, "Success", "An email has been sent to you including password reset link, you can reset password using this link"))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not found", "User doesn't exist"))
    @Post("/forgotPassword")
    @ApiBody({ type: ForgotPasswordDto })
    async generatePasswordResetToken(@Request() req: Express.Request, @Body() passwordDto: ForgotPasswordDto): Promise<{ statusCode: Number, message: String }> {
        try {
            const serverUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let result = await this.authService.generatePasswordResetToken(passwordDto.email.toLowerCase(), serverUrl)
            if (result) {
                return {
                    statusCode: 200,
                    message: "An email has been sent to you including password reset link, you can reset password using this link"
                }
            }
            throw new NotFoundException("User not found and unable to send the password reset email")

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException()
        }
    }

    // Google Authentication
    @ApiTags("Auth")
    @Get('google')
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @UseGuards(GoogleOauthGuard)
    async auth() {
        // initiate google login oage
    }

    @ApiTags("Auth")
    @Get('google/callback')
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @ApiExtraModels(User)
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Logged in successfully", {
        access_token: {
            type: 'string',
            example: 'g7fgufh83yh893ytgh93yhg9g8y93'
        },
        data: {
            $ref: getSchemaPath(User)
        }
    }))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not found", "User not found"))
    @UseGuards(GoogleOauthGuard)
    async googleAuthCallback(@Req() req: Express.Request, @Res() res: Express.Response) {
        try {
            let user = req['user'] as GoogleProfileTranslated
            if (user) {
                const userDto = new UserSignUpDto()
                userDto.name = user.name
                userDto.email = user.email
                let existingUser = await this.userService.findOneByEmail(user.email)
                if (!existingUser) {
                    const result = await this.authService.authGmailUser(userDto)
                    console.log(user)
                    //TODO://
                    // res.cookie('access_token', token.access_token, {
                    //     httpOnly: true,
                    //     secure: process.env.NODE_ENV === 'production', // Use true if using HTTPS
                    //     sameSite: 'strict', // Helps prevent CSRF attacks
                    // });

                    let response = {
                        statusCode: 200,
                        message: "Logged in successfully",
                        access_token: result.access_token,
                        data: result.user as Users
                    }

                    return res.redirect(`http://localhost:3001/auth/google/callback?response=${encodeURIComponent(JSON.stringify(response))}`);
                } else {
                    if (existingUser.source == "in-app") {
                        throw new BadRequestException(`This email is associated with some in-app based account. Continue using app through in-app login`)
                    }
                    const payload = { _id: existingUser.id, roles: existingUser.roles }
                    let response = {
                        statusCode: 200,
                        message: "Logged in successfully",
                        access_token: await this.authService.generateJWT(payload),
                        data: existingUser as Users
                    }
                
                 return res.redirect(`http://localhost:3001/auth/google/callback?response=${encodeURIComponent(JSON.stringify(response))}`);
                }
            }
            throw new NotFoundException("User not found")
        } catch (error) {
            // If it's a known error type, rethrow it; otherwise, throw a generic server error
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException()
        }
    }

    @Get("/whoAmI")
    @ApiBearerAuth()
    @UseGuards(AuthGuard, UserIdThrottleGuard)
    @ApiTags("Auth")

    @ApiOkResponse(createApiResponseSchema(200, "Success", "User found", {
        data: { $ref: getSchemaPath(User) }

    }))
    @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to fetch user"))
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Throttle_Limit(10)
    @Throttle_Ttl(6000)
    async whoAmI(@Req() request: Express.Request): Promise<{ statusCode: Number, message: String, data: User }> {
        try {
            const userObj = request['user'] as JWTPayloadModel
            if (userObj && userObj._id) {
                const user = await this.userService.findOneById(userObj._id)
                if (user) {
                    return {
                        statusCode: 200,
                        message: "User found",
                        data: user
                    }
                }
                throw new BadRequestException("Failed to fetch user")
            }
            throw new NotFoundException("User doesn't exist in request")
        } catch (err) {
            if (err instanceof BadRequestException || err instanceof NotFoundException) {
                throw err
            }
            throw new InternalServerErrorException()
        }
    }
}
