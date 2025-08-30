import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController, SpecsController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Spec } from '../specs/spec.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Spec]),
  ],
  controllers: [DashboardController, SpecsController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}