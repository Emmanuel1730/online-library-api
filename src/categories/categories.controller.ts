import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';
import { CreateCategoryDto } from './create-categories.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  // 🔒 PROTECTED CREATE
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateCategoryDto) {
    return this.service.create(dto, req.user);
  }

  // 🔒 OPTIONAL: also protect (recommended for isolation)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req) {
    return this.service.findAll(req.user);
  }
}