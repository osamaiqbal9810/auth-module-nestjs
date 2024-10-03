import { Injectable, NotFoundException } from '@nestjs/common';
import { AskDto, SelectedDocs } from './DTO/Ask.dto';
import { PrismaService } from 'src/prisma.service';
import { QueryResponse } from './chat.controller';
import { ChatFile } from './Model/ChatHistory.model';
import { FilesService } from 'src/Files/Service/files.service';
import { ChatHistory } from '@prisma/client';

@Injectable()
export class ChatService {

    constructor(private prismaService: PrismaService, private fileService: FilesService) { }

    async createChatHistory(ask: AskDto, userId: string, chatType: string, result: QueryResponse, files: SelectedDocs[]): Promise<ChatHistory> {
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
}
