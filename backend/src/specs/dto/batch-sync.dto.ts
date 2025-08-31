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
  children?: string[] | any[];  // Allow array of strings or markdown links
  estimated_hours?: number | string;  // Allow both number and string
  actual_hours?: number | string;  // Allow both number and string
  pull_requests?: string[];
  commits?: string[] | any[];  // Allow string array or object array
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