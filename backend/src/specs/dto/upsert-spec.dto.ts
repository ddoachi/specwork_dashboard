import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertSpecDto {
  @IsString() id!: string;
  @IsOptional() @IsString() hierarchical_id?: string;
  @IsString() title!: string;
  @IsIn(['epic','feature','task','subtask']) type!: 'epic'|'feature'|'task'|'subtask';

  @IsOptional() @IsString() parent?: string;

  @IsIn(['draft','in_progress','done','completed','blocked']) status!: 'draft'|'in_progress'|'done'|'completed'|'blocked';
  @IsIn(['low','medium','high','critical']) priority!: 'low'|'medium'|'high'|'critical';

  @IsDateString() created!: string;
  @IsDateString() updated!: string;

  @IsInt() @Min(0) estimated_hours!: number;
  @IsInt() @Min(0) actual_hours!: number;

  @IsOptional() @IsString() context_file?: string;

  @IsOptional() @IsIn(['tiny','small','medium','large','xl']) effort?: 'tiny'|'small'|'medium'|'large'|'xl';
  @IsOptional() @IsIn(['low','medium','high']) risk?: 'low'|'medium'|'high';

  @IsOptional() @IsArray() children?: string[] | any[];
  @IsOptional() @IsArray() commits?: string[] | any[];
  @IsOptional() @IsArray() pull_requests?: string[];
}
