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

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

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

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  joinDate: Date;

  @OneToMany(() => Request, (request) => request.user)
  requests: Request[];

  @ManyToOne(() => School, (school) => school.profiles)
  school: School;

  @OneToMany(() => Resource, (resource) => resource.uploader)
  resources: Resource[];

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires: Date | null;
}