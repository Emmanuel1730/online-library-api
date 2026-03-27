import { Category } from 'src/categories/categories.entity';
import { Profile } from 'src/Profile/profile.entity';
import { Resource } from 'src/resources/resources.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  // ✅ UPLOAD CONTROL
  @Column({ default: false })
  teachersCanUpload: boolean;

  @OneToMany(() => Profile, (profile) => profile.school)
  profiles: Profile[];

  @OneToMany(() => Resource, (resource) => resource.school)
  resources: Resource[];

  @OneToMany(() => Category, (category) => category.school)
  categories: Category[];
}