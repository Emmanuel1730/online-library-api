import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './categories.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private repo: Repository<Category>,
    ) {}

    async create(data: any) {
        const category = this.repo.create(data);
        return this.repo.save(category);
    }

    findAll(){
        return this.repo.find({
            relations: ['school', 'resources'],
        })
    }
}
