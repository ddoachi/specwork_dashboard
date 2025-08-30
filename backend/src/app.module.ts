import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './dashboard/dashboard.module';
import { SpecsModule } from './specs/specs.module';
import { Epic } from './specs/epic.entity';
import { Feature } from './specs/feature.entity';
import { Task } from './specs/task.entity';
import { Spec } from './specs/spec.entity';
import { SpecFile } from './specs/spec-file.entity';
import { SpecCommit } from './specs/spec-commit.entity';
import { SpecPR } from './specs/spec-pr.entity';
import { SpecTag } from './specs/spec-tag.entity';
import { SpecTagMap } from './specs/spec-tag-map.entity';
import { SpecRelation } from './specs/spec-rel.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db/specs.sqlite',
      entities: [Epic, Feature, Task, Spec, SpecFile, SpecCommit, SpecPR, SpecTag, SpecTagMap, SpecRelation],
      synchronize: true, // Dev only - will create tables automatically
      logging: true,
    }),
    DashboardModule,
    SpecsModule,
  ],
})
export class AppModule {}
