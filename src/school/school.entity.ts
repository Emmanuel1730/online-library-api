import { Category } from '../categories/categories.entity';
import { Profile } from '../Profile/profile.entity';
import { Resource } from '../resources/resources.entity';
import { SchoolClass } from '../classes/classes.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

export enum SchoolRegistrationStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT', // signed up but hasn't paid yet
  ACTIVE          = 'ACTIVE',          // paid and approved
  SUSPENDED       = 'SUSPENDED',
}

@Entity()
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  teachersCanUpload: boolean;

  // ── Registration payment tracking ──────────────────────────────
  @Column({
    type: 'enum',
    enum: SchoolRegistrationStatus,
    default: SchoolRegistrationStatus.PENDING_PAYMENT,
  })
  registrationStatus: SchoolRegistrationStatus;

  @Column({ nullable: true })
  registrationTxRef: string; // the PayChangu tx_ref for the registration fee

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  registrationFeePaid: number;
  // ──────────────────────────────────────────────────────────────

  @OneToMany(() => Profile, (profile) => profile.school)
  profiles: Profile[];

  @OneToMany(() => Resource, (resource) => resource.school)
  resources: Resource[];

  @OneToMany(() => Category, (category) => category.school)
  categories: Category[];

  @OneToMany(() => SchoolClass, (schoolClass) => schoolClass.school)
  classes: SchoolClass[];

  @CreateDateColumn()
  createdAt: Date;
}