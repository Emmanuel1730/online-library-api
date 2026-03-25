import { Profile } from 'src/Profile/profile.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Request {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requestName: string; // e.g., "Upload: Form 2 History"

  @Column()
  fromUser: string; // e.g., "T. Banda, Blantyre..."

  @Column()
  type: string; // e.g., "Upload" or "Registration"

  @Column({ type: 'text', nullable: true })
  description: string; // User's explanation or details

  @Column({ default: 'pending' })
  status: string; // e.g., "pending", "approved", "rejected"

  @Column({ type: 'text', nullable: true })
  adminNotes: string; // Admin's reason for approval/rejection

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date; // Automatically updates whenever the row changes!

  @ManyToOne(() => Profile, (profile) => profile.requests)
  user: Profile;
}
