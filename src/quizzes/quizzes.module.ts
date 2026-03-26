import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './quizzes.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz])
  ],
  providers: [QuizzesService],
  controllers: [QuizzesController]
})
export class QuizzesModule {}
