import { Module } from '@nestjs/common';
import { OpenaiModule } from './openai/openai.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    OpenaiModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
})
export class AppModule {}
