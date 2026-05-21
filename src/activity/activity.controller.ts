import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityAction } from './user-activity.entity';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  async log(
    @Req() req,
    @Body('action') action: ActivityAction,
    @Body('resourceTitle') resourceTitle?: string,
    @Body('metadata') metadata?: Record<string, any>,
  ) {
    return this.activityService.log(req.user.id, action, resourceTitle, metadata);
  }

  @Get('me')
  async getMyActivity(@Req() req) {
    return this.activityService.getMyActivity(req.user.id);
  }

  @Get('me/stats')
  async getMyStats(@Req() req) {
    return this.activityService.getMyStats(req.user.id);
  }
}