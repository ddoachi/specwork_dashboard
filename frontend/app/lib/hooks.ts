'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  fetchDashboardStats, 
  fetchEpicProgress, 
  fetchRecentActivity, 
  fetchSpecTree, 
  queryKeys 
} from './api';

// Custom hooks for easier data fetching in components
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useEpicProgress() {
  return useQuery({
    queryKey: queryKeys.epicProgress,
    queryFn: fetchEpicProgress,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.recentActivity,
    queryFn: fetchRecentActivity,
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useSpecTree() {
  return useQuery({
    queryKey: queryKeys.specTree,
    queryFn: fetchSpecTree,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}