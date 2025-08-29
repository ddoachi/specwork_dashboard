import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epic } from '../specs/epic.entity';
import { Feature } from '../specs/feature.entity';
import { Task } from '../specs/task.entity';

import { DashboardStatsDto, SpecTreeNodeDto, EpicProgressResponseDto, RecentActivityResponseDto, EpicProgressItemDto, RecentActivityItemDto } from './dto/dashboard.dto';

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

  async getDashboardStats(): Promise<DashboardStatsDto> {
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

  async getSpecTree(): Promise<SpecTreeNodeDto[]> {
    const epics = await this.epicRepository.find({
      order: { epic_code: 'ASC' }
    });

    const treeNodes: SpecTreeNodeDto[] = [];

    for (const epic of epics) {
      const epicFeatures = await this.featureRepository.find({
        where: { epic_code: epic.epic_code },
        order: { feature_code: 'ASC' }
      });

      const featureNodes: SpecTreeNodeDto[] = [];

      for (const feature of epicFeatures) {
        const featureTasks = await this.taskRepository.find({
          where: { feature_code: feature.feature_code },
          order: { task_code: 'ASC' }
        });

        const taskNodes: SpecTreeNodeDto[] = featureTasks.map(task => ({
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

  async getEpicProgress(): Promise<EpicProgressResponseDto> {
    const epics = await this.epicRepository.find({
      order: { epic_code: 'ASC' }
    });

    const epicProgress: EpicProgressItemDto[] = [];

    for (const epic of epics) {
      const allTasks = await this.taskRepository.find({
        where: { epic_code: epic.epic_code }
      });
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(t => t.status === 'done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      epicProgress.push({
        epicId: epic.epic_code,
        title: epic.title,
        status: epic.status,
        progress,
        tasks: {
          completed: completedTasks,
          total: totalTasks
        }
      });
    }

    return { data: epicProgress };
  }

  async getRecentActivity(): Promise<RecentActivityResponseDto> {
    // Mock data for now - in a real app you'd track activity logs
    const activities: RecentActivityItemDto[] = [
      {
        id: '1',
        action: 'completed' as const,
        specId: 'T1025',
        specTitle: 'Design system foundation',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
      },
      {
        id: '2', 
        action: 'updated' as const,
        specId: 'F1002',
        specTitle: 'User authentication system',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
      },
      {
        id: '3',
        action: 'created' as const, 
        specId: 'T1026',
        specTitle: 'API endpoint implementation',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
      }
    ];

    return { data: activities };
  }
}