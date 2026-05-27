import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from '../Profile/profile.entity';

export enum ActivityAction {
  DOWNLOAD        = 'DOWNLOAD',
  RESOURCE_VIEWED = 'RESOURCE_VIEWED',
  QUIZ_COMPLETED  = 'QUIZ_COMPLETED',
}

@Entity()
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ActivityAction })
  action: ActivityAction;

  @Column({ nullable: true })
  resourceTitle: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Profile;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity()
export class SupportMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subject: string;

  @Column('text')
  message: string;

  @Column({ default: 'OPEN' })
  status: string; // OPEN | RESOLVED

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: Profile;

  @Column()
  senderId: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity()
export class ProblemReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  description: string;

  @Column({ default: 'General' })
  category: string;

  @Column({ default: 'OPEN' })
  status: string; // OPEN | RESOLVED

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporterId' })
  reporter: Profile;

  @Column()
  reporterId: number;

  @CreateDateColumn()
  createdAt: Date;
}