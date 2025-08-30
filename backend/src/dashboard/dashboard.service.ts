import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Spec } from '../specs/spec.entity';

import { DashboardStatsDto, SpecTreeNodeDto, EpicProgressResponseDto, RecentActivityResponseDto, EpicProgressItemDto, RecentActivityItemDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Spec)
    private specRepository: Repository<Spec>,
  ) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    // Get counts by type
    const epicCount = await this.specRepository.count({ where: { type: 'epic' } });
    const featureCount = await this.specRepository.count({ where: { type: 'feature' } });
    const taskCount = await this.specRepository.count({ where: { type: 'task' } });

    // Get counts by status across all types  
    const completed = await this.specRepository.count({ where: { status: 'completed' } });
    const inProgress = await this.specRepository.count({ where: { status: 'draft' } }); // draft means in progress in our data
    const blocked = await this.specRepository.count({ where: { status: 'blocked' } });

    // Calculate progress by epic
    const epics = await this.specRepository.find({ where: { type: 'epic' } });
    const progressByEpic: Record<string, { total: number; completed: number; percentage: number; title: string }> = {};

    for (const epic of epics) {
      const epicSpecs = await this.specRepository
        .createQueryBuilder('spec')
        .where('spec.hierarchical_id LIKE :pattern', { pattern: `${epic.hierarchical_id}%` })
        .getMany();

      const total = epicSpecs.filter(s => s.type !== 'epic').length; // Exclude the epic itself
      const completedItems = epicSpecs.filter(s => s.status === 'completed' && s.type !== 'epic').length;

      progressByEpic[epic.hierarchical_id || epic.id] = {
        total,
        completed: completedItems,
        percentage: total > 0 ? Math.round((completedItems / total) * 100) : 0,
        title: epic.title
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
    const epics = await this.specRepository.find({
      where: { type: 'epic' },
      order: { hierarchical_id: 'ASC' }
    });

    const treeNodes: SpecTreeNodeDto[] = [];

    for (const epic of epics) {
      const epicFeatures = await this.specRepository.find({
        where: { type: 'feature', parent: epic.hierarchical_id },
        order: { hierarchical_id: 'ASC' }
      });

      const featureNodes: SpecTreeNodeDto[] = [];

      for (const feature of epicFeatures) {
        const featureTasks = await this.specRepository.find({
          where: { type: 'task', parent: feature.hierarchical_id },
          order: { hierarchical_id: 'ASC' }
        });

        const taskNodes: SpecTreeNodeDto[] = featureTasks.map(task => ({
          id: task.hierarchical_id || task.id,
          title: task.title,
          type: 'task' as const,
          status: task.status,
        }));

        // Calculate feature progress
        const totalTasks = featureTasks.length;
        const completedTasks = featureTasks.filter(t => t.status === 'completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        featureNodes.push({
          id: feature.hierarchical_id || feature.id,
          title: feature.title,
          type: 'feature' as const,
          status: feature.status,
          progress,
          children: taskNodes,
        });
      }

      // Calculate epic progress - count all tasks under this epic
      const allTasks = await this.specRepository
        .createQueryBuilder('spec')
        .where('spec.hierarchical_id LIKE :pattern', { pattern: `${epic.hierarchical_id}%` })
        .andWhere('spec.type = :type', { type: 'task' })
        .getMany();
      
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(t => t.status === 'completed').length;
      const epicProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      treeNodes.push({
        id: epic.hierarchical_id || epic.id,
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
    const epics = await this.specRepository.find({
      where: { type: 'epic' },
      order: { hierarchical_id: 'ASC' }
    });

    const epicProgress: EpicProgressItemDto[] = [];

    for (const epic of epics) {
      const allTasks = await this.specRepository
        .createQueryBuilder('spec')
        .where('spec.hierarchical_id LIKE :pattern', { pattern: `${epic.hierarchical_id}%` })
        .andWhere('spec.type = :type', { type: 'task' })
        .getMany();
      
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(t => t.status === 'completed').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      epicProgress.push({
        epicId: epic.hierarchical_id || epic.id,
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
    // Get recently updated specs
    const recentSpecs = await this.specRepository.find({
      order: { updated: 'DESC' },
      take: 10
    });

    const activities: RecentActivityItemDto[] = recentSpecs.map((spec, index) => ({
      id: `${spec.id}-${index}`,
      action: spec.status === 'completed' ? 'completed' as const : 
             spec.status === 'in_progress' ? 'updated' as const : 
             'created' as const,
      specId: spec.hierarchical_id || spec.id,
      specTitle: spec.title,
      timestamp: new Date(spec.updated).toISOString()
    }));

    return { data: activities };
  }
}