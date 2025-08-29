import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn, JoinColumn } from 'typeorm';

export type SpecType = 'epic'|'feature'|'task';
export type SpecStatus = 'draft'|'in_progress'|'done'|'blocked';
export type SpecPriority = 'low'|'medium'|'high'|'critical';
export type SpecEffort = 'tiny'|'small'|'medium'|'large'|'xl';
export type SpecRisk = 'low'|'medium'|'high';

@Entity({ name: 'specs' })
export class Spec {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'text' }) title!: string;
  @Column({ type: 'varchar', length: 20 }) type!: SpecType;

  @Column({ type: 'varchar', length: 32, nullable: true }) parent_id?: string | null;
  @Column({ type: 'varchar', length: 32, nullable: true }) epic_id?: string | null;

  @Column({ type: 'text', nullable: true }) domain?: string | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: SpecStatus;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority!: SpecPriority;

  @Column({ type: 'date' }) created!: string;
  @Column({ type: 'date' }) updated!: string;
  @Column({ type: 'date', nullable: true }) due_date?: string | null;

  @Column({ type: 'int', default: 0 }) estimated_hours!: number;
  @Column({ type: 'int', default: 0 }) actual_hours!: number;

  @Column({ type: 'text', nullable: true }) context_file?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  effort?: SpecEffort | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  risk?: SpecRisk | null;
}
