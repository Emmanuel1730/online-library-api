import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('book_purchases')
@Unique(['userId', 'resourceId']) // A user can only purchase a resource once
export class BookPurchase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  resourceId: string; // UUID from your resources table

  @Column({ nullable: true })
  transactionReference: string; // Links back to the payments table

  @Column('decimal', { precision: 10, scale: 2 })
  amountPaid: number;

  @Column({ default: 'MWK' })
  currency: string;

  @CreateDateColumn()
  purchasedAt: Date;
}