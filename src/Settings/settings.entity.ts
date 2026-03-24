import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'Edu Library' })
  libraryName: string;

  @Column({ default: true })
  allowPublicUploads: boolean;

  @Column({ default: 'Light' }) // or 'Dark'
  theme: string;

  @Column({ nullable: true })
  contactEmail: string;
}
