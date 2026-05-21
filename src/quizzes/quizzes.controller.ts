import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';
import { RolesGuard } from '../Auth/roles.guard';
import { Roles } from '../Auth/roles.decorator';
import { Role } from '../Auth/role.enum';

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly service: QuizzesService) {}

  // ── AI generation ─────────────────────────────────────────────────────────
  @Post('generate')
  generate(
    @Body('subject') subject: string,
    @Body('level')   level:   string,
    @Body('topic')   topic:   string,
  ) {
    return this.service.generateQuiz(subject, level, topic);
  }

  // ── Save AI Quiz to DB ────────────────────────────────────────────────────
  @Post('save-ai')
  saveAIQuiz(@Body() dto: any, @Req() req) {
    return this.service.saveAIQuiz(dto, req.user.id);
  }

  // ── Quiz attempts (POST) ──────────────────────────────────────────────────
  @Post('attempts')
  saveAttempt(@Body() dto: any, @Req() req) {
    return this.service.saveAttempt(dto, req.user.id);
  }

  // ── Teacher CRUD (POST) ───────────────────────────────────────────────────
  @Post()
  create(@Body() dto: any, @Req() req) {
    return this.service.create(dto, req.user.id);
  }

  // ── Admin GET routes ──────────────────────────────────────────────────────
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

  // ── Teacher GET routes ────────────────────────────────────────────────────
  @Get('mine')
  findMine(@Req() req) {
    return this.service.findMyQuizzes(req.user.id);
  }

  @Get('teacher/stats')
  getTeacherStats(@Req() req) {
    return this.service.getTeacherStats(req.user.id);
  }

  @Get('teacher/attempts')
  getTeacherAttempts(@Req() req) {
    return this.service.getTeacherQuizAttempts(req.user.id);
  }

  // ── Student GET routes ────────────────────────────────────────────────────
  @Get('available')
  findForStudent(@Req() req) {
    return this.service.findForStudent(req.user.schoolId ?? null);
  }

  @Get('available/offline')
  findOffline(@Req() req) {
    return this.service.findOfflineForStudent(req.user.schoolId ?? null);
  }

  @Get('saved-ai')
  getSavedAI(@Req() req) {
    return this.service.getSavedAIQuizzes(req.user.id);
  }

  // ── Attempt GET routes ────────────────────────────────────────────────────
  @Get('attempts/mine')
  getAttempts(@Req() req) {
    return this.service.getMyAttempts(req.user.id);
  }

  @Get('attempts/stats')
  getStats(@Req() req) {
    return this.service.getAttemptStats(req.user.id);
  }

  // ── Wildcard :id — MUST be last among GET routes ──────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ── Patch / Delete ────────────────────────────────────────────────────────
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @Req() req) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  adminRemove(@Param('id') id: string) {
    return this.service.adminRemove(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.id);
  }
}