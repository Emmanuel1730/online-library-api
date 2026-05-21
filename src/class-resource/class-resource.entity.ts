import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Column,
} from 'typeorm';
import { SchoolClass } from '../classes/classes.entity';
import { Resource } from '../resources/resources.entity';

@Entity()
@Unique(['classId', 'resourceId'])
export class ClassResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SchoolClass, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class: SchoolClass;

  @Column()
  classId: string;

  @ManyToOne(() => Resource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resourceId' })
  resource: Resource;

  @Column()
  resourceId: string;

  @CreateDateColumn()
  assignedAt: Date;
}