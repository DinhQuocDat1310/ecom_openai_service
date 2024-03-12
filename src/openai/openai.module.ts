import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { ChatOpenAI } from '@langchain/openai';

@Module({
  controllers: [OpenaiController],
  providers: [OpenaiService, ConfigService],
})
export class OpenaiModule {}
