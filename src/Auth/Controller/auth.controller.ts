import { Body, Controller, Get, HttpStatus, Post, Request, Response, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';

import { SignInDto } from '../DTO/SignInDto';
import { AuthService } from '../Service/auth.service';
import { PasswordDto } from 'src/User/DTO/PasswordDto';
import { AuthGuard } from 'src/Auth/auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @ApiResponse({status: 400, description: "Error: Bad Request"})
    @ApiResponse({status: 404, description: "Login Failed. Not Found"})
    @ApiResponse({status: 200, description: "Login Successful."})
    @ApiBody({type: SignInDto})
    @Post("/signIn")
    async signIn( @Response() res ,@Body() signInDto: SignInDto): Promise<any> {
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
        else  {
           return res.status(HttpStatus.NOT_FOUND).json({
                message: "Log in failed..!"
            })
        }
        } catch(error) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode: error.statusCode,
                message: error.message,
                error: 'Bad Request'
            });
        }
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiResponse({status: 400, description: "Error: Bad Request"})
    @ApiResponse({status: 200, description: "Logout success."})
    @Get('signOut')
    async signOut(@Response() res): Promise<void>  {
        try {
            res.clearCookie('jwt')
            res.status(200).json({ message: 'Signed out successfully' });
        }catch(err) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode: err.statusCode,
                message: err.message,
                error: 'Bad Request'
            });
        }
    }

    

    @ApiResponse({status: 200, description: "An email has been sent to you including password reset link, you can reset password using this link"})
    @ApiResponse({status: 200, description: "User not found"})
    @ApiResponse({status: 400, description: "Error: Bad Request"})
    @Post("/forgotPassword")
    @ApiBody({type: PasswordDto})
    async generatePasswordResetToken(@Request() req, @Response() res, @Body() passwordDto: PasswordDto): Promise<any> {
        try {
        const serverUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
          let result = await this.authService.generatePasswordResetToken(passwordDto.email, serverUrl)
          if (result) {
           return res.status(HttpStatus.OK).json({
                message: "An email has been sent to you including password reset link, you can reset password using this link"
            })
          } else {
          return  res.status(HttpStatus.NOT_FOUND).json({
                message: "User not found"
            })
          }

        } catch(error) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode: error.statusCode,
                message: error.message,
                error: 'Bad Request'
            });
        }
    }
}
