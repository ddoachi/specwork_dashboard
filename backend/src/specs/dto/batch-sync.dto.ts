export interface SpecMetadata {
  id: string;
  hierarchical_id: string;
  title: string;
  type: 'epic' | 'feature' | 'task' | 'subtask';
  parent?: string;
  status: string;
  priority: string;
  created: string;
  updated: string;
  children?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  pull_requests?: string[];
  commits?: string[];
}

export class BatchSyncDto {
  specs!: Record<string, SpecMetadata>;
  stats!: {
    total_epics: number;
    total_features: number;
    total_tasks: number;
    total_subtasks: number;
    completed: string[];
    in_progress: string[];
    draft: string[];
    blocked: string[];
  };
  hierarchy!: Record<string, any>;
}