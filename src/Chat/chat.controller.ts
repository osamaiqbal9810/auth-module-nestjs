import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiNotFoundResponse, ApiOkResponse, ApiQuery, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AskDto, SelectedDocs } from './DTO/Ask.dto';
import { AuthGuard } from 'src/Auth/auth.guard';
import { JWTPayloadModel } from 'src/Payload.model';
import { spawn } from 'child_process';
import {  ChatHistory, ChatReferences, TokensUsed } from './Model/ChatHistory.model';
import { LLMModel } from '../LLM/enums/LLMs.enum';
import { ChatService } from './chat.service';
import { ChatType } from './enum/chatType.enum';
import { FilesService } from 'src/Files/Service/files.service';
import { ChatHistory as ChatHistoryPrisma } from '@prisma/client';
import { createApiResponseSchema } from 'src/ErrorResponse.utils';
import { LLMService } from 'src/LLM/llm.service';

export type QueryResponse =  {
    answer: string, 
    references: ChatReferences, 
    tokensUsed: TokensUsed
}
// TODO: // roles guard Discussion
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService, private readonly fileService: FilesService, private llmService: LLMService) { }
    @ApiTags("Chat")
    @ApiBody({type: AskDto})
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Post("/ask")
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Respose generated and saved successfully.", {
        fileId: {
          type: 'string',
          example: '8d9384398743749347397b'
        }
      }))

    @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Invalid LLM"))
    async handle_ask(@Body() askDto: AskDto, @Request() request: Express.Request): Promise<{ statusCode: number, message: string, answer: string }> {
        try {
            
            const user = request['user'] as JWTPayloadModel;
            const userId = user._id;
            if (!user) {
                throw new BadRequestException("user in request not found")
            }
            // Extract necessary fields
            const selectedDocs: SelectedDocs[] = askDto.selectedDocs ?? [];
            const fileTags: string[] = askDto.fileTags ?? [];
            const knowledgeBaseId: string = askDto.knowledgeBaseId?.trim() ?? "";
            const referencesCount: number = askDto.referencesCount ?? 0;
            
            // Validate the model
            if (!Object.values(LLMModel).includes(askDto.model as LLMModel)) {
                throw new BadRequestException("Invalid LLM");
            }
          
            let apiKey: string = await this.llmService.getModelApiKey(askDto.model)
            if (askDto.useCustomApiKey && askDto.customApiKey) {
                apiKey = askDto.customApiKey
            }

            let resolvedDocs: SelectedDocs[] = [];
    
            // Determine which source to use for documents
            if (selectedDocs.length > 0) {
                // Documents were already provided, no additional action required
                resolvedDocs = selectedDocs
            } else if (fileTags.length > 0) {
                resolvedDocs = await this.fileService.getFilesBasedOnTags(userId.valueOf(), fileTags);
            } else if (knowledgeBaseId.length > 0) {
                // Implement a function to fetch files based on knowledge base (TODO)
            }
    
            if (resolvedDocs.length <=0) {
                throw new BadRequestException("No Document found or selected")
            }
            // Proceed with generating the query response
            const result = await this.get_query_response(userId, resolvedDocs, askDto.question, referencesCount, apiKey);
            
            // Save the chat history
           let savedChat = await this.chatService.createChatHistory(askDto, userId.valueOf(), ChatType[ChatType.Manual], result, resolvedDocs);
            if (savedChat) {
                return {
                    statusCode: 200,
                    message: "Respose generated and saved successfully",
                    answer: result.answer
                };
            }
            throw new InternalServerErrorException() // TODO: //need to discuss
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException();
        }
    }
    

    @Get("/")
    @ApiTags("Chat")
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @ApiExtraModels(ChatHistory)
    @ApiOkResponse({
        schema: {
          allOf: [
            {
              properties: {
                chatHistory: {
                  type: 'array',
                  items: { $ref: getSchemaPath(ChatHistory) },
                },
              },
            },
          ],
        },
        description: "Chats fetched successfully",
      })

      @ApiNotFoundResponse(createApiResponseSchema(404, "Not Found", "No chat history found"))
      @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "user in request not found"))
    async getChatHistory(@Request() request: Express.Request): Promise<{ statusCode: number, message: string, chatHistory: ChatHistoryPrisma[] }> {
        try {
            const user = request['user'] as JWTPayloadModel;
            if (!user) {
                throw new BadRequestException("user in request not found")
            }
            const userId = user._id.valueOf();
            let chatHistory = await this.chatService.getUserChatHistory(userId)
            if (chatHistory) {
                return {
                    statusCode: 200,
                    message: "Chats fetched successfully",
                    chatHistory: chatHistory
                }
            } 
          throw new NotFoundException("No chat history found")
        } catch(error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException)  {
                throw error
            }
            throw new InternalServerErrorException()
        }
    }

    @ApiTags("Chat")
    @Put("/featureChat")
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiQuery({ name: 'chatId', type: String })
    @ApiOkResponse(createApiResponseSchema(200, "Success", "Chat featured successfully", {
        chatId: {
            type: 'string',
            example: '8d9384398743749347397b'
          }
      }))

    @ApiNotFoundResponse(createApiResponseSchema(404, "Not Found", "Chat not found"))
    @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "user in request not found"))
    async featureChat(@Request() request: Express.Request, @Query('chatId') chatId: string): Promise<{statusCode: number, message: string, chatId: string}> {
        try {
            const user = request['user'] as JWTPayloadModel;
            if (!user) {
                throw new BadRequestException("user in request not found")
            }
            const userId = user._id.valueOf();
           let isFeatured = await this.chatService.featureChat(userId, chatId)
           if (isFeatured) {
            return {
                statusCode: 200,
                message: "Chat featured successfully",
                chatId: chatId
            }
           }
           throw new InternalServerErrorException()
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException()
        } 
    }

    async get_query_response(user_id: String, fileInfo: SelectedDocs[], query: String, noOfReferences: Number, apiKey: String): Promise<QueryResponse> {
        const inputData = {
            user_id,
            fileInfo,
            query,
            noOfReferences,
            apiKey
        };
    
        try {
          return new Promise((resolve, reject) => {
            // Start the Python process
            const pythonProcess = spawn('python', ['./src/Chat/processQuery.py']);
        
            // Write the input data to the Python script
            pythonProcess.stdin.write(JSON.stringify(inputData));
            pythonProcess.stdin.end(); // Close the stdin to signal that we're done sending data
        
            let output = '';
        
            // Listen for data coming from stdout
            pythonProcess.stdout.on('data', (data) => {
              output += data.toString(); // Accumulate the output data
            });
        
            // Listen for errors from stderr
            pythonProcess.stderr.on('data', (data) => {
              console.error('Error:', data.toString());
            });
        
            // When the process closes, resolve or reject the promise
            pythonProcess.on('close', (code) => {
              if (code !== 0) {
                reject(new Error(`Python process exited with code ${code}`));
              } else {
                try {
                  // Parse the output JSON
                  resolve(JSON.parse(output));
                } catch (error) {
                  reject(error); // Handle parsing error
                }
              }
            });
          });
        } catch (error) {
          console.error('Error executing Python script:', error);
          throw new Error('Failed to process file');
        }
      }
}