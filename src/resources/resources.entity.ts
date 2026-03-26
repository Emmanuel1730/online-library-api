// resources/resource.entity.ts
import { Category } from 'src/categories/categories.entity';
import { Quiz } from 'src/quizzes/quizzes.entity';
import { School } from 'src/school/school.entity';
import { User } from 'src/users/users.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';


@Entity()
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  fileUrl: string;

  @ManyToOne(() => Category, (category) => category.resources)
  category: Category;

  @ManyToOne(() => School, (school) => school.resources)
  school: School;

  @ManyToOne(() => User, (user) => user.resources)
  uploader: User;

  @OneToMany(() => Quiz, (quiz) => quiz.resource)
  quizzes: Quiz[];
}