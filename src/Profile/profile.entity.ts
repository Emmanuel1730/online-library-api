import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Request } from '../Requests/request.entity';

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  age: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT, // Most users will be students
  })
  role: UserRole;

  @Column({ unique: true })
  libraryCardNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  joinDate: Date;

  @OneToMany(() => Request, (request) => request.user)
  requests: Request[];

  @Column({ nullable: true })
  refreshToken: string;
}
