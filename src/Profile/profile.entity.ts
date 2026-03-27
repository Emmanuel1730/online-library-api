import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Request } from '../Requests/request.entity';
import { Resource } from '../resources/resources.entity';
import { School } from '../school/school.entity';
import { Exclude } from 'class-transformer';

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

  @Exclude()
  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
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

  // Each user belongs to a school
  @ManyToOne(() => School, (school) => school.profiles)
  school: School;

  // A user can upload many resources
  @OneToMany(() => Resource, (resource) => resource.uploader)
  resources: Resource[];

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires: Date | null;
}