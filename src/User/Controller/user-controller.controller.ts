import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Response, UseGuards } from '@nestjs/common';
import { UserService } from '../Service/user-service/user-service.service';
import { UserDto } from '../DTO/user.dto';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { User } from '../Schema/user.schema';
import { response } from 'express';
import { PasswordDto } from '../DTO/PasswordDto';
import { AuthGuard } from 'src/Auth/auth.guard';
@Controller('user')
export class UserControllerController {
    constructor(private readonly userService: UserService) { }

    // sign up
    @ApiBody({ type: UserDto })
    @ApiResponse({ status: 201, description: 'The user has been created successfully.' })
    @ApiResponse({ status: 400, description: 'Error:User Not Created.' })
    @ApiResponse({ status: 404, description: 'Cannot POST /user.' })
    @Post()
    async createUser(@Response() res, @Body() dto: UserDto): Promise<String> {
        try {
            const user = await this.userService.createUser(dto)
            return res.status(HttpStatus.CREATED).json({
                message: 'User has been created successfully',
                user
            });
        } catch (err) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode: res.statusCode,
                message: res.message,
                error: 'Bad Request'
            });
        }
    }

    // find user
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiResponse({status: 302, description:"User found"})
    @ApiResponse({status: 404, description:"User not found"})
    @ApiQuery({name: 'email', type: String})
    @Get()
    async findOne(@Response() response, @Query('email') email: String): Promise<User> {
        try {
            const existingUser = await this.userService.findOne(email)
            if (existingUser != null) {
                // user exist
            return response.status(HttpStatus.FOUND).json({
                message: "User found!",
                existingUser
            })
        } else {
            /// user doesn't exist
            return response.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: "User doesn't exist!",
                existingUser
            })
        }
        } catch (err) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                statusCode: response.statusCode,
                message: response.message,
                error: 'Bad Request'
            });
        }
    }

    // delete user
    @ApiBearerAuth()
    @ApiResponse({status: 202, description:"User deleted successfully"})
    @ApiResponse({status: 404, description:"User not found"})
    @Delete()
    async deleteUser(@Response() response, @Query('email') email: string): Promise<number> {
        try {
            let deletedCount = await this.userService.deleteUser(email)
            if (deletedCount > 0) {
            return response.status(HttpStatus.ACCEPTED).json({
            message: "User deleted successfully"
         })
        } else {
            return response.status(HttpStatus.NOT_FOUND).json({
                statusCode: response.statusCode,
                message: response.message,
                error: 'User not found'
            });
        }
    } catch(err) {
        return response.status(HttpStatus.BAD_REQUEST).json({
            statusCode: response.statusCode,
            message: response.message,
            error: 'Bad Request'
        });
    }
    }

    // forgot password
    // @ApiBearerAuth()
    // @ApiResponse({status: 304, description: "Password update failed"})
    // @ApiResponse({status: 202, description: "Password updated successfully"})
    // @ApiResponse({status: 404, description:"Not found"})
    // @Post("/forgotPassword")
    // @ApiBody({ type: PasswordDto})
    // async forgotPassword(@Response() response, @Body() passwordDto: PasswordDto) {
    //     try {
    //  const mail = await this.userService.sendForgotPasswordEmail(passwordDto.email)
    //   return response.status(200).json({
    //     message: 'success',
    //     mail,
    //   });
  

    // } catch(err) {
    //     return response.status(HttpStatus.BAD_REQUEST).json({
    //         statusCode: response.statusCode,
    //         message: response.message,
    //         error: 'Bad Request'
    //     });
    // }

    // }


    // async forgotPassword(@Response() response, @Body() passwordDto: PasswordDto) {
    //     try {
    //     const updatedUser = await this.userService.forgotPassword(passwordDto)
    //     if (updatedUser != null) {
    //        return response.status(HttpStatus.ACCEPTED).json({
    //             message: "Password Updated Successfully.",
    //             updatedUser
    //         })
    //     }
    //     else {
    //         return response.status(HttpStatus.NOT_MODIFIED).json({
    //             message: "Password Update Failed",
    //         })
    //     }
    // } catch(err) {
    //     return response.status(HttpStatus.BAD_REQUEST).json({
    //         statusCode: response.statusCode,
    //         message: response.message,
    //         error: 'Bad Request'
    //     });
    // }

    // }
}
