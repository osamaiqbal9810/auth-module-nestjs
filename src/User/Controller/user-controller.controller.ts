import { BadRequestException, Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { UserService } from '../Service/user-service/user-service.service';
import { UserSignUpDto } from '../DTO/UserSignUp.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiQuery, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { User } from '../Schema/user.schema';
import { AuthGuard } from 'src/Auth/auth.guard';
import { RolesGuard } from '../roles.guard';
import { Role } from '../enums/Role.enum';
import { Roles } from 'src/User/roles.decorator';
import { createApiResponseSchema } from 'src/ErrorResponse.utils';
import { SkipThrottle } from '@nestjs/throttler';
import { ResetPasswordDto } from 'src/Auth/DTO/ResetPassword.dto';
import Express from 'express';
import { VerificationCodeDto } from '../DTO/VerificationCode.dto';
import { ResendVerificationCodeDto } from '../DTO/ResendVerification.dto';

@Controller('user')
@SkipThrottle({ default: false })
export class UserController {
    constructor(private readonly userService: UserService) { }
    // sign up
    @ApiTags("User")
    @ApiBody({ type: UserSignUpDto })
    @ApiExtraModels(User)
    @ApiOkResponse(createApiResponseSchema(200, "Success", "User has been created successfully. An verification email has been sent to your given email address", {
        data: {
            $ref: getSchemaPath(User),
        }
    }))
    @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to create user"))
    @Post()
    async createUser(@Request() req: Express.Request, @Body() dto: UserSignUpDto): Promise<{ statusCode: Number, message: String, data: User }> {
        try {
            const serverUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            const user = await this.userService.createUser(dto, serverUrl)
            if (user) {
                return {
                    statusCode: 200,
                    message: 'User has been created successfully. A verification email has been sent to your given email address.',
                    data: user
                };
            }
            throw new BadRequestException("Failed to create user")

        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException()
        }
    }
    // validate user verification code
    @ApiTags("User")
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Email verification completed successfully"))
    @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Verification code got expired. Please try again."))
    @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Invalid verification code"))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not Found", "user not found"))
    @ApiBody({ type: VerificationCodeDto })
    @Post("/validateCode")
    async validateVerificationCode(@Body() verificationCodeDto: VerificationCodeDto): Promise<{ statusCode: Number, message: String }> {
        try {
            await this.userService.validateVerificationCode(verificationCodeDto)
            return {
                statusCode: 200,
                message: 'Email verification completed successfully'
            };
        } catch (err) {
            if (err instanceof BadRequestException || err instanceof NotFoundException) {
                throw err
            }
            throw new InternalServerErrorException()
        }
    }

    // Resend verification code
    @ApiTags("User")
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Verification email sent"))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not Found", "user not found"))
    @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "User already verified"))
    @ApiBody({ type: ResendVerificationCodeDto })
    @Post("/resendVerificationEmail")

    async resendEmailVeriCode(@Request() req: Express.Request, @Body() resendDto: ResendVerificationCodeDto): Promise<{ statusCode: Number, message: String }> {
        try {
            const serverUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let user = await this.userService.findOneByEmail(resendDto.email)
            if (user) {
                if (user.isVerified) {
                    throw new BadRequestException("User is already verified")
                }
                let isEmailSent = await this.userService.sendVerificationEmail(resendDto.email, serverUrl)
                if (isEmailSent) {
                    return {
                        statusCode: 200,
                        message: 'Verification email sent'
                    }
                }
                throw new InternalServerErrorException("Failed to send verification email")
            }
            throw new NotFoundException("User not found, unable to send verification code")
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException || err instanceof InternalServerErrorException) {
                throw err
            }
            throw new InternalServerErrorException()
        }
    }

    // Find user by email
    @ApiTags("User")
    @UseGuards(AuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOkResponse(createApiResponseSchema(200, "Success", "User Found", {
        data: {
            $ref: getSchemaPath(User),
        }
    }))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not found", "User not found"))
    @ApiForbiddenResponse(createApiResponseSchema(403, "Forbidden", "Permission not allowed"))
    @ApiQuery({ name: 'email', type: String })
    @Get()
    @Roles(Role.Admin)
    async findOne(@Query('email') email: String): Promise<{ message: String, data: User }> {
        return this.findUser(() => this.userService.findOneByEmail(email), email);
    }

    // Find user by ID
    @ApiTags("User")
    @UseGuards(AuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOkResponse(createApiResponseSchema(200, "Success", "User found", {
        data: {
            $ref: getSchemaPath(User),
        }
    }))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not Found", "User not found"))
    @ApiForbiddenResponse(createApiResponseSchema(403, "Forbidden", "Permission not allowed"))
    @ApiParam({ name: 'id', type: String })
    @Get("/:id")
    @Roles(Role.Admin)
    async findOneById(@Param('id') id: String): Promise<{ message: String, data: User }> {
        return this.findUser(() => this.userService.findOneById(id), id);
    }

    // Common method to handle both by email and by ID
    private async findUser(user: () => Promise<User | null>, identifier: String): Promise<{ statusCode: Number, message: String, data: User }> {
        try {
            const existingUser = await user();
            if (existingUser) {
                return {
                    statusCode: 200,
                    message: "User found!",
                    data: existingUser,
                };
            }
            throw new NotFoundException(`User with identifier ${identifier} doesn't exist!`)
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException()
        }
    }

    // delete user by email
    @ApiTags("User")
    @UseGuards(AuthGuard,RolesGuard)
    @ApiBearerAuth()
    @ApiOkResponse(createApiResponseSchema(200, "Success", "User deleted Successfully", {
        data: {
            type: 'string',
            example: "0fe4902384902932932b36"
        }
    }))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not found", "User not found"))
    @ApiForbiddenResponse(createApiResponseSchema(403, "Forbidden", "Permission not allowed"))
    @Delete()
    @Roles(Role.Admin)

    async delete(@Query('email') email: string): Promise<{ statusCode: Number, message: String, data: String }> {
        return await this.deleteUser(() => this.userService.deleteUser(email))
    }

    // delete by Id
    @ApiTags("User")
    @ApiBearerAuth() //
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiOkResponse(createApiResponseSchema(200, "Successs", "User deleted Successfully", {
        data: {
            type: 'string',
            example: "049023849029329323"
        }
    }))
    @ApiNotFoundResponse(createApiResponseSchema(404, "Not found", "User not found"))
    @ApiForbiddenResponse(createApiResponseSchema(403, "Forbidden", "Permission not allowed"))
    @ApiParam({ type: String, name: 'id' })
    @Delete("/:id")

    async deleteUserById(@Param('id') id: string): Promise<{ statusCode: Number, message: String, data: String }> {
        return await this.deleteUser(() => this.userService.deleteUserById(id))
    }

    async deleteUser(user: () => Promise<User>): Promise<{ statusCode: Number, message: String, data: String }> {
        try {
            let deletedUser = await user();
            if (deletedUser) {
                return {
                    statusCode: 200,
                    message: "User deleted successfully",
                    data: deletedUser.id
                }
            }
            throw new NotFoundException("User not found")
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err
            }
            throw new InternalServerErrorException()
        }
    }

    @ApiTags("User")
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Password updated successfully", {}))
    @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Password update failed. Reset token may got expired or User may not exist"))
    @Post("/reset-password")
    @ApiQuery({ name: 'reset-token', type: String })
    @ApiBody({ type: ResetPasswordDto })
    async resetPassword(@Query("reset-token") token: String, @Body() resetDto: ResetPasswordDto): Promise<{ statusCode: Number, message: String }> {
        try {
            await this.userService.resetPassword(token, resetDto)
            return {
                statusCode: 200,
                message: "Password updated successfully."
            }
        } catch (err) {
            if (err instanceof BadRequestException) {
                throw err
            }
            throw new InternalServerErrorException()
        }
    }
}

