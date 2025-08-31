import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({ description: 'Total number of epics' })
  epics: number;

  @ApiProperty({ description: 'Total number of features' })
  features: number;

  @ApiProperty({ description: 'Total number of tasks' })
  tasks: number;

  @ApiProperty({ description: 'Total number of completed items' })
  completed: number;

  @ApiProperty({ description: 'Total number of in-progress items' })
  inProgress: number;

  @ApiProperty({ description: 'Total number of blocked items' })
  blocked: number;
}

export class EpicProgressDto {
  @ApiProperty({ description: 'Total number of items in epic' })
  total: number;

  @ApiProperty({ description: 'Number of completed items' })
  completed: number;

  @ApiProperty({ description: 'Completion percentage' })
  percentage: number;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Dashboard summary statistics', type: DashboardSummaryDto })
  summary: DashboardSummaryDto;

  @ApiProperty({ 
    description: 'Progress by epic code', 
    additionalProperties: { type: 'object', $ref: '#/components/schemas/EpicProgressDto' },
    example: {
      'EP001': { total: 10, completed: 5, percentage: 50 },
      'EP002': { total: 8, completed: 8, percentage: 100 }
    }
  })
  progressByEpic: Record<string, EpicProgressDto>;
}

export class SpecTreeNodeDto {
  @ApiProperty({ description: 'Unique identifier for the spec item' })
  id: string;

  @ApiProperty({ description: 'Title of the spec item' })
  title: string;

  @ApiProperty({ description: 'Type of spec item', enum: ['epic', 'feature', 'task'] })
  type: 'epic' | 'feature' | 'task';

  @ApiProperty({ description: 'Current status of the item' })
  status: string;

  @ApiProperty({ description: 'Progress percentage (optional)', required: false })
  progress?: number;

  @ApiProperty({ 
    description: 'Child nodes (optional)', 
    type: [SpecTreeNodeDto],
    required: false 
  })
  children?: SpecTreeNodeDto[];
}

export class TaskSummaryDto {
  @ApiProperty({ description: 'Number of completed tasks' })
  completed: number;

  @ApiProperty({ description: 'Total number of tasks' })
  total: number;
}

export class EpicProgressItemDto {
  @ApiProperty({ description: 'Epic identifier' })
  epicId: string;

  @ApiProperty({ description: 'Epic title' })
  title: string;

  @ApiProperty({ description: 'Epic status' })
  status: string;

  @ApiProperty({ description: 'Progress percentage' })
  progress: number;

  @ApiProperty({ description: 'Task summary', type: TaskSummaryDto })
  tasks: TaskSummaryDto;
}

export class EpicProgressResponseDto {
  @ApiProperty({ description: 'Array of epic progress data', type: [EpicProgressItemDto] })
  data: EpicProgressItemDto[];
}

export class RecentActivityItemDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'Action type', enum: ['completed', 'updated', 'created', 'blocked'] })
  action: 'completed' | 'updated' | 'created' | 'blocked';

  @ApiProperty({ description: 'Specification ID' })
  specId: string;

  @ApiProperty({ description: 'Specification title' })
  specTitle: string;

  @ApiProperty({ description: 'Timestamp in ISO format' })
  timestamp: string;

  // Extended fields for rich activities
  @ApiProperty({ description: 'Detailed activity type', required: false })
  activityType?: string;

  @ApiProperty({ description: 'Activity title', required: false })
  title?: string;

  @ApiProperty({ description: 'Detailed activity description', required: false })
  description?: string;

  @ApiProperty({ description: 'Preview of spec/context content', required: false })
  contentPreview?: string;

  @ApiProperty({ description: 'Path to spec.md file', required: false })
  specPath?: string;

  @ApiProperty({ description: 'Path to context.md file', required: false })
  contextPath?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  metadata?: any;
}

export class RecentActivityResponseDto {
  @ApiProperty({ description: 'Array of recent activity data', type: [RecentActivityItemDto] })
  data: RecentActivityItemDto[];
}