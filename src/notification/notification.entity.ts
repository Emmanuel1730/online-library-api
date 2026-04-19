import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from 'src/Profile/profile.entity';

export enum NotificationType {
  REQUEST_CREATED    = 'REQUEST_CREATED',
  REQUEST_APPROVED   = 'REQUEST_APPROVED',
  REQUEST_REJECTED   = 'REQUEST_REJECTED',
  QUIZ_CREATED       = 'QUIZ_CREATED',
  USER_REGISTERED    = 'USER_REGISTERED',
  RESOURCE_UPLOADED  = 'RESOURCE_UPLOADED',
  SYSTEM             = 'SYSTEM',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => Profile, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: Profile | null; // ✅ allow null

  @Column({ nullable: true })
  recipientId: number | null; // ✅ FIX

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, any> | null; // ✅ FIX

  @CreateDateColumn()
  createdAt: Date;
}