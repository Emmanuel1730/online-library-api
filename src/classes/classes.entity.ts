import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { School } from '../school/school.entity';

@Entity()
export class SchoolClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Form 1, Form 2, Grade 10

  @ManyToOne(() => School, (school) => school.classes, {
    onDelete: 'CASCADE',
  })
  school: School;
}