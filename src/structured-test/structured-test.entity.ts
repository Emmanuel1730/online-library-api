import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn, JoinColumn,
} from 'typeorm';
import { Profile } from '../Profile/profile.entity';

export enum TestStatus {
  DRAFT     = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED    = 'CLOSED',
}

export enum SubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  MARKED    = 'MARKED',
}

@Entity()
export class StructuredTest {
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
  instructions: string;

  @Column({ type: 'jsonb', default: [] })
  questions: {
    id: string;
    text: string;
    marks: number;
    type: 'short' | 'long' | 'structured';
    markingGuidance?: string;
  }[];

  @Column({ type: 'enum', enum: TestStatus, default: TestStatus.DRAFT })
  status: TestStatus;

  @Column({ nullable: true })
  totalMarks: number;

  @ManyToOne(() => Profile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: Profile;

  @Column({ nullable: true })
  createdById: number;

  @Column({ nullable: true })
  schoolId: string;

  @OneToMany(() => TestSubmission, (s) => s.test)
  submissions: TestSubmission[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity()
export class TestSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StructuredTest, (t) => t.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testId' })
  test: StructuredTest;

  @Column()
  testId: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Profile;

  @Column()
  studentId: number;

  @Column({ type: 'jsonb', default: [] })
  answers: {
    questionId: string;
    answer: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  aiMarking: {
    questionId: string;
    suggestedMark: number;
    maxMark: number;
    feedback: string;
    confidence: 'high' | 'medium' | 'low';
  }[];

  @Column({ type: 'jsonb', nullable: true })
  finalMarks: {
    questionId: string;
    mark: number;
    feedback: string;
  }[];

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.SUBMITTED })
  status: SubmissionStatus;

  @Column({ nullable: true })
  totalScore: number;

  @Column({ nullable: true })
  percentage: number;

  @Column({ type: 'text', nullable: true })
  teacherComment: string;

  @CreateDateColumn()
  submittedAt: Date;
}