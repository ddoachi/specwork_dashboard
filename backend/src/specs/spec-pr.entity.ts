import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'spec_prs' })
export class SpecPR {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'varchar', length: 64 }) spec_id!: string;
  @Column({ type: 'text' }) url!: string;
}
