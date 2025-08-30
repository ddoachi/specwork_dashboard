import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Spec } from './spec.entity';
import { SpecFile } from './spec-file.entity';
import { SpecCommit } from './spec-commit.entity';
import { SpecPR } from './spec-pr.entity';
import { SpecTag } from './spec-tag.entity';
import { SpecTagMap } from './spec-tag-map.entity';
import { SpecRelation } from './spec-rel.entity';
import { UpsertSpecDto } from './dto/upsert-spec.dto';
import { BatchSyncDto } from './dto/batch-sync.dto';

// Helper functions for hierarchical ID generation
function generateHierarchicalId(specData: any, allSpecs: Record<string, any>): string {
  if (specData.type === 'epic') {
    return specData.id; // E01, E02, etc.
  } else if (specData.type === 'feature' && specData.parent) {
    return `${specData.parent}-${specData.id}`; // E01-F01, E01-F02, etc.
  } else if (specData.type === 'task' && specData.parent) {
    // Parent is feature ID, need to find epic
    const parentFeature = allSpecs[specData.parent];
    if (parentFeature?.parent) {
      return `${parentFeature.parent}-${specData.parent}-${specData.id}`; // E01-F01-T01
    }
    return `${specData.parent}-${specData.id}`; // Fallback
  } else if (specData.type === 'subtask' && specData.parent) {
    // Parent is task ID, need to find feature and epic
    const parentTask = allSpecs[specData.parent];
    if (parentTask?.parent) {
      const parentFeature = allSpecs[parentTask.parent];
      if (parentFeature?.parent) {
        return `${parentFeature.parent}-${parentTask.parent}-${specData.parent}-${specData.id}`; // E01-F01-T01-S01
      }
    }
    return `${specData.parent}-${specData.id}`; // Fallback
  }
  
  return specData.id; // Fallback to original ID
}

function generateParentHierarchicalId(specData: any, allSpecs: Record<string, any>): string | null {
  if (!specData.parent) return null;
  
  const parentSpec = allSpecs[specData.parent];
  if (!parentSpec) return specData.parent;
  
  return generateHierarchicalId(parentSpec, allSpecs);
}

function findEpicId(specData: any, allSpecs: Record<string, any>): string | null {
  if (specData.type === 'epic') {
    return specData.id;
  } else if (specData.type === 'feature' && specData.parent) {
    return specData.parent; // Parent of feature is epic
  } else if (specData.type === 'task' && specData.parent) {
    const parentFeature = allSpecs[specData.parent];
    return parentFeature?.parent || null; // Epic is grandparent of task
  } else if (specData.type === 'subtask' && specData.parent) {
    const parentTask = allSpecs[specData.parent];
    if (parentTask?.parent) {
      const parentFeature = allSpecs[parentTask.parent];
      return parentFeature?.parent || null; // Epic is great-grandparent of subtask
    }
  }
  
  return null;
}

@Injectable()
export class SpecsService {
  constructor(
    @InjectRepository(Spec) private specs: Repository<Spec>,
    @InjectRepository(SpecFile) private files: Repository<SpecFile>,
    @InjectRepository(SpecCommit) private commits: Repository<SpecCommit>,
    @InjectRepository(SpecPR) private prs: Repository<SpecPR>,
    @InjectRepository(SpecTag) private tags: Repository<SpecTag>,
    @InjectRepository(SpecTagMap) private tagMaps: Repository<SpecTagMap>,
    @InjectRepository(SpecRelation) private rels: Repository<SpecRelation>,
  ) {}

  async upsert(dto: UpsertSpecDto) {
    // 1) main row
    const spec = this.specs.create({
      id: dto.id,
      title: dto.title,
      type: dto.type,
      parent_id: dto.parent ?? null,
      epic_id: dto.epic ?? null,
      domain: dto.domain ?? null,
      status: dto.status,
      priority: dto.priority,
      created: dto.created,
      updated: dto.updated,
      due_date: dto.due_date ?? null,
      estimated_hours: dto.estimated_hours,
      actual_hours: dto.actual_hours,
      context_file: dto.context_file ?? null,
      effort: dto.effort ?? null,
      risk: dto.risk ?? null,
    });
    await this.specs.save(spec);

    // 2) simple clears & re-insert (idempotent)
    await this.files.delete({ spec_id: dto.id });
    await this.files.save(dto.files.map(path => this.files.create({ spec_id: dto.id, path })));

    await this.commits.delete({ spec_id: dto.id });
    await this.commits.save(dto.commits.map(sha => this.commits.create({ spec_id: dto.id, sha })));

    await this.prs.delete({ spec_id: dto.id });
    await this.prs.save(dto.pull_requests.map(url => this.prs.create({ spec_id: dto.id, url })));

    // 3) tags (upsert-by-name)
    if (dto.tags?.length) {
      const existing = await this.tags.find({ where: { name: In(dto.tags) } });
      const existNames = new Set(existing.map(t => t.name));
      const toCreate = dto.tags.filter(n => !existNames.has(n)).map(name => this.tags.create({ name }));
      const created = await this.tags.save(toCreate);
      const all = [...existing, ...created];

      await this.tagMaps.delete({ spec_id: dto.id });
      await this.tagMaps.save(all.map(t => this.tagMaps.create({ spec_id: dto.id, tag_id: t.id })));
    } else {
      await this.tagMaps.delete({ spec_id: dto.id });
    }

    // 4) relations
    await this.rels.delete({ from_id: dto.id });
    const relRows = [
      ...dto.dependencies.map(to => ({ from_id: dto.id, to_id: to, rel_type: 'dependency' as const })),
      ...dto.blocks.map(to => ({ from_id: dto.id, to_id: to, rel_type: 'blocks' as const })),
      ...dto.related.map(to => ({ from_id: dto.id, to_id: to, rel_type: 'related' as const })),
    ];
    if (relRows.length) await this.rels.save(relRows);

    return this.findOne(dto.id);
  }

