import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './quizzes.entity';
import { QuizAttempt } from './quizzes-attempt.entity';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { ClassResource } from 'src/class-resource/class-resource.entity';
import { ClassResourceController } from 'src/class-resource/class-resource.controller';
import { ClassResourceService } from 'src/class-resource/class-resource.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, QuizAttempt, ClassResource])],
  controllers: [QuizzesController, ClassResourceController],
  providers: [QuizzesService, ClassResourceService],
  exports: [QuizzesService, ClassResourceService],
})
export class QuizzesModule {}