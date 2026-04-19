import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from 'src/Auth/jwt-auth-guard';
import { RolesGuard } from 'src/Auth/roles.guard';
import { Roles } from 'src/Auth/roles.decorator';
import { Role } from 'src/Auth/role.enum';

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly service: QuizzesService) {}

  // ── AI generation ──────────────────────────────────────────────────────────
  @Post('generate')
  generate(
    @Body('subject') subject: string,
    @Body('level')   level:   string,
    @Body('topic')   topic:   string,
  ) {
    return this.service.generateQuiz(subject, level, topic);
  }

  // ── Admin: list ALL quizzes (teacher-created + AI attempts) ────────────────
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/all')
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/attempts')
  getAllAttempts() {
    return this.service.getAllAttempts();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  adminRemove(@Param('id') id: string) {
    return this.service.adminRemove(id);
  }

  // ── Teacher CRUD ──────────────────────────────────────────────────────────
  @Post()
  create(@Body() dto: any, @Req() req) {
    return this.service.create(dto, req.user.id);
  }

  @Get('mine')
  findMine(@Req() req) {
    return this.service.findMyQuizzes(req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @Req() req) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.id);
  }

  // ── Student browse ────────────────────────────────────────────────────────
  @Get('available')
  findForStudent(@Req() req) {
    return this.service.findForStudent(req.user.schoolId ?? null);
  }

  @Get('available/offline')
  findOffline(@Req() req) {
    return this.service.findOfflineForStudent(req.user.schoolId ?? null);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ── Quiz attempts ─────────────────────────────────────────────────────────
  @Post('attempts')
  saveAttempt(@Body() dto: any, @Req() req) {
    return this.service.saveAttempt(dto, req.user.id);
  }

  @Get('attempts/mine')
  getAttempts(@Req() req) {
    return this.service.getMyAttempts(req.user.id);
  }

  @Get('attempts/stats')
  getStats(@Req() req) {
    return this.service.getAttemptStats(req.user.id);
  }
}