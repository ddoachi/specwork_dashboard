'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { StatsCard } from "@/app/components/dashboard/stats-card";
import { EpicProgressList } from "@/app/components/dashboard/epic-progress-bar";
import { RecentActivity } from "@/app/components/dashboard/recent-activity";
import { SpecTreeView } from "@/app/components/dashboard/spec-tree-view";
import { 
  fetchDashboardStats, 
  fetchEpicProgress, 
  fetchRecentActivity, 
  fetchSpecTree, 
  syncSpecs,
  queryKeys 
} from "@/app/lib/api";
import { 
  BarChart3, 
  FileText, 
  Target, 
  TrendingUp, 
  RefreshCw, 
  Loader2,
  AlertCircle
} from "lucide-react";

function LoadingCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Error loading data</p>
        </div>
        <p className="text-xs text-red-600 mt-1">{message}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2 border-red-200 text-red-700 hover:bg-red-100"
          >
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { 
    data: epics = [], 
    isLoading: epicsLoading, 
    error: epicsError,
    refetch: refetchEpics
  } = useQuery({
    queryKey: queryKeys.epicProgress,
    queryFn: fetchEpicProgress,
    refetchInterval: 5 * 60 * 1000,
  });

  const { 
    data: activities = [], 
    isLoading: activitiesLoading, 
    error: activitiesError,
    refetch: refetchActivities
  } = useQuery({
    queryKey: queryKeys.recentActivity,
    queryFn: fetchRecentActivity,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  const { 
    data: specTree = [], 
    isLoading: specTreeLoading, 
    error: specTreeError,
    refetch: refetchSpecTree
  } = useQuery({
    queryKey: queryKeys.specTree,
    queryFn: fetchSpecTree,
    refetchInterval: 5 * 60 * 1000,
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncSpecs();
      // Invalidate and refetch all queries
      await queryClient.invalidateQueries();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Specwork Dashboard</h1>
              <p className="text-sm text-gray-600">Manage specifications and track project progress</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={statsLoading || epicsLoading || activitiesLoading || specTreeLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Specs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Stats Cards */}
          <div className="lg:col-span-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statsLoading ? (
                <>
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </>
              ) : statsError ? (
                <div className="md:col-span-2 lg:col-span-4">
                  <ErrorCard 
                    message="Failed to load dashboard statistics" 
                    onRetry={() => refetchStats()}
                  />
                </div>
              ) : stats ? (
                <>
                  <StatsCard
                    title="Epics"
                    value={stats.summary.epics}
                    color="purple"
                    icon={<BarChart3 className="h-4 w-4" />}
                  />
                  <StatsCard
                    title="Features"
                    value={stats.summary.features}
                    color="blue"
                    icon={<FileText className="h-4 w-4" />}
                  />
                  <StatsCard
                    title="Tasks"
                    value={stats.summary.tasks}
                    color="green"
                    icon={<Target className="h-4 w-4" />}
                  />
                  <StatsCard
                    title="Progress"
                    value={`${Math.round((stats.summary.completed / (stats.summary.epics + stats.summary.features + stats.summary.tasks)) * 100)}%`}
                    color="amber"
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                </>
              ) : null}
            </div>
          </div>

          {/* Epic Progress and Recent Activity */}
          <div className="lg:col-span-8">
            {epicsError ? (
              <ErrorCard 
                message="Failed to load epic progress" 
                onRetry={() => refetchEpics()}
              />
            ) : (
              <EpicProgressList epics={epics} loading={epicsLoading} />
            )}
          </div>

          <div className="lg:col-span-4">
            {activitiesError ? (
              <ErrorCard 
                message="Failed to load recent activity" 
                onRetry={() => refetchActivities()}
              />
            ) : (
              <RecentActivity activities={activities} loading={activitiesLoading} />
            )}
          </div>

          {/* Spec Tree View */}
          <div className="lg:col-span-12">
            {specTreeError ? (
              <ErrorCard 
                message="Failed to load specification tree" 
                onRetry={() => refetchSpecTree()}
              />
            ) : (
              <SpecTreeView specs={specTree} loading={specTreeLoading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}