  async findOne(id: string) {
    const spec = await this.specs.findOne({ where: { id } });
    if (!spec) return null;

    const [files, commits, prs, tagMaps, relFrom] = await Promise.all([
      this.files.find({ where: { spec_id: id } }),
      this.commits.find({ where: { spec_id: id } }),
      this.prs.find({ where: { spec_id: id } }),
      this.tagMaps.find({ where: { spec_id: id } }),
      this.rels.find({ where: { from_id: id } }),
    ]);

    const tags = await this.tags.find({ where: { id: In(tagMaps.map(tm => tm.tag_id)) } });

    return {
      ...spec,
      files: files.map(f => f.path),
      commits: commits.map(c => c.sha),
      pull_requests: prs.map(p => p.url),
      tags: tags.map(t => t.name),
      relations: relFrom,
    };
  }

  async list(params: { status?: string; type?: string; epic?: string; tag?: string }) {
    // 간단한 필터 (필요시 QueryBuilder 확장)
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.epic) where.epic_id = params.epic;

    const rows = await this.specs.find({ where, order: { updated: 'DESC' } });

    if (!params.tag) return rows;

    // tag 필터 추가
    const tag = await this.tags.findOne({ where: { name: params.tag } });
    if (!tag) return [];
    const maps = await this.tagMaps.find({ where: { tag_id: tag.id } });
    const ids = new Set(maps.map(m => m.spec_id));
    return rows.filter(r => ids.has(r.id));
  }

  async batchSync(dto: BatchSyncDto) {
    // Use a transaction for atomicity
    const queryRunner = this.specs.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get all existing spec IDs for comparison
      const existingSpecs = await queryRunner.manager.find(Spec);
      const existingIds = new Set(existingSpecs.map(s => s.id));
      
      // Generate hierarchical IDs for all incoming specs
      const incomingHierarchicalIds = new Set(
        Object.values(dto.specs).map(specData => generateHierarchicalId(specData, dto.specs))
      );

      // Determine specs to delete (exist in DB but not in sync data)
      const toDelete = [...existingIds].filter(id => !incomingHierarchicalIds.has(id));
      
      // Delete removed specs
      if (toDelete.length > 0) {
        await queryRunner.manager.delete(Spec, toDelete);
      }

      // Process each spec from the sync data
      for (const [specId, specData] of Object.entries(dto.specs)) {
        // Generate hierarchical ID for uniqueness
        const hierarchicalId = generateHierarchicalId(specData, dto.specs);
        
        // Prepare spec entity
        const spec = {
          id: hierarchicalId,
          title: specData.title,
          type: specData.type as any,
          parent_id: specData.parent ? generateParentHierarchicalId(specData, dto.specs) : null,
          epic_id: findEpicId(specData, dto.specs),
          domain: null, // Can be extracted from spec metadata if needed
          status: (specData.status || 'draft') as any,
          priority: (specData.priority || 'medium') as any,
          created: specData.created,
          updated: specData.updated,
          due_date: null,
          estimated_hours: specData.estimated_hours || 0,
          actual_hours: specData.actual_hours || 0,
          context_file: null,
          effort: null,
          risk: null,
        };

        // Upsert the spec
        await queryRunner.manager.save(Spec, spec);

        // Clear and re-insert related data using hierarchical ID
        // Files
        await queryRunner.manager.delete(SpecFile, { spec_id: hierarchicalId });
        
        // Commits
        await queryRunner.manager.delete(SpecCommit, { spec_id: hierarchicalId });
        if (specData.commits?.length) {
          const commits = specData.commits.map(sha => ({
            spec_id: hierarchicalId,
            sha
          }));
          await queryRunner.manager.save(SpecCommit, commits);
        }

        // Pull Requests
        await queryRunner.manager.delete(SpecPR, { spec_id: hierarchicalId });
        if (specData.pull_requests?.length) {
          const prs = specData.pull_requests.map(url => ({
            spec_id: hierarchicalId,
            url
          }));
          await queryRunner.manager.save(SpecPR, prs);
        }

        // Relations - we'll handle children as "blocks" relations
        await queryRunner.manager.delete(SpecRelation, { from_id: hierarchicalId });
        if (specData.children?.length) {
          const relations = specData.children.map(childId => ({
            from_id: hierarchicalId,
            to_id: generateHierarchicalId(dto.specs[childId], dto.specs), // Convert child ID to hierarchical
            rel_type: 'blocks' as const
          }));
          await queryRunner.manager.save(SpecRelation, relations);
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
