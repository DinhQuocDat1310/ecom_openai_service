import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { Document, Prisma, PrismaClient } from '@prisma/client';
import { loadQAMapReduceChain } from 'langchain/chains';
import * as pdfParser from 'pdf-parse';
import { BufferMemory } from 'langchain/memory';
import { ChatAnthropic } from '@langchain/anthropic';
import { RunnableSequence } from '@langchain/core/runnables';

@Injectable()
export class OpenaiService {
  chatModel = new ChatOpenAI({
    openAIApiKey: this.configService.get('LANGCHAIN_API_KEY'),
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
  });
  db = new PrismaClient();
  constructor(private readonly configService: ConfigService) {}

  chatWithAI = async (chat: string) => {
    if (this.chatModel) {
      return await this.chatModel.invoke(chat);
    }
  };

  chatWithPrompt = async (chat: string) => {
    PrismaVectorStore;
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', 'You have knowledge about all animals'],
      ['human', 'Fact about {animal}'],
    ]);
    const chain = prompt.pipe(this.chatModel);
    return await chain.invoke({
      animal: chat,
    });
  };

  run = async () => {
    const vectorStore = PrismaVectorStore.withModel<Document>(this.db).create(
      new OpenAIEmbeddings({
        openAIApiKey: this.configService.get('LANGCHAIN_API_KEY'),
      }),
      {
        prisma: Prisma,
        tableName: 'Document',
        vectorColumnName: 'vector',
        columns: {
          id: PrismaVectorStore.IdColumn,
          content: PrismaVectorStore.ContentColumn,
        },
      },
    );

    //Data
    const textJson: any[] = [];

    for (let index = 0; index < 200; index++) {
      textJson.push({
        id: 1,
        name: `Product ${index}`,
        price: Math.floor(Math.random() * 20000001),
      });
    }

    // Transform fake data to texts
    const texts = textJson.map(
      (product) => `Name Product: ${product.name} - Price: ${product.price}`,
    );

    await vectorStore.addModels(
      await this.db.$transaction(
        texts.map((content) => this.db.document.create({ data: { content } })),
      ),
    );
  };

  searchWithEmbedData = async (chat: string) => {
    const vectorStore = PrismaVectorStore.withModel<Document>(this.db).create(
      new OpenAIEmbeddings({
        openAIApiKey: this.configService.get('LANGCHAIN_API_KEY'),
      }),
      {
        prisma: Prisma,
        tableName: 'Document',
        vectorColumnName: 'vector',
        columns: {
          id: PrismaVectorStore.IdColumn,
          content: PrismaVectorStore.ContentColumn,
        },
      },
    );
    const retriever = vectorStore.asRetriever();
    const relevantDocs = await retriever.getRelevantDocuments(chat);
    const mapReduceChain = loadQAMapReduceChain(this.chatModel);

    return await mapReduceChain.invoke({
      question: chat,
      input_documents: relevantDocs,
    });
  };

  handleParseBufferToText = async (file: any) => {
    let content: string[] = [];
    const pdf = await pdfParser(file.buffer);
    const lines = pdf.text.split('\n');
    for (const line of lines) {
      if (line.trim() !== '') {
        content.push(line.trim());
      }
    }
    return content;
  };

  filterEmbeddedFile = async (file: any) => {
    let textData: string[] = [];
    switch (file.mimetype) {
      case 'application/pdf':
        textData = await this.handleParseBufferToText(file);
        break;
      case 'image/png':
        break;
      default:
        throw new Error('Unsupported file type');
    }
    return textData;
  };

  readDataFile = async (file: any) => {
    const resultContents = await this.filterEmbeddedFile(file);
    const vectorStore = PrismaVectorStore.withModel<Document>(this.db).create(
      new OpenAIEmbeddings({
        openAIApiKey: this.configService.get('LANGCHAIN_API_KEY'),
      }),
      {
        prisma: Prisma,
        tableName: 'Document',
        vectorColumnName: 'vector',
        columns: {
          id: PrismaVectorStore.IdColumn,
          content: PrismaVectorStore.ContentColumn,
        },
      },
    );

    await vectorStore.addModels(
      await this.db.$transaction(
        resultContents.map((content) =>
          this.db.document.create({ data: { content } }),
        ),
      ),
    );
  };
}
