import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'spec_tag_map' })
export class SpecTagMap {
  @PrimaryColumn({ type: 'varchar', length: 32 }) spec_id!: string;
  @PrimaryColumn({ type: 'int' }) tag_id!: number;
}
