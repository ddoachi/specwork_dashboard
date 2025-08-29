import axios from 'axios';
import { 
  DashboardStats, 
  SpecHierarchy, 
  EpicProgress, 
  RecentActivity
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - backend might not be running');
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('Network error - check your connection');
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

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
  const response = await api.get<DashboardStats>('/api/dashboard/stats');
  return response.data;
}

export async function fetchSpecTree(): Promise<SpecHierarchy[]> {
  const response = await api.get<SpecHierarchy[]>('/api/specs/tree');
  return response.data;
}

export async function fetchEpicProgress(): Promise<EpicProgress[]> {
  const response = await api.get<{ data: EpicProgress[] }>('/api/dashboard/epic-progress');
  return response.data.data;
}

export async function fetchRecentActivity(): Promise<RecentActivity[]> {
  const response = await api.get<{ data: RecentActivity[] }>('/api/dashboard/recent-activity');
  return response.data.data;
}

export async function syncSpecs(): Promise<{ message: string }> {
  const response = await api.post('/api/specs/sync');
  return response.data;
}

// React Query keys for caching
export const queryKeys = {
  dashboardStats: ['dashboard', 'stats'] as const,
  specTree: ['specs', 'tree'] as const,
  epicProgress: ['dashboard', 'epic-progress'] as const,
  recentActivity: ['dashboard', 'recent-activity'] as const,
};
