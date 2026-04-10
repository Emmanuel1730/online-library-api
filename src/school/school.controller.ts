import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SchoolService } from './school.service';
import { JwtAuthGuard } from 'src/Auth/jwt-auth-guard';
import { Roles } from 'src/Auth/roles.decorator';
import { RolesGuard } from 'src/Auth/roles.guard';
import { Role } from 'src/Auth/role.enum';

@Controller('school')
export class SchoolController {
  constructor(private service: SchoolService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}