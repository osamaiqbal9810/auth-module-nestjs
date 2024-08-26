import { ApiResponseOptions, getSchemaPath } from "@nestjs/swagger";
import { UserDto } from "./User/DTO/user.dto";

export const FORBIDDEN_RESPONSE_OPTIONS: ApiResponseOptions = { status: 403, description: 'Forbidden: Permission not allowed', schema: {
    type: 'object',
    properties: {
        message: {
            type: 'string',
            description: 'Forbidden: Permission not allowed',
            example: 'Forbidden: Permission not allowed'
        }
    },
} }


export const Success_Response_Schema = (message: string, model: string) => ({
    status: 200,
    description: message,
    schema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: message,
                example: message,
            },
            user: { 
                $ref: model,
            },
        },
    },
});

export const NOT_MODIFIED_SCHEMA = (message: string) => ({
    status: 304, description: message, schema: {
    type: 'object',
        properties: {
        message: {
            type: 'string',
            description: message,
            example: message
        }
    }
    } 
})

export const Record_NOT_FOUND_SCHEMA = (message: string) => ({
    status: 404, description: message, schema: {
    type: 'object',
        properties: {
        message: {
            type: 'string',
            description: message,
            example: message
        }
    }
    } 
})
