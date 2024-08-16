import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Response, UseGuards } from '@nestjs/common';
import { UserService } from '../Service/user-service/user-service.service';
import { UserDto } from '../DTO/user.dto';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { User } from '../Schema/user.schema';
import { AuthGuard } from 'src/Auth/auth.guard';
import { PasswordResetDto } from 'src/Auth/DTO/SignInDto';
@Controller('user')
export class UserController {
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
        } catch (error) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode: error.statusCode,
                message: error.message,
                error: 'Bad Request'
            });
        }
    }

    // find user
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiResponse({status: 200, description:"User found"})
    @ApiResponse({status: 404, description:"User not found"})
    @ApiQuery({name: 'email', type: String})
    @Get()
    async findOne(@Response() response, @Query('email') email: String): Promise<User> {
        try {
            const existingUser = await this.userService.findOne(email)

            if (existingUser != null) {
                // user exist
            return response.status(HttpStatus.OK).json({
                message: "User found!",
                user: existingUser
            })
        } else {
            /// user doesn't exist
            return response.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: "User doesn't exist!"
            })
        }
        } catch (error) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                statusCode: error.statusCode,
                message: error.message,
                error: 'Bad Request'
            });
        }
    }

        // find user by Id
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiResponse({status: 200, description:"User found"})
    @ApiResponse({status: 404, description:"User not found"})
    @ApiQuery({name: 'id', type: String})
    @Get("/id")
    async findOneById(@Response() response, @Query('id') id: String): Promise<User> {
        try {
            const existingUser = await this.userService.findOneById(id)
            if (existingUser) {
                // user exist
            return response.status(HttpStatus.OK).json({
                message: "User found!",
                user:existingUser
            })
        } else {
            /// user doesn't exist
            return response.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: "User doesn't exist!"
            })
        }
        } catch (error) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                statusCode: error.statusCode,
                message: error.message,
                error: 'Bad Request'
            });
        }
    }
    // delete user
    @ApiBearerAuth()
    @ApiResponse({status: 200, description:"User deleted successfully"})
    @ApiResponse({status: 404, description:"User not found"})
    @Delete()
    async deleteUser(@Response() response, @Query('email') email: string): Promise<number> {
        try {
            let deletedUser = await this.userService.deleteUser(email)
            if (deletedUser) {
            return response.status(HttpStatus.OK).json({
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
            statusCode: err.statusCode,
            message: err.message,
            error: 'Bad Request'
        });
    }
    }
    @ApiResponse({status: 200, description: "Password updated successfully"})
    @ApiResponse({status: 404, description: "Password update failed. Reset token may got expired."})
    @ApiResponse({status: 400, description: "Error: Bad Request"})
    @Post("/reset-password")
    @ApiQuery({name: 'reset-token', type: String})
    @ApiBody({type: PasswordResetDto})
    async resetPassword(@Response() response, @Query("reset-token") token: string, @Body() resetDto: PasswordResetDto) {
        try {
        let result = await this.userService.resetPassword(token, resetDto.newPassword)
       if (result) {
            return response.status(HttpStatus.OK).json({
                message: "Password updated successfully."
            })

       } else {
        return response.status(HttpStatus.NOT_FOUND).json({
            message: "Password update failed. Reset token may got expired."
        });
       }
    } catch(err) {
        return response.status(HttpStatus.BAD_REQUEST).json({
            statusCode: err.statusCode,
            message: err.message,
            error: 'Bad Request'
        });
    }
    }
}
