import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Resource } from 'src/resources/resources.entity';
import { Profile } from 'src/Profile/profile.entity';
import { School } from 'src/school/school.entity';

export enum QuizVisibility {
  PUBLIC  = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  form: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'online' })
  mode: string; // 'online' | 'offline'

  @Column({
    type: 'enum',
    enum: QuizVisibility,
    default: QuizVisibility.PUBLIC,
  })
  visibility: QuizVisibility;

  @Column({ type: 'jsonb', nullable: true })
  questions: {
    id: string;
    text: string;
    options: string[];
    answer: number;
  }[];

  @Column({ default: 'draft' })
  status: string; // 'draft' | 'published'

  @ManyToOne(() => Resource, (resource) => resource.quizzes, { nullable: true })
  resource: Resource;

  @ManyToOne(() => Profile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: Profile;

  @Column({ nullable: true })
  createdById: number;

  // For private quizzes — restrict to a school
  @ManyToOne(() => School, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ nullable: true })
  schoolId: string;

  @CreateDateColumn()
  createdAt: Date;
}