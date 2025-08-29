import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Feature } from './feature.entity';

export type SpecStatus = 'draft' | 'in_progress' | 'done' | 'blocked';
export type SpecPriority = 'low' | 'medium' | 'high' | 'critical';
export type SpecEffort = 'tiny' | 'small' | 'medium' | 'large' | 'xl';
export type SpecRisk = 'low' | 'medium' | 'high';

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string; // Original spec ID from YAML frontmatter

  @Column({ type: 'varchar', length: 255 })
  task_code!: string; // T01, T02, etc.

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  feature_code!: string;

  @Column({ type: 'varchar', length: 255 })
  epic_code!: string;

  @Column({ type: 'text', nullable: true })
  domain?: string | null;

  @Column({ 
    type: 'varchar', 
    length: 20,
    default: 'draft' 
  })
  status!: SpecStatus;

  @Column({ 
    type: 'varchar', 
    length: 20,
    default: 'medium' 
  })
  priority!: SpecPriority;

  @Column({ type: 'date' })
  created!: string;

  @Column({ type: 'date' })
  updated!: string;

  @Column({ type: 'date', nullable: true })
  due_date?: string | null;

  @Column({ type: 'integer', default: 0 })
  estimated_hours!: number;

  @Column({ type: 'integer', default: 0 })
  actual_hours!: number;

  @Column({ 
    type: 'varchar', 
    length: 20,
    nullable: true 
  })
  effort?: SpecEffort | null;

  @Column({ 
    type: 'varchar', 
    length: 20,
    nullable: true 
  })
  risk?: SpecRisk | null;

  @Column({ type: 'text', nullable: true })
  context_file?: string | null;

  @Column({ type: 'text', nullable: true })
  file_path?: string | null;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column('simple-array', { nullable: true })
  files?: string[];

  @Column('simple-array', { nullable: true })
  pull_requests?: string[];

  @Column('simple-array', { nullable: true })
  commits?: string[];

  @Column('simple-array', { nullable: true })
  dependencies?: string[];

  @Column('simple-array', { nullable: true })
  blocks?: string[];

  @Column('simple-array', { nullable: true })
  related?: string[];

  @Column('simple-array', { nullable: true })
  deliverables?: string[];

  @Column({ type: 'integer', nullable: true })
  acceptance_criteria?: number;

  @Column({ type: 'integer', nullable: true })
  acceptance_met?: number;

  @Column({ type: 'integer', nullable: true })
  test_coverage?: number;

  // Relationships will be handled through code queries for simplicity
  // @ManyToOne(() => Feature, feature => feature.tasks)
  // @JoinColumn({ name: 'feature_code', referencedColumnName: 'feature_code' })
  // feature!: Feature;
}