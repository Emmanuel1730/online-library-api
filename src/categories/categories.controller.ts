import { Body, Controller, Get, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
    constructor(private service: CategoriesService) {}

    @Post()
    create(@Body() data: any) {
        return this.service.create(data);
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }

}
