// quizzes/quiz.entity.ts
import { Resource } from 'src/resources/resources.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToOne(() => Resource, (resource) => resource.quizzes, {
    nullable: true,
  })
  resource: Resource;
}