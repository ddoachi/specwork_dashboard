import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController, SpecsController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SpecSyncService } from '../specs/spec-sync.service';
import { Epic } from '../specs/epic.entity';
import { Feature } from '../specs/feature.entity';
import { Task } from '../specs/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Epic, Feature, Task]),
  ],
  controllers: [DashboardController, SpecsController],
  providers: [DashboardService, SpecSyncService],
  exports: [DashboardService, SpecSyncService],
})
export class DashboardModule {}