import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'MEMBER' })
  role: string;

  @Column({ unique: true })
  libraryCardNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  joinDate: Date;
}
