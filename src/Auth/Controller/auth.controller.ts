import { Body, Controller, HttpCode, HttpStatus, Post, Response } from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

import { SignInDto } from '../DTO/SignInDto';
import { AuthService } from '../Service/auth.service';
import { PasswordDto } from 'src/User/DTO/PasswordDto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @ApiResponse({status: 400, description: "Error: Bad Request"})
    @ApiResponse({status: 404, description: "Login Failed. Not Found"})
    @ApiResponse({status: 200, description: "Login Successful."})
    @ApiBody({type: SignInDto})
    @Post("/signIn")
    async singIn( @Response() res ,@Body() signInDto: SignInDto) {
        try {
        const result = await this.authService.signIn(signInDto)
        if (result && result) {
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
                statusCode: res.statusCode,
                message: res.message,
                error: 'Bad Request'
            });
        }
    }

    @ApiResponse({status: 200, description: "An email has been sent to you including password reset link, you can reset password using this link"})
    @ApiResponse({status: 200, description: "User not found"})
    @ApiResponse({status: 400, description: "Error: Bad Request"})
    @Post("/forgotPassword")
    @ApiBody({type: PasswordDto})
    async generatePasswordResetToken(@Response() res, @Body() passwordDto: PasswordDto) {
        try {
          let result = this.authService.generatePasswordResetToken(passwordDto.email)
          if (result) {
            res.status(HttpStatus.OK).json({
                message: "An email has been sent to you including password reset link, you can reset password using this link"
            })
          } else {
            res.status(HttpStatus.NOT_FOUND).json({
                message: "User not found"
            })
          }

        } catch(err) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode: res.statusCode,
                message: res.message,
                error: 'Bad Request'
            });
        }
    }
}
