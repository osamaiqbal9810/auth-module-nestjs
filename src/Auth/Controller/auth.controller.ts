import { BadRequestException, Body, Controller, Get, HttpStatus, Post, Req, Request, Res, Response, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignInDto } from '../DTO/SignInDto';
import { AuthService } from '../Service/auth.service';
import { PasswordDto } from 'src/User/DTO/PasswordDto';
import { AuthGuard } from 'src/Auth/auth.guard';
import { get } from 'http';
import { GoogleOauthGuard } from './google-auth.guard';
import { UserService } from 'src/User/Service/user-service/user-service.service';
import { UserDto } from 'src/User/DTO/user.dto';
import { use } from 'passport';
import { Role } from 'src/User/enums/Role.enum';
// import { GoogleOauthGuard } from './google-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private userService: UserService) { }
    @ApiTags("Auth")
    @ApiResponse({ status: 400, description: "Error: Bad Request" })
    @ApiResponse({ status: 404, description: "Login Failed. Not Found" })
    @ApiResponse({ status: 200, description: "Login Successful." })
    @ApiBody({ type: SignInDto })
    @Post("/signIn")
    async signIn(@Response() res, @Body() signInDto: SignInDto): Promise<any> {
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
                    result
                })
            }
            else {
                return res.status(HttpStatus.NOT_FOUND).json({
                    message: "Log in failed..!"
                })
            }
        } catch (error) {
            throw new BadRequestException()
        }
    }

    @ApiTags("Auth")
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiResponse({ status: 400, description: "Error: Bad Request" })
    @ApiResponse({ status: 200, description: "Logout success." })
    @Get('signOut')
    async signOut(@Response() res): Promise<void> {
        try {
            res.clearCookie('jwt')
            res.status(200).json({ message: 'Signed out successfully' });
        } catch (err) {
            throw new BadRequestException()
        }
    }

    @ApiTags("Auth")
    @ApiResponse({ status: 200, description: "An email has been sent to you including password reset link, you can reset password using this link" })
    @ApiResponse({ status: 200, description: "User not found" })
    @ApiResponse({ status: 400, description: "Error: Bad Request" })
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
                    message: "User not found"
                })
            }

        } catch (error) {
            throw new BadRequestException()
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
    @UseGuards(GoogleOauthGuard)
    async googleAuthCallback(@Req() req, @Response() res) {
        try {
            let user = req['user']
            if (user) {
                const userDto = new UserDto()
                userDto.name = user.name
                userDto.email = user.email
                userDto.roles = [Role.User]  // TODO
                userDto.subscriptionPlan = "Basic"  // TODO
                const token = await this.authService.authGmailUser(userDto)
                res.cookie('access_token', token.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Use true if using HTTPS
                    sameSite: 'strict', // Helps prevent CSRF attacks
                });
                return res.status(HttpStatus.OK).json({
                    access_token: token.access_token,
                    user: user
                });
            }
            return res.status(HttpStatus.FAILED_DEPENDENCY).json({
                message: "User not found"
            })
        } catch (error) {
            throw new BadRequestException()
        }
    }

}
