import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// These are the 3 states a payment can be in
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number; // Who is paying?

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number; // How much?

  @Column({ default: 'MWK' })
  currency: string;

  @Column({ unique: true })
  transactionReference: string; // The unique Pay Changu ID (e.g., LIB-12345-1)

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING, // Always starts as pending
  })
  status: PaymentStatus;

  @CreateDateColumn()
  createdAt: Date;
}
