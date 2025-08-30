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
      parent: dto.parent ?? null,
      status: dto.status,
      priority: dto.priority,
      created: dto.created,
      updated: dto.updated,
      estimated_hours: dto.estimated_hours,
      actual_hours: dto.actual_hours,
      context_file: dto.context_file ?? null,
      effort: dto.effort ?? null,
      risk: dto.risk ?? null,
      children: dto.children ?? [],
      commits: dto.commits ?? [],
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

        // Prepare spec entity
        const spec = {
          id: specData.id,
          hierarchical_id: specData.hierarchical_id,
          title: specData.title,
          type: specData.type as any,
          parent: specData.parent || null,
          status: (specData.status || 'draft') as any,
          priority: (specData.priority || 'medium') as any,
          created: specData.created,
          updated: specData.updated,
          estimated_hours: specData.estimated_hours || 0,
          actual_hours: specData.actual_hours || 0,
          context_file: null,
          effort: null,
          risk: null,
          children: specData.children || [],
          commits: specData.commits || [],
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
