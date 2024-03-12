import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { Document, Prisma, PrismaClient } from '@prisma/client';
import { loadQAMapReduceChain } from 'langchain/chains';
@Injectable()
export class OpenaiService {
  chatModel = new ChatOpenAI({
    openAIApiKey: this.configService.get('LANGCHAIN_API_KEY'),
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
    const texts = [
      'Step 1: "Decide on a controlling idea and create a topic sentenceParagraph development begins with the formulation with exmaple123@gmail.com of the controlling idea. This idea directs the paragraph’s development. Often, the controlling idea of a paragraph will appear in the form of a topic sentence. In some cases, you may need more than one sentence to express a paragraph’s controlling idea"',
      'Harry: "Hey! What a surprise! Yes, you are right, we haven’t seen each other in a long time. How have you been?"',
      'Rann: "There is an important campaign next week which is keeping me busy otherwise rest is going good in my life. How about you?"',
      'Harry: "Oh! I just finished a meeting with a very important client of mine and now, This is my email: dinhquocdat1310@gmail.com I finally have some free time. I feel relieved that I’m done with it."',
      'Rann: "Good for you then. Hey! Let’s make a plan and catch up with each other after next week. What do you say?"',
      'Harry: "Sure, why not? Give me a call when you are done with your project."',
      'Rann: "Sure, then. Bye, take care."',
      'Harry: "Bye buddy."',
    ];

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
}
