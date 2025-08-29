import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epic } from '../specs/epic.entity';
import { Feature } from '../specs/feature.entity';
import { Task } from '../specs/task.entity';

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
  }>;
}

export interface SpecTreeNode {
  id: string;
  title: string;
  type: 'epic' | 'feature' | 'task';
  status: string;
  progress?: number;
  children?: SpecTreeNode[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Epic)
    private epicRepository: Repository<Epic>,
    @InjectRepository(Feature)
    private featureRepository: Repository<Feature>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    // Get counts by type
    const epicCount = await this.epicRepository.count();
    const featureCount = await this.featureRepository.count();
    const taskCount = await this.taskRepository.count();

    // Get counts by status across all types
    const completedEpics = await this.epicRepository.count({ where: { status: 'done' } });
    const completedFeatures = await this.featureRepository.count({ where: { status: 'done' } });
    const completedTasks = await this.taskRepository.count({ where: { status: 'done' } });
    const completed = completedEpics + completedFeatures + completedTasks;

    const inProgressEpics = await this.epicRepository.count({ where: { status: 'in_progress' } });
    const inProgressFeatures = await this.featureRepository.count({ where: { status: 'in_progress' } });
    const inProgressTasks = await this.taskRepository.count({ where: { status: 'in_progress' } });
    const inProgress = inProgressEpics + inProgressFeatures + inProgressTasks;

    const blockedEpics = await this.epicRepository.count({ where: { status: 'blocked' } });
    const blockedFeatures = await this.featureRepository.count({ where: { status: 'blocked' } });
    const blockedTasks = await this.taskRepository.count({ where: { status: 'blocked' } });
    const blocked = blockedEpics + blockedFeatures + blockedTasks;

    // Calculate progress by epic
    const epics = await this.epicRepository.find();
    const progressByEpic: Record<string, { total: number; completed: number; percentage: number }> = {};

    for (const epic of epics) {
      const epicFeatures = await this.featureRepository.find({
        where: { epic_code: epic.epic_code }
      });
      const epicTasks = await this.taskRepository.find({
        where: { epic_code: epic.epic_code }
      });

      const total = epicFeatures.length + epicTasks.length;
      const completedFeatures = epicFeatures.filter(f => f.status === 'done').length;
      const completedTasks = epicTasks.filter(t => t.status === 'done').length;
      const completedItems = completedFeatures + completedTasks;

      progressByEpic[epic.epic_code] = {
        total,
        completed: completedItems,
        percentage: total > 0 ? Math.round((completedItems / total) * 100) : 0
      };
    }

    return {
      summary: {
        epics: epicCount,
        features: featureCount,
        tasks: taskCount,
        completed,
        inProgress,
        blocked,
      },
      progressByEpic,
    };
  }

  async getSpecTree(): Promise<SpecTreeNode[]> {
    const epics = await this.epicRepository.find({
      order: { epic_code: 'ASC' }
    });

    const treeNodes: SpecTreeNode[] = [];

    for (const epic of epics) {
      const epicFeatures = await this.featureRepository.find({
        where: { epic_code: epic.epic_code },
        order: { feature_code: 'ASC' }
      });

      const featureNodes: SpecTreeNode[] = [];

      for (const feature of epicFeatures) {
        const featureTasks = await this.taskRepository.find({
          where: { feature_code: feature.feature_code },
          order: { task_code: 'ASC' }
        });

        const taskNodes: SpecTreeNode[] = featureTasks.map(task => ({
          id: task.task_code,
          title: task.title,
          type: 'task' as const,
          status: task.status,
        }));

        // Calculate feature progress
        const totalTasks = featureTasks.length;
        const completedTasks = featureTasks.filter(t => t.status === 'done').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        featureNodes.push({
          id: feature.feature_code,
          title: feature.title,
          type: 'feature' as const,
          status: feature.status,
          progress,
          children: taskNodes,
        });
      }

      // Calculate epic progress
      const allTasks = await this.taskRepository.find({
        where: { epic_code: epic.epic_code }
      });
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(t => t.status === 'done').length;
      const epicProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      treeNodes.push({
        id: epic.epic_code,
        title: epic.title,
        type: 'epic' as const,
        status: epic.status,
        progress: epicProgress,
        children: featureNodes,
      });
    }

    return treeNodes;
  }
}