import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Spec } from './spec.entity';

@Entity({ name: 'spec_files' })
export class SpecFile {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'varchar', length: 32 }) spec_id!: string;
  @Column({ type: 'text' }) path!: string;
}
