import { Category } from 'src/categories/categories.entity';
import { Profile } from 'src/Profile/profile.entity';
import { Quiz } from 'src/quizzes/quizzes.entity';
import { School } from 'src/school/school.entity';
import { Upload } from 'src/uploads/uploads.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity()
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(() => Category, (category) => category.resources)
  category: Category;

  @ManyToOne(() => School, (school) => school.resources)
  school: School;

  @ManyToOne(() => Profile, (profile) => profile.resources)
  uploader: Profile;

  // ✅ VISIBILITY CONTROL
  @Column({ default: 'school' })
  visibility: 'public' | 'school' | 'restricted';

  // Optional fine-grained control
  @Column({ nullable: true })
  allowedRoles: string;

  @Column({ nullable: true })
  allowedUserIds: string;

  // ✅ SYSTEM FIELDS
  @Column({ default: 0 })
  downloadCount: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Quiz, (quiz) => quiz.resource)
  quizzes: Quiz[];

  @OneToMany(() => Upload, (upload) => upload.resource, {
    cascade: true,
  })
  uploads: Upload[];
}