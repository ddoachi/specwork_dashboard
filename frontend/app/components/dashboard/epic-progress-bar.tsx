'use client';

import { Progress } from "@/app/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { getStatusColor } from "@/app/lib/utils";
import { EpicProgress } from "@/app/lib/types";

interface EpicProgressBarProps {
  epic: EpicProgress;
}

export function EpicProgressBar({ epic }: EpicProgressBarProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">
              {epic.epicId}: {epic.title}
            </CardTitle>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(epic.status)}`}>
              {epic.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div className="font-medium">{epic.progress}%</div>
            <div>{epic.tasks.completed}/{epic.tasks.total} tasks</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Progress 
          value={epic.progress} 
          className="h-3"
        />
      </CardContent>
    </Card>
  );
}

interface EpicProgressListProps {
  epics: EpicProgress[];
  loading?: boolean;
}

export function EpicProgressList({ epics, loading = false }: EpicProgressListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Epic Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 rounded"></div>
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
        <CardTitle>Epic Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {epics.map((epic) => (
            <EpicProgressBar key={epic.epicId} epic={epic} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}