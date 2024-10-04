import { Injectable, NotFoundException } from '@nestjs/common';
import { AskDto, SelectedDoc } from './DTO/Ask.dto';
import { PrismaService } from 'src/prisma.service';

import { ChatFile, ChatReference, TokensUsed } from './Model/ChatHistory.model';
import { FilesService } from 'src/Files/Service/files.service';
import { ChatHistory } from '@prisma/client';
import { spawn } from 'child_process';

type PythonQueryResponse = {
    answer: string,
    references: ChatReference[],
    tokensUsed: TokensUsed
  }
  
@Injectable()
export class ChatService {

    constructor(private prismaService: PrismaService, private fileService: FilesService) { }

    async createChatHistory(ask: AskDto, userId: string, chatType: string, result: PythonQueryResponse, files: SelectedDoc[]): Promise<ChatHistory> {
        const allFiles = await this.fileService.getAllFilesOfUser(userId);

        const chatFiles = files.reduce<ChatFile[]>((acc, selectedFile) => {
            const matchedFile = allFiles.find(file => file.id === selectedFile.fileId);

            if (matchedFile) {
                acc.push(new ChatFile({
                    fileId: matchedFile.id,
                    fileName: matchedFile.fileName,
                    fileType: matchedFile.fileType,
                    totalPages: matchedFile.totalPages,
                    pageRanges: selectedFile.pageRanges
                }));
            }

            return acc;
        }, []);

        return await this.prismaService.chatHistory.create({
            data: {
                userId,
                chatType,
                featured: false,
                question: ask.question,
                answer: result.answer,
                model: ask.modelId,
                referencesCount: ask.referencesCount ?? 0,
                references: result.references,
                files: chatFiles,
            },
        });
    }

    async getUserChatHistory(userId: string): Promise<ChatHistory[]> {
        return await this.prismaService.chatHistory.findMany({
            where: { userId: userId }
        })
    }

    async featureChat(userId: string, chatId: string): Promise<boolean> {
        let chatHistory = await this.prismaService.chatHistory.findUnique({
            where: { userId: userId, id: chatId }
        });
        if (!chatHistory) {
            throw new NotFoundException("Chat not found")
        }
        const updatedChatHistory = await this.prismaService.chatHistory.update({
            where: { userId: userId, id: chatId },
            data: { featured: !chatHistory.featured }
        });
        if (!updatedChatHistory) {
            return false
        }
        return true
    }

    async get_query_response(user_id: String, fileInfo: SelectedDoc[], query: String, noOfReferences: Number, apiKey: String): Promise<PythonQueryResponse> {
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
