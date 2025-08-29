'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { RecentActivity as RecentActivityType } from "@/app/lib/types";
import { Clock, CheckCircle, AlertCircle, PlusCircle, Edit3 } from "lucide-react";

interface RecentActivityProps {
  activities: RecentActivityType[];
  loading?: boolean;
}

const actionIcons = {
  created: PlusCircle,
  updated: Edit3,
  completed: CheckCircle,
  blocked: AlertCircle,
};

const actionColors = {
  created: "text-blue-600",
  updated: "text-yellow-600", 
  completed: "text-green-600",
  blocked: "text-red-600",
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function RecentActivity({ activities, loading = false }: RecentActivityProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => {
              const IconComponent = actionIcons[activity.action];
              const colorClass = actionColors[activity.action];
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 ${colorClass} mt-0.5`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.specId}</span> was {activity.action}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.specTitle}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}