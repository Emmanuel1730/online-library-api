import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from 'src/Profile/profile.entity';

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
  metadata: Record<string, any>; // e.g. { score: 8, total: 10, subject: 'Biology', topic: '...' }

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Profile;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}