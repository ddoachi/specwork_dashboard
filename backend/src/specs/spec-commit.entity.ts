import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'spec_commits' })
export class SpecCommit {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'varchar', length: 64 }) spec_id!: string;
  @Column({ type: 'varchar', length: 64 }) sha!: string;
}
