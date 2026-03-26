import { Body, Controller, Get, Post } from '@nestjs/common';
import { SchoolService } from './school.service';

@Controller('school')
export class SchoolController {
    constructor(private service: SchoolService) {}

    @Post()
    create(@Body() data: any) {
        return this.service.create(data);
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }
}
