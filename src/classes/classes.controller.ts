import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';

@Controller('classes')
export class ClassesController {
  constructor(private service: ClassesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: { name: string }) {
    return this.service.create(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req) {
    return this.service.findAll(req.user);
  }
}
