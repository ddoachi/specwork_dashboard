import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './dashboard/dashboard.module';
import { Epic } from './specs/epic.entity';
import { Feature } from './specs/feature.entity';
import { Task } from './specs/task.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db/specs.sqlite',
      entities: [Epic, Feature, Task],
      synchronize: true, // Dev only - will create tables automatically
      logging: true,
    }),
    DashboardModule,
  ],
})
export class AppModule {}
