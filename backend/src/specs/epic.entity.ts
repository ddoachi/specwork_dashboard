import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Feature } from './feature.entity';

export type SpecStatus = 'draft' | 'in_progress' | 'done' | 'blocked';
export type SpecPriority = 'low' | 'medium' | 'high' | 'critical';
export type SpecEffort = 'tiny' | 'small' | 'medium' | 'large' | 'xl';
export type SpecRisk = 'low' | 'medium' | 'high';

@Entity({ name: 'epics' })
export class Epic {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string; // Original spec ID from YAML frontmatter

  @Column({ type: 'varchar', length: 255, unique: true })
  epic_code!: string; // E01, E02, etc.

  @Column({ type: 'text' })
  title!: string;

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

  // Relationships will be handled through code queries for simplicity
  // @OneToMany(() => Feature, feature => feature.epic)  
  // features!: Feature[];
}