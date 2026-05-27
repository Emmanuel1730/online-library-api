import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityAction } from './user-activity.entity';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';
import { RolesGuard } from '../Auth/roles.guard';
import { Roles } from '../Auth/roles.decorator';
import { Role } from '../Auth/role.enum';

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  // ── Activity ──────────────────────────────────────────────────────────────

  @Post('activity')
  async log(
    @Req() req,
    @Body('action') action: ActivityAction,
    @Body('resourceTitle') resourceTitle?: string,
    @Body('metadata') metadata?: Record<string, any>,
  ) {
    return this.activityService.log(req.user.id, action, resourceTitle, metadata);
  }

  @Get('activity/me')
  async getMyActivity(@Req() req) {
    return this.activityService.getMyActivity(req.user.id);
  }

  @Get('activity/me/stats')
  async getMyStats(@Req() req) {
    return this.activityService.getMyStats(req.user.id);
  }

  // ── Support ───────────────────────────────────────────────────────────────

  @Post('support/message')
  async sendMessage(
    @Req() req,
    @Body('subject') subject: string,
    @Body('message') message: string,
  ) {
    return this.activityService.sendSupportMessage(req.user.id, subject, message);
  }

  @Post('support/report')
  async reportProblem(
    @Req() req,
    @Body('description') description: string,
    @Body('category') category: string,
  ) {
    return this.activityService.submitProblemReport(req.user.id, description, category);
  }

  // Admin-only: view all support messages and reports
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('support/messages')
  async getAllMessages() {
    return this.activityService.getAllSupportMessages();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('support/reports')
  async getAllReports() {
    return this.activityService.getAllProblemReports();
  }
}