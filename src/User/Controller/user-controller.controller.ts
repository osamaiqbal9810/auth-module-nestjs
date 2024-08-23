import { Body, Controller, Delete, Get, HttpStatus, InternalServerErrorException, Param, Post, Query, Response, UseGuards } from '@nestjs/common';
import { UserService } from '../Service/user-service/user-service.service';
import { UserDto } from '../DTO/user.dto';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiResponseOptions, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { User } from '../Schema/user.schema';
import { AuthGuard } from 'src/Auth/auth.guard';
import { PasswordResetDto } from 'src/Auth/DTO/SignInDto';
import { RolesGuard } from '../roles.guard';
import { Role } from '../enums/Role.enum';
import { Roles } from 'src/roles.decorator';

const FORBIDDEN_RESPONSE_OPTIONS: ApiResponseOptions = { status: 403, description: 'Forbidden: Permission not allowed', schema: {
    type: 'object',
    properties: {
        message: {
            type: 'string',
            description: 'Forbidden: Permission not allowed',
            example: 'Forbidden: Permission not allowed'
        }
    },
} }

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    // sign up
    @ApiTags("User")
    // @ApiBody({ type: UserDto })
    @ApiResponse({
        status: 200, description: 'The user has been created successfully.', schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    description: 'User has been created successfully',
                    example: 'User has been created successfully'
                },
                user: { $ref: getSchemaPath(UserDto) }
            },
        }
    })
    @ApiResponse({ status: 304, description: 'Bad Request Exception.', schema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'Bad Request Exception.',
                example: 'Bad Request Exception.'
            }
        }
    } })
    @ApiResponse({ status: 404, description: 'Cannot POST /user.', schema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'Cannot POST /user.',
                example: 'Cannot POST /user.'
            }
        }
    } })
    @Post()
    async createUser(@Response() res, @Body() dto: UserDto): Promise<{ message: String, user: User }> {
        try {
            const user = await this.userService.createUser(dto)
            if (user) {
                return res.status(HttpStatus.OK).json({
                    message: 'User has been created successfully',
                    user
                });
            }
            return res.status(HttpStatus.NOT_MODIFIED).json({
                message: 'Failed to create user',
            });
        } catch (error) {
            throw new InternalServerErrorException()
        }
    }

    // Find user by email
    @ApiTags("User")
    @UseGuards(AuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: "User found", schema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'User found',
                example: 'User found'
            },
            user: { $ref: getSchemaPath(UserDto) }
        },
    } })
    @ApiResponse({ status: 404, description: "User not found", schema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'User not found',
                example: '"User not found'
            }
        }
    } })
    @ApiResponse({ status: 403, description: 'Forbidden: Permission not allowed', schema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'Forbidden: Permission not allowed',
                example: 'Forbidden: Permission not allowed'
            }
        }
    } })
    @ApiQuery({ name: 'email', type: String })
    @Get()
    @Roles(Role.Admin)
    async findOne(@Response() response, @Query('email') email: string): Promise<{message: string, user: User}> {
        return this.findUser(response, () => this.userService.findOneByEmail(email), email);
    }

    // Find user by ID
    @ApiTags("User")
    @UseGuards(AuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: "User found", schema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'User found',
                example: 'User found'
            },
            user: { $ref: getSchemaPath(UserDto) }
        },
    }  })
    @ApiResponse({ status: 404, description: "User not found", schema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'User not found',
                example: 'User not found'
            }
        }
    } })
    @ApiResponse(FORBIDDEN_RESPONSE_OPTIONS)
    @ApiParam({ name: 'id', type: String })
    @Get("/:id")
    @Roles(Role.Admin)
    async findOneById(@Response() response, @Param('id') id: string): Promise<{message: string, user: User}> {
        return this.findUser(response, () => this.userService.findOneById(id), id);
    }

    // Common method to handle both by email and by ID
    private async findUser(response, user: () => Promise<User>, identifier: string): Promise<{message: string, user: User}> {
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
            throw new InternalServerErrorException()
        }
    }

    // delete user by email
    @ApiTags("User")
    @UseGuards(RolesGuard)
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: "User deleted successfully", schema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'User deleted successfully',
                example: 'User deleted successfully'
            },
            user: { $ref: getSchemaPath(UserDto) }
        },
    } })
    @ApiResponse({ status: 404, description: "User not found", schema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'User not found',
                example: 'User not found'
            }
        },
    } })
    @ApiResponse(FORBIDDEN_RESPONSE_OPTIONS)
    @Delete()
    @Roles(Role.Admin)

    async delete(@Response() response, @Query('email') email: string): Promise<{messsage: string, userdId: string}> {
        return await this.deleteUser(response, () => this.userService.deleteUser(email))
    }

    // delete by Id
    @ApiTags("User")
    @ApiBearerAuth() //
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiResponse({ status: 200, description: "User deleted successfully" })
    @ApiResponse({ status: 404, description: "User not found" })
    @ApiResponse({ status: 403, description: 'Forbidden: Permission not allowed' })
    @ApiParam({ type: String, name: 'id' })
    @Delete("/:id")
  
    async deleteUserById(@Response() response, @Param('id') id: string): Promise<{messsage: string, userdId: string}> {
        return await this.deleteUser( response, () => this.userService.deleteUserById(id) )    
    }

    async deleteUser(@Response() response, user: () => Promise<User>): Promise<{messsage: string, userdId: string}> {
        try {
            let deletedUser = await user();
            if (deletedUser) {
                return response.status(HttpStatus.OK).json({
                    message: "User deleted successfully",
                    userId: deletedUser.id
                })
            } else {
                return response.status(HttpStatus.NOT_FOUND).json({
                    statusCode: response.statusCode,
                    message: response.message,
                    error: 'User not found'
                });
            }
        } catch (err) {
            console.log(err)
            throw new InternalServerErrorException()
        }
    }

    @ApiTags("User")
    @ApiResponse({ status: 200, description: "Password updated successfully" })
    @ApiResponse({ status: 404, description: "Password update failed. Reset token may got expired." })
    @ApiResponse({ status: 400, description: "Error: Bad Request" })
    @Post("/reset-password")
    @ApiQuery({ name: 'reset-token', type: String })
    @ApiBody({ type: PasswordResetDto })
    async resetPassword(@Response() response, @Query("reset-token") token: string, @Body() resetDto: PasswordResetDto) {
        try {
            let result = await this.userService.resetPassword(token, resetDto)
            if (result) {
                return response.status(HttpStatus.OK).json({
                    message: "Password updated successfully."
                })

            } else {
                return response.status(HttpStatus.NOT_FOUND).json({
                    message: "Password update failed. Reset token may got expired"
                });
            }
        } catch (err) {
            throw new InternalServerErrorException()
        }
    }
}
