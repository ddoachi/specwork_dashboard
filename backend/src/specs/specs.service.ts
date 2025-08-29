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
}
