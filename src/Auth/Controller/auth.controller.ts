import {  Body, Controller, Get, InternalServerErrorException, NotFoundException, Post, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiNotFoundResponse, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { SignInDto } from '../DTO/SignInDto';
import { AuthService } from '../Service/auth.service';
import { PasswordDto } from 'src/User/DTO/PasswordDto';
import { AuthGuard } from 'src/Auth/auth.guard';
import { GoogleOauthGuard } from './google-auth.guard';
import { UserDto } from 'src/User/DTO/user.dto';
import { createApiResponseSchema } from 'src/ErrorResponse.utils';
import { User } from 'src/User/Schema/user.schema';
import Express from 'express';
import { GoogleProfileTranslated } from '../Strategies/google.strategy';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }
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
    @ApiBody({ type: SignInDto })
    @Post("/signIn")
    async signIn(@Body() signInDto: SignInDto): Promise<{ message: String, access_token: String, user: User }> {

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
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException()
        }
    }

    @ApiTags("Auth")
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Logout success."))
    @Get('signOut')
    async signOut(): Promise<{statusCode: Number, message: String }> {
        try {
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
    @ApiBody({ type: PasswordDto })
    async generatePasswordResetToken(@Request() req: Express.Request, @Body() passwordDto: PasswordDto): Promise<{statusCode: Number,message: String}> {
        try {
            const serverUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let result = await this.authService.generatePasswordResetToken(passwordDto.email.toLowerCase(), serverUrl)
            if (result) {
                return {
                    statusCode: 200,
                    message: "An email has been sent to you including password reset link, you can reset password using this link"
                }
            } 
            throw new NotFoundException("User not found and unable to send the email")

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
    @UseGuards(GoogleOauthGuard)
    async auth() {
        // initiate google login oage
    }

    @ApiTags("Auth")
    @Get('google/callback')
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
    async googleAuthCallback(@Req() req: Express.Request): Promise<{ statusCode: Number, message: String, access_token: String, user: User }> {
        try {
            let user = req['user'] as GoogleProfileTranslated
            if (user) {
                const userDto = new UserDto()
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
                    user: result.user
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

}
