import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';
import { RolesGuard } from '../Auth/roles.guard';
import { Roles } from '../Auth/roles.decorator';
import { Role } from '../Auth/role.enum';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  /** GET /notifications — fetch all for logged-in admin */
  @Get()
  getAll(@Req() req) {
    return this.service.findForAdmin(req.user.id);
  }

  /** GET /notifications/unread-count */
  @Get('unread-count')
  async getUnreadCount(@Req() req) {
    const count = await this.service.countUnread(req.user.id);
    return { count };
  }

  /** PATCH /notifications/:id/read — mark single as read */
  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req) {
    return this.service.markRead(id, req.user.id);
  }

  /** PATCH /notifications/read-all */
  @Patch('read-all')
  markAllRead(@Req() req) {
    return this.service.markAllRead(req.user.id);
  }

  /** DELETE /notifications/:id */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}