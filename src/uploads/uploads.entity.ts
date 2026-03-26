// uploads/upload.entity.ts
import { Resource } from 'src/resources/resources.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileUrl: string;

  @Column()
  fileType: string;

  @ManyToOne(() => Resource, { nullable: true })
  resource: Resource;
}