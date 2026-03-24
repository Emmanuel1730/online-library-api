import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Request {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requestName: string; // e.g., "Upload: Form 2 History Notes"

  @Column()
  fromUser: string; // e.g., "T. Banda, Blantyre Secondary"

  @Column()
  type: string; // e.g., "Upload" or "Registration"

  @Column({ default: 'pending' })
  status: string; // e.g., "pending", "approved", "rejected"

  @CreateDateColumn()
  createdAt: Date; // This automatically simulates the "Date" column in your UI
}
