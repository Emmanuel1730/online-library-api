import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Profile } from 'src/Profile/profile.entity';
import { Quiz } from './quizzes.entity';

export enum QuizSource {
  AI      = 'AI',
  TEACHER = 'TEACHER',
}

@Entity()
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Profile;

  @Column()
  studentId: number;

  // Null for AI quizzes — they are not stored as Quiz entities
  @ManyToOne(() => Quiz, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({ nullable: true })
  quizId: string;

  @Column({ type: 'enum', enum: QuizSource, default: QuizSource.AI })
  source: QuizSource;

  // Metadata snapshot (used for AI quizzes and display)
  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  topic: string;

  @Column({ nullable: true })
  level: string;

  @Column()
  score: number;

  @Column()
  total: number;

  @Column()
  percentage: number;

  @Column({ type: 'jsonb', nullable: true })
  answers: number[];

  @Column({ type: 'jsonb', nullable: true })
  questions: any[];

  @CreateDateColumn()
  completedAt: Date;
}