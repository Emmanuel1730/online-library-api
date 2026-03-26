// categories/category.entity.ts
import { Resource } from 'src/resources/resources.entity';
import { School } from 'src/school/school.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';


@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => School, (school) => school.categories)
  school: School;

  @OneToMany(() => Resource, (resource) => resource.category)
  resources: Resource[];
}