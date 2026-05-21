import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request as Req,
} from '@nestjs/common';
import { RequestService } from './request.service';
import { CreateRequestDto } from './create-request.dto';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';
import { RolesGuard } from '../Auth/roles.guard';
import { Roles } from '../Auth/roles.decorator';
import { Role } from '../Auth/role.enum';

@Controller('request')
@UseGuards(JwtAuthGuard, RolesGuard) // JWT must run first to populate req.user
export class RequestsController {
  constructor(private readonly requestsService: RequestService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  getAllRequests() {
    return this.requestsService.findAll();
  }

  @Post()
  @Roles(Role.STUDENT, Role.TEACHER)
  async createRequest(@Body() createRequestDto: CreateRequestDto, @Req() req) {
    const userId = req.user.id;
    return this.requestsService.create(createRequestDto, userId);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  async updateStatus(@Param('id') id: number, @Body('status') status: string) {
    return this.requestsService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: number) {
    return this.requestsService.remove(id);
  }
}