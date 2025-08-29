'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { ChevronDown, ChevronRight, Folder, FileText, CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";
import { SpecHierarchy } from "@/app/lib/types";
import { getStatusColor, cn } from "@/app/lib/utils";

interface TreeNodeProps {
  node: SpecHierarchy;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}

const typeIcons = {
  epic: Folder,
  feature: FileText,
  task: Circle,
};

const statusIcons = {
  completed: CheckCircle2,
  in_progress: Clock,
  blocked: AlertCircle,
  on_hold: Circle,
  not_started: Circle,
};

function TreeNode({ node, level, expanded, onToggle }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const TypeIcon = typeIcons[node.type];
  const StatusIcon = statusIcons[node.status];
  
  const indentClass = level === 0 ? '' : `ml-${Math.min(level * 4, 16)}`;
  
  return (
    <div data-testid="tree-node" className={cn("border-l border-gray-200", level > 0 && indentClass)}>
      <Collapsible open={isExpanded} onOpenChange={() => onToggle(node.id)}>
        <CollapsibleTrigger data-testid="tree-node-toggle" asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start p-2 h-auto font-normal hover:bg-gray-50",
              level > 0 && "ml-4 border-l border-gray-200 rounded-l-none"
            )}
          >
            <div className="flex items-center space-x-2 text-left w-full">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
              
              <TypeIcon className={cn(
                "h-4 w-4",
                node.type === 'epic' ? 'text-purple-600' :
                node.type === 'feature' ? 'text-blue-600' : 'text-green-600'
              )} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {node.id}: {node.title}
                  </span>
                  
                  <div className="flex items-center space-x-2 ml-2">
                    {node.progress !== undefined && (
                      <span className="text-xs text-gray-500">
                        {node.progress}%
                      </span>
                    )}
                    
                    <StatusIcon className={cn(
                      "h-4 w-4",
                      node.status === 'completed' ? 'text-green-600' :
                      node.status === 'in_progress' ? 'text-blue-600' :
                      node.status === 'blocked' ? 'text-red-600' :
                      'text-gray-400'
                    )} />
                    
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getStatusColor(node.status)
                    )}>
                      {node.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
                
                {node.description && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {node.description}
                  </p>
                )}
              </div>
            </div>
          </Button>
        </CollapsibleTrigger>
        
        {hasChildren && (
          <CollapsibleContent>
            <div className="space-y-1">
              {node.children!.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

interface SpecTreeViewProps {
  specs: SpecHierarchy[];
  loading?: boolean;
}

export function SpecTreeView({ specs, loading = false }: SpecTreeViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: SpecHierarchy[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        if (node.children) {
          collectIds(node.children);
        }
      });
    };
    collectIds(specs);
    setExpanded(allIds);
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Specification Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
        <div className="flex items-center justify-between">
          <CardTitle>Specification Hierarchy</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {specs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No specifications found
            </div>
          ) : (
            specs.map((spec) => (
              <TreeNode
                key={spec.id}
                node={spec}
                level={0}
                expanded={expanded}
                onToggle={toggleExpand}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}