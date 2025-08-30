import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spec } from './spec.entity';
import { SpecsService } from './specs.service';
import { SpecsController } from './specs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Spec])],
  providers: [SpecsService],
  controllers: [SpecsController],
})
export class SpecsModule {}
