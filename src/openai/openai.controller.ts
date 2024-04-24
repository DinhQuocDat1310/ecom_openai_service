import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { OpenaiService } from './openai.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ChatDTO } from './dto/chatDto';
import { ConfigService } from '@nestjs/config';
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('openai')
@ApiTags('OpenAI')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiOkResponse({ description: 'Ok' })
  @ApiBody({ type: ChatDTO })
  @Post('/chat')
  @ApiOperation({ summary: 'Chat with AI' })
  async chatWithAI(@Body() chatDTO: ChatDTO) {
    return await this.openaiService.chatWithAI(chatDTO.text);
  }

  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiOkResponse({ description: 'Ok' })
  @ApiBody({ type: ChatDTO })
  @Post('/chat/prompt')
  @ApiOperation({
    summary: 'Chat with AI Prompt (Information of facts about animal?)',
  })
  async chatWithPrompt(@Body() chatDTO: ChatDTO) {
    return await this.openaiService.chatWithPrompt(chatDTO.text);
  }

  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiOkResponse({ description: 'Ok' })
  @Get('/run')
  @ApiOperation({
    summary: 'Embedded vector',
  })
  async runEmbedVector() {
    return await this.openaiService.run();
  }

  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiOkResponse({ description: 'Ok' })
  @ApiBody({ type: ChatDTO })
  @Post('/chat/embed')
  @ApiOperation({
    summary: 'Chat query with Embedded vector and LLM',
  })
  async searchWithEmbedData(@Body() chatDTO: ChatDTO) {
    return await this.openaiService.searchWithEmbedData(chatDTO.text);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload file to embed (PDF/PNG/WORD)' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  async uploadFile(@UploadedFile('file') file: any) {
    return await this.openaiService.readDataFile(file);
  }
}
