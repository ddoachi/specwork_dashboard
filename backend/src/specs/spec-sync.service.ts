import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as matter from 'gray-matter';
import * as glob from 'fast-glob';
import { Epic } from './epic.entity';
import { Feature } from './feature.entity';
import { Task } from './task.entity';

interface ParsedSpec {
  id: string;
  title: string;
  type: 'epic' | 'feature' | 'task';
  epic?: string;
  parent?: string;
  children?: string[];
  status?: string;
  priority?: string;
  created?: string;
  updated?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  effort?: string;
  risk?: string;
  domain?: string;
  context_file?: string;
  files?: string[];
  tags?: string[];
  pull_requests?: string[];
  commits?: string[];
  dependencies?: string[];
  blocks?: string[];
  related?: string[];
  deliverables?: string[];
  acceptance_criteria?: number;
  acceptance_met?: number;
  test_coverage?: number;
  filePath?: string;
}

export interface SyncResult {
  processed: number;
  epics: number;
  features: number;
  tasks: number;
  errors: string[];
}

@Injectable()
export class SpecSyncService {
  private readonly logger = new Logger(SpecSyncService.name);
  private readonly specsPath = '/home/joohan/dev/project-jts/jts/specs';

  constructor(
    @InjectRepository(Epic)
    private epicRepository: Repository<Epic>,
    @InjectRepository(Feature)
    private featureRepository: Repository<Feature>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async syncSpecs(): Promise<SyncResult> {
    const result: SyncResult = {
      processed: 0,
      epics: 0,
      features: 0,
      tasks: 0,
      errors: []
    };

    try {
      // Find all spec.md files
      const specFiles = await glob('**/spec.md', {
        cwd: this.specsPath,
        absolute: true
      });

      this.logger.log(`Found ${specFiles.length} spec files`);

      const parsedSpecs: ParsedSpec[] = [];

      // Parse all spec files
      for (const filePath of specFiles) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          const parsed = matter(content);
          const data = parsed.data;

          // Skip if no valid frontmatter
          if (!data.id || !data.title || !data.type) {
            this.logger.warn(`Skipping ${filePath}: missing required fields (id, title, type)`);
            continue;
          }

          const spec: ParsedSpec = {
            id: data.id,
            title: data.title,
            type: data.type,
            epic: data.epic,
            parent: data.parent,
            children: data.children || [],
            status: data.status || 'draft',
            priority: data.priority || 'medium',
            created: data.created,
            updated: data.updated,
            due_date: data.due_date,
            estimated_hours: data.estimated_hours || 0,
            actual_hours: data.actual_hours || 0,
            effort: data.effort,
            risk: data.risk,
            domain: data.domain,
            context_file: data.context_file,
            files: data.files || [],
            tags: data.tags || [],
            pull_requests: data.pull_requests || [],
            commits: data.commits || [],
            dependencies: data.dependencies || [],
            blocks: data.blocks || [],
            related: data.related || [],
            deliverables: data.deliverables || [],
            acceptance_criteria: data.acceptance_criteria,
            acceptance_met: data.acceptance_met,
            test_coverage: data.test_coverage,
            filePath: filePath
          };

          parsedSpecs.push(spec);
          result.processed++;

        } catch (error) {
          const errorMsg = `Error parsing ${filePath}: ${error.message}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Clear existing data
      await this.taskRepository.clear();
      await this.featureRepository.clear();
      await this.epicRepository.clear();

      // Process epics first
      const epics = parsedSpecs.filter(spec => spec.type === 'epic');
      for (const spec of epics) {
        try {
          const epic = new Epic();
          epic.id = spec.id;
          epic.epic_code = this.extractCodeFromPath(spec.filePath!, 'epic');
          epic.title = spec.title;
          epic.domain = spec.domain;
          epic.status = spec.status as any;
          epic.priority = spec.priority as any;
          epic.created = spec.created || new Date().toISOString().split('T')[0];
          epic.updated = spec.updated || new Date().toISOString().split('T')[0];
          epic.due_date = spec.due_date;
          epic.estimated_hours = spec.estimated_hours || 0;
          epic.actual_hours = spec.actual_hours || 0;
          epic.effort = spec.effort as any;
          epic.risk = spec.risk as any;
          epic.context_file = spec.context_file;
          epic.file_path = spec.filePath;
          epic.tags = spec.tags;
          epic.files = spec.files;
          epic.pull_requests = spec.pull_requests;
          epic.commits = spec.commits;

          await this.epicRepository.save(epic);
          result.epics++;
        } catch (error) {
          const errorMsg = `Error saving epic ${spec.id}: ${error.message}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Process features
      const features = parsedSpecs.filter(spec => spec.type === 'feature');
      for (const spec of features) {
        try {
          const feature = new Feature();
          feature.id = spec.id;
          feature.feature_code = this.extractCodeFromPath(spec.filePath!, 'feature');
          feature.epic_code = this.extractEpicFromPath(spec.filePath!);
          feature.title = spec.title;
          feature.domain = spec.domain;
          feature.status = spec.status as any;
          feature.priority = spec.priority as any;
          feature.created = spec.created || new Date().toISOString().split('T')[0];
          feature.updated = spec.updated || new Date().toISOString().split('T')[0];
          feature.due_date = spec.due_date;
          feature.estimated_hours = spec.estimated_hours || 0;
          feature.actual_hours = spec.actual_hours || 0;
          feature.effort = spec.effort as any;
          feature.risk = spec.risk as any;
          feature.context_file = spec.context_file;
          feature.file_path = spec.filePath;
          feature.tags = spec.tags;
          feature.files = spec.files;
          feature.pull_requests = spec.pull_requests;
          feature.commits = spec.commits;
          feature.dependencies = spec.dependencies;
          feature.blocks = spec.blocks;
          feature.related = spec.related;

          await this.featureRepository.save(feature);
          result.features++;
        } catch (error) {
          const errorMsg = `Error saving feature ${spec.id}: ${error.message}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Process tasks
      const tasks = parsedSpecs.filter(spec => spec.type === 'task');
      for (const spec of tasks) {
        try {
          const task = new Task();
          task.id = spec.id;
          task.task_code = this.extractCodeFromPath(spec.filePath!, 'task');
          task.feature_code = this.extractFeatureFromPath(spec.filePath!);
          task.epic_code = this.extractEpicFromPath(spec.filePath!);
          task.title = spec.title;
          task.domain = spec.domain;
          task.status = spec.status as any;
          task.priority = spec.priority as any;
          task.created = spec.created || new Date().toISOString().split('T')[0];
          task.updated = spec.updated || new Date().toISOString().split('T')[0];
          task.due_date = spec.due_date;
          task.estimated_hours = spec.estimated_hours || 0;
          task.actual_hours = spec.actual_hours || 0;
          task.effort = spec.effort as any;
          task.risk = spec.risk as any;
          task.context_file = spec.context_file;
          task.file_path = spec.filePath;
          task.tags = spec.tags;
          task.files = spec.files;
          task.pull_requests = spec.pull_requests;
          task.commits = spec.commits;
          task.dependencies = spec.dependencies;
          task.blocks = spec.blocks;
          task.related = spec.related;
          task.deliverables = spec.deliverables;
          task.acceptance_criteria = spec.acceptance_criteria;
          task.acceptance_met = spec.acceptance_met;
          task.test_coverage = spec.test_coverage;

          await this.taskRepository.save(task);
          result.tasks++;
        } catch (error) {
          const errorMsg = `Error saving task ${spec.id}: ${error.message}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      this.logger.log(`Sync completed: ${result.epics} epics, ${result.features} features, ${result.tasks} tasks`);

    } catch (error) {
      const errorMsg = `Sync failed: ${error.message}`;
      this.logger.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  private extractCodeFromPath(filePath: string, type: 'epic' | 'feature' | 'task'): string {
    const pathParts = filePath.split('/');
    
    if (type === 'epic') {
      // Pattern: /specs/E01/spec.md -> E01
      const epicDir = pathParts.find(part => part.match(/^E\d+$/));
      return epicDir || 'E00';
    } else if (type === 'feature') {
      // Pattern: /specs/E01/F01/spec.md -> F01
      const featureDir = pathParts.find(part => part.match(/^F\d+$/));
      return featureDir || 'F00';
    } else {
      // Pattern: /specs/E01/F01/T01/spec.md -> T01
      const taskDir = pathParts.find(part => part.match(/^T\d+$/));
      return taskDir || 'T00';
    }
  }

  private extractEpicFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const epicDir = pathParts.find(part => part.match(/^E\d+$/));
    return epicDir || 'E00';
  }

  private extractFeatureFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const featureDir = pathParts.find(part => part.match(/^F\d+$/));
    return featureDir || 'F00';
  }
}