import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Post, Req, Request, UseGuards } from '@nestjs/common';
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
import { UserIdThrottleGuard } from 'src/throttleUser.guard';
import { Throttle_Limit, Throttle_Ttl } from 'src/Files/Global.constnats';
import { JWTPayloadModel } from 'src/Payload.model';
import { UserService } from 'src/User/Service/user-service/user-service.service';
import { users } from '@prisma/client';
import { UserSignInDto } from '../DTO/UserSignIn.dto';
import { ForgotPasswordDto } from 'src/User/DTO/ForgotPassword.dto';
import { VerifyInAppUserDto } from '../DTO/VerifyEmail.dto';


@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private userService: UserService) { }

    @ApiTags("Auth")
    @ApiOkResponse(createApiResponseSchema(200, "Success", "In App User"))
    @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "This email is associated with some gmail account. Continue using app through gmail login"))
    @ApiBody({ type: UserSignInDto })
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Post("/verifyUserSource")
    async verifyInAppUser(@Body() verifyInAppUserDto: VerifyInAppUserDto): Promise<{statusCode: Number, message: String}> {
        try {
            await this.userService.verifyInAppUser(verifyInAppUserDto)
            return {
                statusCode: 200,
                message: "Success: In-App user"
            }
        } catch(err) {
            if (err instanceof BadRequestException || err instanceof NotFoundException) {
                throw err
            }
            throw new InternalServerErrorException()
        }
    } 
    @ApiTags("Auth")
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Logged in successfully!", {
        access_token: {
            type: 'string',
            example: "ey7yrgbu7yr4ir982y2i9yr92u90399"
        }, user: {
            $ref: getSchemaPath(User),
        }
    }))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not found", "Login Failed! user not found"))
    @ApiBody({ type: UserSignInDto })
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Post("/signIn")
    async signIn(@Body() signInDto: UserSignInDto): Promise<{ message: String, access_token: String, user: User }> {

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
                    message: "Logged in successfully!",
                    access_token: result.access_token,
                    user: result.user
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
        user: {
            $ref: getSchemaPath(User)
        }
    }))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not found", "User not found"))
    @UseGuards(GoogleOauthGuard)
    async googleAuthCallback(@Req() req: Express.Request): Promise<{ statusCode: Number, message: String, access_token: String, user: users }> {
        try {
            let user = req['user'] as GoogleProfileTranslated
            if (user) {
                const userDto = new UserSignUpDto()
                userDto.name = user.name
                userDto.email = user.email

                const result = await this.authService.authGmailUser(userDto)
                //TODO://
                // res.cookie('access_token', token.access_token, {
                //     httpOnly: true,
                //     secure: process.env.NODE_ENV === 'production', // Use true if using HTTPS
                //     sameSite: 'strict', // Helps prevent CSRF attacks
                // });

                return {
                    statusCode: 200,
                    message: "Logged in successfully",
                    access_token: result.access_token,
                    user: result.user as users
                }
            }
            throw new NotFoundException("User not found")
        } catch (error) {
            // If it's a known error type, rethrow it; otherwise, throw a generic server error
            if (error instanceof NotFoundException) {
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
        user: { $ref: getSchemaPath(User) }
        
    }))
    @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to fetch user"))
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Throttle_Limit(10)
    @Throttle_Ttl(6000)
    async whoAmI(@Req() request: Express.Request): Promise<{ statusCode: Number, message: String, user: User }> {
        try {
            const userObj = request['user'] as JWTPayloadModel
            if (userObj && userObj._id) {
                const user = await this.userService.findOneById(userObj._id)
                if (user) {
                    return {
                        statusCode: 200,
                        message: "User found",
                        user
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
