import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsInt, IsOptional, IsArray, IsBoolean } from "class-validator";
import { PageRanges } from "../Model/ChatHistory.model";

export class SelectedDocs {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fileId: string; // Use lowercase `string` instead of `String`

    @ApiProperty({ type: [PageRanges] })
    @IsArray()
    pageRanges: PageRanges[];

    constructor(selectedDoc?: Partial<SelectedDocs>) {
        this.fileId = selectedDoc?.fileId ?? "";
        this.pageRanges = selectedDoc?.pageRanges ?? [];
    }
}

export class AskDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    question: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    modelId: string;

    @IsInt()
    @IsOptional()
    @ApiProperty()
    referencesCount: number; 

    @IsArray()
    @IsOptional() // Marking as optional since it might not be present
    @ApiProperty({ type: [SelectedDocs] })
    selectedDocs?: SelectedDocs[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsOptional()
    @IsString({ each: true }) // Ensure each item in the array is a string
    fileTags?: string[];

    @ApiProperty()
    @IsString()
    @IsOptional()
    knowledgeBaseId?: string;

    @IsBoolean()
    @ApiProperty()
    useCustomApiKey: boolean;

    @IsString()
    @IsOptional()
    @ApiProperty()
    customApiKey?: string;

    constructor(askDto?: Partial<AskDto>) {
        this.question = askDto?.question ?? '';
        this.modelId = askDto?.modelId ?? '';
        this.referencesCount = askDto?.referencesCount ?? 0;
        this.selectedDocs = askDto?.selectedDocs;
        this.fileTags = askDto?.fileTags;
        this.knowledgeBaseId = askDto?.knowledgeBaseId;
        this.useCustomApiKey = askDto?.useCustomApiKey ?? false;
        this.customApiKey = askDto?.customApiKey;
    }
}
