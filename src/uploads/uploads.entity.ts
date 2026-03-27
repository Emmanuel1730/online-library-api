// src/uploads/uploads.entity.ts

import { Resource } from 'src/resources/resources.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileUrl: string;

  @Column()
  fileType: string;

  @ManyToOne(() => Resource, (resource) => resource.uploads, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resourceId' })
  resource?: Resource;
}