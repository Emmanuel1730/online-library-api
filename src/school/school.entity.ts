// schools/school.entity.ts
import { Category } from 'src/categories/categories.entity';
import { Resource } from 'src/resources/resources.entity';
import { User } from 'src/users/users.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';


@Entity()
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @OneToMany(() => User, (user) => user.school)
  users: User[];

  @OneToMany(() => Resource, (resource) => resource.school)
  resources: Resource[];

  @OneToMany(() => Category, (category) => category.school)
  categories: Category[];
}