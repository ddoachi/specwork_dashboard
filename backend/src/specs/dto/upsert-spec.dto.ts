import { IsArray, IsDateString, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpsertSpecDto {
  @IsString() id!: string;
  @IsString() title!: string;
  @IsIn(['epic','feature','task']) type!: 'epic'|'feature'|'task';

  @IsOptional() @IsString() parent?: string;
  @IsOptional() @IsString() epic?: string;
  @IsOptional() @IsString() domain?: string;

  @IsIn(['draft','in_progress','done','blocked']) status!: 'draft'|'in_progress'|'done'|'blocked';
  @IsIn(['low','medium','high','critical']) priority!: 'low'|'medium'|'high'|'critical';

  @IsDateString() created!: string;
  @IsDateString() updated!: string;
  @IsOptional() @IsDateString() due_date?: string;

  @IsInt() @Min(0) estimated_hours!: number;
  @IsInt() @Min(0) actual_hours!: number;

  @IsOptional() @IsString() context_file?: string;

  @IsOptional() @IsIn(['tiny','small','medium','large','xl']) effort?: 'tiny'|'small'|'medium'|'large'|'xl';
  @IsOptional() @IsIn(['low','medium','high']) risk?: 'low'|'medium'|'high';

  @IsArray() files!: string[];
  @IsArray() commits!: string[];
  @IsArray() pull_requests!: string[];
  @IsArray() tags!: string[];

  @IsArray() dependencies!: string[];
  @IsArray() blocks!: string[];
  @IsArray() related!: string[];
}
