'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  color: 'purple' | 'blue' | 'green' | 'amber' | 'red';
  trend?: number;
  icon?: React.ReactNode;
}

const colorClasses = {
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-green-50 border-green-200 text-green-900',
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  red: 'bg-red-50 border-red-200 text-red-900',
};

export function StatsCard({ title, value, color, trend, icon }: StatsCardProps) {
  return (
    <Card data-testid="stats-card" className={cn("transition-all hover:shadow-md", colorClasses[color])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className={cn(
            "text-xs mt-1",
            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-600"
          )}>
            {trend > 0 ? "+" : ""}{trend}% from last week
          </p>
        )}
      </CardContent>
    </Card>
  );
}