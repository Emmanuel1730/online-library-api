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
import { RolesGuard } from '../Auth/roles.guard';
import { Roles } from '../Auth/roles.decorator'; // You'll need this simple decorator
import { Role } from '../Auth/role.enum';

@Controller('api/request')
@UseGuards(RolesGuard) // Apply the bouncer to the whole controller
export class RequestsController {
  constructor(private readonly requestsService: RequestService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER) // Only Admin and Teachers see all requests
  getAllRequests() {
    return this.requestsService.findAll();
  }

  @Post()
  @Roles(Role.STUDENT, Role.TEACHER) // Students and Teachers can request books
  async createRequest(@Body() createRequestDto: CreateRequestDto, @Req() req) {
    const userId = req.user.sub;
    return this.requestsService.create(createRequestDto, userId);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN) // ONLY the Librarian (Admin) can approve/reject
  async updateStatus(@Param('id') id: number, @Body('status') status: string) {
    return this.requestsService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Only Admin can delete records
  async remove(@Param('id') id: number) {
    return this.requestsService.remove(id);
  }
}
