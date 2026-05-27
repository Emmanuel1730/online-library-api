import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { StructuredTestService } from './structured-test.service';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';
import { RolesGuard } from '../Auth/roles.guard';
import { Roles } from '../Auth/roles.decorator';
import { Role } from '../Auth/role.enum';

@Controller('structured-tests')
@UseGuards(JwtAuthGuard)
export class StructuredTestController {
  constructor(private readonly svc: StructuredTestService) {}

  // ── Teacher: generate questions via Groq ─────────────────────────
  @Post('generate-questions')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  generateQuestions(
    @Body('subject') subject: string,
    @Body('form')    form:    string,
    @Body('topic')   topic:   string,
    @Body('count')   count:   number,
  ) {
    return this.svc.generateQuestions(subject, form, topic, count ?? 5);
  }

  // ── Teacher: create / save a test ────────────────────────────────
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  create(@Body() dto: any, @Req() req) {
    return this.svc.create(dto, req.user);
  }

  // ── Teacher: update (edit questions, publish, close) ─────────────
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: any, @Req() req) {
    return this.svc.update(id, dto, req.user);
  }

  // ── Teacher: delete a test ────────────────────────────────────────
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  remove(@Param('id') id: string, @Req() req) {
    return this.svc.remove(id, req.user);
  }

  // ── Teacher: get their own tests ──────────────────────────────────
  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  getMine(@Req() req) {
    return this.svc.getMyTests(req.user.id);
  }

  // ── Teacher: get all submissions for a test ───────────────────────
  @Get(':id/submissions')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  getSubmissions(@Param('id') id: string) {
    return this.svc.getSubmissions(id);
  }

  // ── Teacher: AI-mark a submission ────────────────────────────────
  @Post('submissions/:submissionId/ai-mark')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  aiMark(@Param('submissionId') submissionId: string) {
    return this.svc.aiMarkSubmission(submissionId);
  }

  // ── Teacher: save final marks after review ───────────────────────
  @Patch('submissions/:submissionId/final-marks')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  saveFinalMarks(
    @Param('submissionId') submissionId: string,
    @Body() dto: any,
  ) {
    return this.svc.saveFinalMarks(submissionId, dto);
  }

  // ── Student: list published tests for their school ────────────────
  @Get('available')
  getAvailable(@Req() req) {
    return this.svc.getAvailableTests(req.user.schoolId ?? null);
  }

  // ── Student: get a single test to take ───────────────────────────
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.svc.getOne(id);
  }

  // ── Student: submit answers ───────────────────────────────────────
  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Body('answers') answers: { questionId: string; answer: string }[],
    @Req() req,
  ) {
    return this.svc.submit(id, answers, req.user.id);
  }

  // ── Student: view their own result ───────────────────────────────
  @Get(':id/my-result')
  getMyResult(@Param('id') id: string, @Req() req) {
    return this.svc.getMyResult(id, req.user.id);
  }
}