import axios from 'axios';
import { 
  DashboardStats, 
  SpecHierarchy, 
  EpicProgress, 
  RecentActivity,
  DashboardStatsResponse,
  SpecTreeResponse,
  EpicProgressResponse,
  RecentActivityResponse
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Original spec functions (keeping for compatibility)
export async function fetchSpecs() {
  const res = await fetch(`${API_BASE}/specs`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch specs");
  return res.json();
}

export async function fetchSpec(id: string) {
  const res = await fetch(`${API_BASE}/specs/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch spec " + id);
  return res.json();
}

// Dashboard API functions
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStatsResponse>('/dashboard/stats');
  return response.data.data;
}

export async function fetchSpecTree(): Promise<SpecHierarchy[]> {
  const response = await api.get<SpecTreeResponse>('/specs/tree');
  return response.data.data;
}

export async function fetchEpicProgress(): Promise<EpicProgress[]> {
  const response = await api.get<EpicProgressResponse>('/dashboard/epic-progress');
  return response.data.data;
}

export async function fetchRecentActivity(): Promise<RecentActivity[]> {
  const response = await api.get<RecentActivityResponse>('/dashboard/recent-activity');
  return response.data.data;
}

export async function syncSpecs(): Promise<{ message: string }> {
  const response = await api.post('/specs/sync');
  return response.data;
}

// React Query keys for caching
export const queryKeys = {
  dashboardStats: ['dashboard', 'stats'] as const,
  specTree: ['specs', 'tree'] as const,
  epicProgress: ['dashboard', 'epic-progress'] as const,
  recentActivity: ['dashboard', 'recent-activity'] as const,
};
