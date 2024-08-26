import { BadRequestException, Body, Controller, Get, HttpStatus, InternalServerErrorException, Post, Req, Request, Res, Response, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiNotFoundResponse, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { SignInDto } from '../DTO/SignInDto';
import { AuthService } from '../Service/auth.service';
import { PasswordDto } from 'src/User/DTO/PasswordDto';
import { AuthGuard } from 'src/Auth/auth.guard';

import { GoogleOauthGuard } from './google-auth.guard';
import { UserService } from 'src/User/Service/user-service/user-service.service';
import { UserDto } from 'src/User/DTO/user.dto';
import { createApiResponseSchema } from 'src/ErrorResponse.utils';
import { User } from 'src/User/Schema/user.schema';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private userService: UserService) { }
    @ApiTags("Auth")
    @ApiOkResponse(createApiResponseSchema(200, "Success","Logged in successfully!", {access_token: {
        type: 'string',
        example: "ey7yrgbu7yr4ir982y2i9yr92u90399"
    }, user: {
        $ref: getSchemaPath(User),
    }}))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not found", "Login Failed! user not found"))
    @ApiBody({ type: SignInDto })
    @Post("/signIn")
    async signIn(@Response() res, @Body() signInDto: SignInDto): Promise<{message: string, access_token: string, user: User}> {
        
        try {
            const result = await this.authService.signIn(signInDto)
            if (result && result) {
                res.cookie('jwt', result.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Use true if using HTTPS
                    sameSite: 'strict', // Helps prevent CSRF attacks
                });
                return res.status(HttpStatus.OK).json({
                    message: "Logged in successfully!",
                    access_token: result.access_token,
                    user: result.user
                })
            }
            else {
                return res.status(HttpStatus.NOT_FOUND).json({
                    message: "Log in failed..!"
                })
            }
        } catch (error) {
            throw new InternalServerErrorException()
        }
    }

    @ApiTags("Auth")
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Logout success."))
    @Get('signOut')
    async signOut(@Response() res): Promise<void> {
        try {
            res.clearCookie('jwt')
            return res.status(200).json({ message: 'Signed out successfully' });
        } catch (err) {
            throw new InternalServerErrorException()
        }
    }

    @ApiTags("Auth")
    @ApiOkResponse(createApiResponseSchema(200, "Success","An email has been sent to you including password reset link, you can reset password using this link"))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not found","User doesn't exist"))
    @Post("/forgotPassword")
    @ApiBody({ type: PasswordDto })
    async generatePasswordResetToken(@Request() req, @Response() res, @Body() passwordDto: PasswordDto): Promise<any> {
        try {
            const serverUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let result = await this.authService.generatePasswordResetToken(passwordDto.email.toLowerCase(), serverUrl)
            if (result) {
                return res.status(HttpStatus.OK).json({
                    message: "An email has been sent to you including password reset link, you can reset password using this link"
                })
            } else {
                return res.status(HttpStatus.NOT_FOUND).json({
                    message: "User doesn't exist"
                })
            }

        } catch (error) {
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
    @ApiOkResponse(createApiResponseSchema(200, "Success","Logged in successfully", {
        access_token: {
            type: 'string',
            example: 'g7fgufh83yh893ytgh93yhg9g8y93'
        },
        user: {
            $ref: getSchemaPath(User)
        }
    }))
    @ApiNotFoundResponse(createApiResponseSchema(404,"Not found", "User not found"))
    @UseGuards(GoogleOauthGuard)
    async googleAuthCallback(@Req() req, @Response() res): Promise<{acces_token: string, user: User}> {
        try {
            let user = req['user']
            if (user) {
                const userDto = new UserDto()
                userDto.name = user.name
                userDto.email = user.email
                
                const token = await this.authService.authGmailUser(userDto)
                res.cookie('access_token', token.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Use true if using HTTPS
                    sameSite: 'strict', // Helps prevent CSRF attacks
                });
                return res.status(HttpStatus.OK).json({
                    message: "Logged in successfully",
                    access_token: token.access_token,
                    user: user
                });
            }
            return res.status(HttpStatus.NOT_FOUND).json({
                message: "User not found"
            })
        } catch (error) {
            throw new InternalServerErrorException()
        }
    }

}
