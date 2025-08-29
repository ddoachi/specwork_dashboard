import { Column, Entity, PrimaryColumn } from 'typeorm';

export type RelType = 'dependency'|'blocks'|'related';

@Entity({ name: 'spec_relations' })
export class SpecRelation {
  @PrimaryColumn({ type: 'varchar', length: 32 }) from_id!: string;
  @PrimaryColumn({ type: 'varchar', length: 32 }) to_id!: string;
  @PrimaryColumn({ type: 'enum', enum: ['dependency','blocks','related'] })
  rel_type!: RelType;
}
