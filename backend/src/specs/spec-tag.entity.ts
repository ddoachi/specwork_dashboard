import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'spec_tags' })
@Unique(['name'])
export class SpecTag {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'text' }) name!: string;
}
