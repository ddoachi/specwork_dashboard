import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spec } from './spec.entity';
import { SpecFile } from './spec-file.entity';
import { SpecCommit } from './spec-commit.entity';
import { SpecPR } from './spec-pr.entity';
import { SpecTag } from './spec-tag.entity';
import { SpecTagMap } from './spec-tag-map.entity';
import { SpecRelation } from './spec-rel.entity';
import { SpecsService } from './specs.service';
import { SpecsController } from './specs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Spec, SpecFile, SpecCommit, SpecPR, SpecTag, SpecTagMap, SpecRelation])],
  providers: [SpecsService],
  controllers: [SpecsController],
})
export class SpecsModule {}
