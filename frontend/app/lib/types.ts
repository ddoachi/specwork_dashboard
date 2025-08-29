// Type definitions for the specwork dashboard

export type SpecType = 'epic' | 'feature' | 'task';

export type SpecStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'on_hold';

export interface BaseSpec {
  id: string;
  title: string;
  type: SpecType;
  status: SpecStatus;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  progress?: number;
}

export interface Epic extends BaseSpec {
  type: 'epic';
  features: Feature[];
}

export interface Feature extends BaseSpec {
  type: 'feature';
  epicId: string;
  tasks: Task[];
}

export interface Task extends BaseSpec {
  type: 'task';
  featureId: string;
  epicId: string;
}

export interface SpecHierarchy extends BaseSpec {
  children?: SpecHierarchy[];
  level?: number;
}

// Dashboard specific types
export interface DashboardStats {
  summary: {
    epics: number;
    features: number;
    tasks: number;
    completed: number;
    inProgress: number;
    blocked: number;
  };
  progressByEpic: Record<string, {
    total: number;
    completed: number;
    percentage: number;
    title: string;
  }>;
}

export interface EpicProgress {
  epicId: string;
  title: string;
  progress: number;
  tasks: {
    completed: number;
    total: number;
  };
  status: SpecStatus;
}

export interface RecentActivity {
  id: string;
  specId: string;
  specTitle: string;
  action: 'created' | 'updated' | 'completed' | 'blocked';
  timestamp: string;
  user?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export type SpecTreeResponse = ApiResponse<SpecHierarchy[]>;
export type DashboardStatsResponse = ApiResponse<DashboardStats>;
export type EpicProgressResponse = ApiResponse<EpicProgress[]>;
export type RecentActivityResponse = ApiResponse<RecentActivity[]>;