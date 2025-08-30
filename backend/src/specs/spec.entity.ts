import { Column, Entity, PrimaryColumn } from 'typeorm';

export type SpecType = 'epic'|'feature'|'task'|'subtask';
export type SpecStatus = 'draft'|'in_progress'|'done'|'completed'|'blocked';
export type SpecPriority = 'low'|'medium'|'high'|'critical';
export type SpecEffort = 'tiny'|'small'|'medium'|'large'|'xl';
export type SpecRisk = 'low'|'medium'|'high';

@Entity({ name: 'specs' })
export class Spec {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  hierarchical_id?: string; // E01, E01-F01, E01-F01-T01, etc.

  @Column({ type: 'text' }) 
  title!: string;
  
  @Column({ type: 'varchar', length: 20 }) 
  type!: SpecType;

  @Column({ type: 'varchar', length: 64, nullable: true }) 
  parent?: string | null; // Parent hierarchical_id

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: SpecStatus;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority!: SpecPriority;

  @Column({ type: 'date' }) 
  created!: string;
  
  @Column({ type: 'date' }) 
  updated!: string;

  @Column({ type: 'int', default: 0 }) 
  estimated_hours!: number;
  
  @Column({ type: 'int', default: 0 }) 
  actual_hours!: number;

  @Column('simple-array', { nullable: true })
  children?: string[];

  @Column('simple-array', { nullable: true })
  pull_requests?: string[];

  @Column('simple-array', { nullable: true })
  commits?: string[];

  @Column({ type: 'text', nullable: true }) 
  context_file?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  effort?: SpecEffort | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  risk?: SpecRisk | null;
}
