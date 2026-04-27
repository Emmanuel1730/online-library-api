import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { School } from '../school/school.entity';
import { Category } from 'src/categories/categories.entity';
import { SchoolClass } from 'src/classes/classes.entity';
import { Profile } from 'src/Profile/profile.entity';
import { Upload } from 'src/uploads/uploads.entity';
import { Quiz } from 'src/quizzes/quizzes.entity';

export enum ResourceType {
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  LINK = 'LINK',
}

export enum ResourceStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum ResourceForm {
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}

export enum ResourceVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

@Entity()
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: ResourceType })
  type: ResourceType;

  @Column({ type: 'enum', enum: ResourceForm, nullable: true })
  form: ResourceForm;

  @Column({ type: 'enum', enum: ResourceStatus, default: ResourceStatus.DRAFT })
  status: ResourceStatus;

  @Column({ nullable: true })
  targetAudience: string;

  @Column({
    type: 'enum',
    enum: ResourceVisibility,
    default: ResourceVisibility.PUBLIC,
  })
  visibility: ResourceVisibility;

  @Column()
  fileUrl: string;

  @Column({ default: 0 })
  downloadCount: number;

  @Column({ default: true })
  isActive: boolean;

  // ── Premium fields ───────────────────────────────────────────────
  /** true = paid resource, false = free */
  @Column({ default: false })
  isPremium: boolean;

  /** Price in MWK. 0 for free resources. */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price: number;
  // ────────────────────────────────────────────────────────────────

  // --- Relations ---
  @ManyToOne(() => Category, { nullable: true })
  category: Category;

  @ManyToOne(() => SchoolClass, { nullable: true })
  targetClass: SchoolClass;

  @ManyToOne(() => School, (school) => school.resources, { nullable: true })
  school: School;

  @Column({ nullable: true })
  uploaderId: string;

  @ManyToOne(() => Profile, (profile) => profile.resources, { nullable: true })
  @JoinColumn({ name: 'uploaderId', referencedColumnName: 'id' })
  uploader: Profile;

  @OneToMany(() => Upload, (upload) => upload.resource)
  uploads: Upload[];

  @OneToMany(() => Quiz, (quiz) => quiz.resource)
  quizzes: Quiz[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}