import { Column, Entity, PrimaryColumn } from 'typeorm';

export type RelType = 'dependency'|'blocks'|'related';

@Entity({ name: 'spec_relations' })
export class SpecRelation {
  @PrimaryColumn({ type: 'varchar', length: 64 }) from_id!: string;
  @PrimaryColumn({ type: 'varchar', length: 64 }) to_id!: string;
  @PrimaryColumn({ type: 'varchar', length: 20 })
  rel_type!: RelType;
}
