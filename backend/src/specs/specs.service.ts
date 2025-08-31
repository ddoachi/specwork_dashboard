import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Spec } from './spec.entity';
import { UpsertSpecDto } from './dto/upsert-spec.dto';
import { BatchSyncDto } from './dto/batch-sync.dto';

// Helper functions for hierarchical ID operations
function parseHierarchicalId(hierarchicalId: string): { epic?: string; feature?: string; task?: string } {
  const parts = hierarchicalId.split('-');
  const result: { epic?: string; feature?: string; task?: string } = {};
  
  if (parts.length >= 1 && parts[0].startsWith('E')) result.epic = parts[0];
  if (parts.length >= 2 && parts[1].startsWith('F')) result.feature = `${parts[0]}-${parts[1]}`;
  if (parts.length >= 3 && parts[2].startsWith('T')) result.task = `${parts[0]}-${parts[1]}-${parts[2]}`;
  
  return result;
}

// Extract ID from markdown link format [ID](path) or return as-is
function extractIdFromMarkdownLink(value: string | undefined | null): string | null {
  if (!value) return null;
  // Check if it's a markdown link format
  const match = value.match(/^\[([^\]]+)\]/);
  return match ? match[1] : value;
}

// Normalize children array (extract IDs from markdown links)
function normalizeChildren(children: any[] | undefined): string[] {
  if (!children) return [];
  return children.map(child => {
    if (typeof child === 'string') {
      const extracted = extractIdFromMarkdownLink(child);
      return extracted || child;
    }
    return child;
  }).filter(Boolean);
}

// Parse hours to number (handle string or number input)
function parseHours(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Normalize commits array (handle both string and object formats)
function normalizeCommits(commits: any[] | undefined): string[] {
  if (!commits) return [];
  return commits.map(commit => {
    if (typeof commit === 'string') return commit;
    // Handle object format { hash: 'abc123', text: 'commit message' }
    if (typeof commit === 'object' && commit !== null) {
      return commit.hash || commit.text || '';
    }
    return '';
  }).filter(Boolean);
}

@Injectable()
export class SpecsService {
  constructor(
    @InjectRepository(Spec) private specs: Repository<Spec>,
  ) {}

  async upsert(dto: UpsertSpecDto) {
    const spec = this.specs.create({
      id: dto.id,
      hierarchical_id: dto.hierarchical_id,
      title: dto.title,
      type: dto.type,
      parent: extractIdFromMarkdownLink(dto.parent) ?? null,
      status: dto.status,
      priority: dto.priority,
      created: dto.created,
      updated: dto.updated,
      estimated_hours: dto.estimated_hours,
      actual_hours: dto.actual_hours,
      context_file: dto.context_file ?? null,
      effort: dto.effort ?? null,
      risk: dto.risk ?? null,
      children: normalizeChildren(dto.children),
      commits: normalizeCommits(dto.commits),
      pull_requests: dto.pull_requests ?? [],
    });
    
    await this.specs.save(spec);
    return this.findOne(dto.hierarchical_id || dto.id);
  }

  async findOne(hierarchicalId: string) {
    // Try to find by hierarchical_id first, then fallback to id
    let spec = await this.specs.findOne({ 
      where: { hierarchical_id: hierarchicalId } 
    });
    
    if (!spec) {
      spec = await this.specs.findOne({ 
        where: { id: hierarchicalId } 
      });
    }
    
    return spec;
  }

  async list(params: { status?: string; type?: string; epic?: string; parent?: string }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    
    // Filter by epic using hierarchical ID pattern
    if (params.epic) {
      where.hierarchical_id = Like(`${params.epic}%`);
    }
    
    // Filter by parent
    if (params.parent) {
      where.parent = params.parent;
    }

    return await this.specs.find({ 
      where, 
      order: { updated: 'DESC' } 
    });
  }

  async batchSync(dto: BatchSyncDto) {
    // Use a transaction for atomicity
    const queryRunner = this.specs.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get all existing hierarchical IDs for comparison
      const existingSpecs = await queryRunner.manager.find(Spec);
      const existingHierarchicalIds = new Set(existingSpecs.map(s => s.hierarchical_id).filter(Boolean));
      
      // Get incoming hierarchical IDs
      const incomingHierarchicalIds = new Set(
        Object.values(dto.specs).map(specData => specData.hierarchical_id).filter(Boolean)
      );

      // Determine specs to delete (exist in DB but not in sync data)
      const toDelete = [...existingHierarchicalIds].filter(id => id && !incomingHierarchicalIds.has(id));
      
      // Delete removed specs
      if (toDelete.length > 0) {
        await queryRunner.manager.delete(Spec, { hierarchical_id: In(toDelete) });
      }

      // Process each spec from the sync data
      for (const specData of Object.values(dto.specs)) {
        // Check if spec already exists by hierarchical_id
        const existingSpec = await queryRunner.manager.findOne(Spec, { 
          where: { hierarchical_id: specData.hierarchical_id } 
        });

        // Prepare spec entity with normalized data
        const spec = {
          id: specData.id,
          hierarchical_id: specData.hierarchical_id,
          title: specData.title,
          type: specData.type as any,
          parent: extractIdFromMarkdownLink(specData.parent),
          status: (specData.status || 'draft') as any,
          priority: (specData.priority || 'medium') as any,
          created: specData.created,
          updated: specData.updated,
          estimated_hours: parseHours(specData.estimated_hours),
          actual_hours: parseHours(specData.actual_hours),
          context_file: null,
          effort: null,
          risk: null,
          children: normalizeChildren(specData.children),
          commits: normalizeCommits(specData.commits),
          pull_requests: specData.pull_requests || [],
        };

        if (existingSpec) {
          // Update existing record
          await queryRunner.manager.update(Spec, { hierarchical_id: specData.hierarchical_id }, spec);
        } else {
          // Insert new record
          await queryRunner.manager.insert(Spec, spec);
        }
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Return sync summary
      return {
        success: true,
        synced: incomingHierarchicalIds.size,
        deleted: toDelete.length,
        stats: dto.stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
}
