import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from 'src/Auth/jwt-auth-guard';

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post('generate')
  async generate(
    @Body('subject') subject: string,
    @Body('level') level: string,
    @Body('topic') topic: string,
  ) {
    return this.quizzesService.generateQuiz(subject, level, topic);
  }
}