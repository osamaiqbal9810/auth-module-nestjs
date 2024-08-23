import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Response, UseGuards } from '@nestjs/common';
import { UserService } from '../Service/user-service/user-service.service';
import { UserDto } from '../DTO/user.dto';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../Schema/user.schema';
import { AuthGuard } from 'src/Auth/auth.guard';
import { PasswordResetDto } from 'src/Auth/DTO/SignInDto';
import { RolesGuard } from '../roles.guard';
import { Role, Roles, ROLES_KEY } from '../enums/Role.enum';
import { BadRequestException } from '@nestjs/common';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    // sign up
    @ApiBody({ type: UserDto })
    @ApiResponse({ status: 200, description: 'The user has been created successfully.' })
    @ApiResponse({ status: 400, description: 'Error:User Not Created.' })
    @ApiResponse({ status: 404, description: 'Cannot POST /user.' })
    
    @Post()
    async createUser(@Response() res, @Body() dto: UserDto): Promise<String> {
        try {
            const user = await this.userService.createUser(dto)
            return res.status(HttpStatus.OK).json({
                message: 'User has been created successfully',
                user
            });
        } catch (error) {
              throw new BadRequestException()
        }
    }

    // Find user by email
    @UseGuards(AuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: "User found" })
    @ApiResponse({ status: 404, description: "User not found" })
    @ApiResponse({ status: 403, description: 'Forbidden: Permission not allowed' })
    @ApiQuery({ name: 'email', type: String })
    @Get()
    @Roles(Role.Admin)
    async findOne(@Response() response, @Query('email') email: string): Promise<any> {
        return this.findUser(response, () => this.userService.findOneByEmail(email), email);
    }

    // Find user by ID
    @UseGuards(AuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: "User found" })
    @ApiResponse({ status: 404, description: "User not found" })
    @ApiResponse({ status: 403, description: 'Forbidden: Permission not allowed' })
    @ApiParam({ name: 'id', type: String })
    @Get("/:id")
    @Roles(Role.Admin)
    async findOneById(@Response() response, @Param('id') id: string): Promise<any> {
        return this.findUser(response, () => this.userService.findOneById(id), id);
    }

    // Common method to handle both by email and by ID
    private async findUser(response, user: () => Promise<User>, identifier: string): Promise<any> {
        try {
            const existingUser = await user();
            if (existingUser) {
                return response.status(HttpStatus.OK).json({
                    message: "User found!",
                    user: existingUser,
                });
            } else {
                return response.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: `User with identifier ${identifier} doesn't exist!`,
                });
            }
        } catch (error) {
            throw new BadRequestException()
        }
    }

    // delete user by email
    @UseGuards(RolesGuard)
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: "User deleted successfully" })
    @ApiResponse({ status: 404, description: "User not found" })
    @ApiResponse({ status: 403, description: 'Forbidden: Permission not allowed' })
    @Delete()
    @Roles(Role.Admin)

    async delete(@Response() response, @Query('email') email: string): Promise<number> {
        return await this.deleteUser( response, () => this.userService.deleteUser(email) )
    }

    // delete by Id
    @UseGuards(RolesGuard)
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: "User deleted successfully" })
    @ApiResponse({ status: 404, description: "User not found" })
    @ApiResponse({ status: 403, description: 'Forbidden: Permission not allowed' })
    @ApiParam({ type: String, name: 'id' })
    @Delete("/:id")
    @Roles(Role.Admin)

    async deleteUserById(@Response() response, @Param('id') id: string): Promise<number> {
        return await this.deleteUser( response, () => this.userService.deleteUserById(id) )    
    }

    async deleteUser(@Response() response, user: () => Promise<User>): Promise<number> {
        try {
            let deletedUser = await user();
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
            throw new BadRequestException()
        }
    }

    @ApiResponse({ status: 200, description: "Password updated successfully" })
    @ApiResponse({ status: 404, description: "Password update failed. Reset token may got expired." })
    @ApiResponse({ status: 400, description: "Error: Bad Request" })
    @Post("/reset-password")
    @ApiQuery({ name: 'reset-token', type: String })
    @ApiBody({ type: PasswordResetDto })
    async resetPassword(@Response() response, @Query("reset-token") token: string, @Body() resetDto: PasswordResetDto) {
        try {
            let result = await this.userService.resetPassword(token,resetDto)
            if (result) {
                return response.status(HttpStatus.OK).json({
                    message: "Password updated successfully."
                })

            } else {
                return response.status(HttpStatus.NOT_FOUND).json({
                    message: "Password update failed. Reset token may got expired"
                });
            }
        } catch(err) {
            throw new BadRequestException()
        }
    }
}
