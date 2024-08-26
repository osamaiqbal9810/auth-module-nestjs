import { ApiResponseOptions } from "@nestjs/swagger";
import { ReferenceObject, SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";

export const createApiResponseSchema = (
    statusCode: number,
    statusMessage: string,
    message: string | string[],
    additionalProps: Record<string, SchemaObject | ReferenceObject> = {},
): ApiResponseOptions => (
    {
    status: statusCode,
    description: statusMessage,
    schema: {
        type: 'object',
        properties: {
            message: Array.isArray(message)
                ? {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of messages',
                    example: message,
                }
                : {
                    type: 'string',
                    description: message,
                    example: message,
                },
            statusCode: {
                type: 'number',
                description: statusCode.toString(),
                example: statusCode,
            },
            ...additionalProps,
        },
    },
});

